import { describe, it, expect } from 'vitest';
import { isError, type SafePromise } from 'result-interface';
import {
	VatmiraalClient,
	ping,
	fetchSchema,
	fetchTransactionTypes,
	fetchPartyTypes,
	fetchTransportBy,
	fetchCountries,
	fetchCategories,
	fetchObjectProperties,
	fetchPartyProperties,
	analyzeTaxGrid,
	validateVat,
	fetchVatTemplates,
	fetchVatTemplate,
	inferObject,
	type TaxGridAnalysisRequest
} from '../../index';

const BASE_URL = process.env.VATMIRAAL_E2E_URL ?? 'http://localhost:18080';
const client = new VatmiraalClient({ baseUrl: BASE_URL, token: 'vatmiraal-dev-token' });

// Unwrap a Result, failing the test with the API error message if it is one.
async function ok<T>(label: string, promise: SafePromise<T, Error>): Promise<T> {
	const res = await promise;
	if (isError(res)) {
		throw new Error(`${label} failed: ${res.error.message}`);
	}
	return res.value;
}

const transaction: TaxGridAnalysisRequest = {
	transaction: {
		taxable_point: '2026-03-29',
		type: 'delivery',
		taxable_amount: 100,
		vat_amount: 21,
		supplier: { type: 'company', vat_number: 'BE0123', country: 'belgium', properties: [] },
		receiver: { type: 'company', vat_number: 'FR0456', country: 'france', properties: [] },
		object: { type: 'physical_good', properties: [] }
	},
	perspective: 'supplier'
};

describe('SDK against the live backend', () => {
	it('ping reports the service alive', async () => {
		expect(await ok('ping', ping(client))).toBe(true);
	});

	it('fetches the whole schema and each vocabulary', async () => {
		await ok('fetchSchema', fetchSchema(client));
		await ok('fetchTransactionTypes', fetchTransactionTypes(client));
		await ok('fetchPartyTypes', fetchPartyTypes(client));
		await ok('fetchTransportBy', fetchTransportBy(client));
		await ok('fetchCountries', fetchCountries(client));
		await ok('fetchCategories', fetchCategories(client));
		await ok('fetchObjectProperties', fetchObjectProperties(client));
		await ok('fetchPartyProperties', fetchPartyProperties(client));
	});

	it('analyses a transaction into tax grids', async () => {
		const result = await ok('analyzeTaxGrid', analyzeTaxGrid(client, transaction));
		expect(result.status === 'consistent' || result.status === 'inconsistent').toBe(true);
	});

	it('validates a VAT number and fetches templates', async () => {
		await ok(
			'validateVat',
			validateVat(client, { vat: 'BE0899999999', template_validation: true })
		);
		await ok('fetchVatTemplates', fetchVatTemplates(client));
		await ok('fetchVatTemplate', fetchVatTemplate(client, 'belgium'));
	});

	it('infers candidate objects from a description', async () => {
		await ok('inferObject', inferObject(client, 'consulting services'));
	});
});

describe('OpenAPI completeness', () => {
	// Routes the SDK calls (template form, matching OpenAPI path keys).
	const SDK_ROUTES = new Set([
		'GET /',
		'POST /tax-grid-analysis',
		'POST /vat-validation',
		'GET /vat-template',
		'GET /vat-template/{country}',
		'POST /inference/object',
		'GET /transaction-type',
		'GET /party-type',
		'GET /transport-by',
		'GET /country',
		'GET /category',
		'GET /property/object',
		'GET /property/party'
	]);

	// Routes the spec exposes that the SDK deliberately does not wrap (meta, docs, admin, and the
	// by-value / broad convenience sub-routes). Add here consciously if the SDK should stay lean.
	const NOT_WRAPPED = new Set([
		'GET /openapi.json',
		'GET /doc',
		'GET /doc/',
		'GET /debug',
		'GET /category/broad',
		'GET /category/{value}',
		'GET /category/broad/{value}',
		'GET /property/object/{value}',
		'GET /property/party/{value}'
	]);

	it('the SDK covers every route the API exposes', async () => {
		const res = await fetch(`${BASE_URL}/openapi.json`);
		const spec = (await res.json()) as { paths: Record<string, Record<string, unknown>> };
		const specRoutes = new Set<string>();
		for (const [path, item] of Object.entries(spec.paths)) {
			for (const method of Object.keys(item)) {
				specRoutes.add(`${method.toUpperCase()} ${path}`);
			}
		}

		// Every route the SDK calls must still exist in the spec.
		for (const route of SDK_ROUTES) {
			expect(specRoutes.has(route), `SDK route missing from the API: ${route}`).toBe(true);
		}

		// Every route the API exposes must be either wrapped by the SDK or consciously excluded,
		// so a new backend route without SDK support is caught.
		const uncovered = [...specRoutes].filter((r) => !SDK_ROUTES.has(r) && !NOT_WRAPPED.has(r));
		expect(uncovered, `API routes the SDK does not cover: ${uncovered.join(', ')}`).toEqual([]);
	});
});
