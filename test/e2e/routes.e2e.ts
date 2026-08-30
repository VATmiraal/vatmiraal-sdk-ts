import { describe, it, expect } from 'vitest';
import { isError } from 'result-interface';
import { VatmiraalClient } from '../../lib/client/vatmiraal-client';
import {
	fetchBroadCategories,
	fetchBroadCategory,
	fetchCategories,
	fetchCategory,
	fetchCountryClasses,
	fetchObjectProperties,
	fetchObjectProperty,
	fetchPartyProperties,
	fetchPartyProperty
} from '../../lib/schema/schema';
import { auditScenarios, fetchAuditCapabilities } from '../../lib/audit/audit';
import type { AuditRequest } from '../../lib/audit/audit-types';

// These tests hit a live VATmiraal service. Point them at one with VATMIRAAL_E2E_URL
// (default http://localhost:8080); if it is unreachable the whole suite is skipped.
const BASE_URL = process.env.VATMIRAAL_E2E_URL ?? 'http://localhost:8080';
const TOKEN = process.env.VATMIRAAL_E2E_TOKEN ?? 'e2e';

function first<T>(items: readonly T[]): T {
	const [head] = items;
	if (head === undefined) {
		throw new Error('expected a non-empty list');
	}
	return head;
}

async function reachable(): Promise<boolean> {
	try {
		const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(1500) });
		return res.ok;
	} catch {
		return false;
	}
}

const online = await reachable();
if (!online) {
	console.warn(`[e2e] ${BASE_URL} unreachable — skipping e2e suite`);
}

const client = new VatmiraalClient({ token: TOKEN, baseUrl: BASE_URL });
const live = describe.skipIf(!online);

live('reference-data routes', () => {
	it('lists country classes', async () => {
		const res = await fetchCountryClasses(client);
		expect(isError(res)).toBe(false);
		if (isError(res)) return;
		expect(res.value.length).toBeGreaterThan(0);
		expect(typeof first(res.value).class).toBe('string');
	});

	it('lists broad categories and drills into one', async () => {
		const broad = await fetchBroadCategories(client);
		expect(isError(broad)).toBe(false);
		if (isError(broad)) return;
		const head = first(broad.value);

		const detail = await fetchBroadCategory(client, head.value);
		expect(isError(detail)).toBe(false);
		if (isError(detail)) return;
		expect(detail.value.value).toBe(head.value);
		expect(Array.isArray(detail.value.categories)).toBe(true);
	});

	it('fetches a single category by value', async () => {
		const all = await fetchCategories(client);
		expect(isError(all)).toBe(false);
		if (isError(all)) return;
		const head = first(all.value);

		const one = await fetchCategory(client, head.value);
		expect(isError(one)).toBe(false);
		if (isError(one)) return;
		expect(one.value.value).toBe(head.value);
	});

	it('fetches a single object and party property by value', async () => {
		const objects = await fetchObjectProperties(client);
		expect(isError(objects)).toBe(false);
		if (isError(objects)) return;
		expect(isError(await fetchObjectProperty(client, first(objects.value).value))).toBe(false);

		const parties = await fetchPartyProperties(client);
		expect(isError(parties)).toBe(false);
		if (isError(parties)) return;
		expect(isError(await fetchPartyProperty(client, first(parties.value).value))).toBe(false);
	});
});

live('audit routes', () => {
	it('describes the audit input model', async () => {
		const res = await fetchAuditCapabilities(client);
		expect(isError(res)).toBe(false);
		if (isError(res)) return;
		expect(typeof res.value.response_type).toBe('string');
		expect(Array.isArray(res.value.dimensions)).toBe(true);
	});

	it('streams scenarios and ends with a trailer', async () => {
		const request: AuditRequest = {
			target: [{ grid: '47', amount: 109 }],
			taxable_point: '2025-04-30',
			taxable_amount: 109,
			vat_amount: 0,
			supplier: { type: 'company', vat_number: 'BE0430810949', country: 'belgium' },
			receiver: { type: 'individual', vat_number: '', country: 'belgium' },
			object: { type: 'energy_supply' },
			limit: 20
		};

		const stream = await auditScenarios(client, request);
		expect(isError(stream)).toBe(false);
		if (isError(stream)) return;

		let scenarios = 0;
		let next = await stream.value.next();
		while (!next.done) {
			scenarios++;
			next = await stream.value.next();
		}

		// The stream always terminates with a trailer, whatever the scenario count.
		expect(next.value.done).toBe(true);
		expect(scenarios).toBeGreaterThan(0);
	});
});
