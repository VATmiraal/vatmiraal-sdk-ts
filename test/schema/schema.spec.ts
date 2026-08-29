import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { fetchSchema } from '../../lib/schema/schema';

const CATEGORY = {
	value: 'general_service',
	label: 'General service',
	broad_category: { value: 'services', label: 'Services' },
	transaction_types: ['service'],
	description: 'A general service.',
	properties: []
};

const GOOD: Record<string, unknown> = {
	'/transaction-type': ['service'],
	'/party-type': ['company'],
	'/transport-by': ['transport_by_seller'],
	'/country': ['belgium'],
	'/category': [CATEGORY],
	'/property/object': [],
	'/property/party': []
};

const VAT_SCHEMA = {
	transactionTypes: ['service'],
	partyTypes: ['company'],
	transportBy: ['transport_by_seller'],
	countries: ['belgium'],
	categories: [CATEGORY],
	objectProperties: [],
	partyProperties: []
};

function schemaClient(failPath?: string): Client {
	const send = vi.fn((path: string) => {
		const ok = path !== failPath;
		return Promise.resolve(
			result(new Response(ok ? JSON.stringify(GOOD[path]) : '', { status: ok ? 200 : 500 }))
		);
	});
	return { options: { token: 't' }, request: send };
}

describe('fetchSchema', () => {
	it('aggregates every vocabulary into a VatSchema', async () => {
		expect(await fetchSchema(schemaClient())).toBeResult(VAT_SCHEMA);
	});

	it.each(Object.keys(GOOD))('fails with the first endpoint that errors (%s)', async (failPath) => {
		expect(await fetchSchema(schemaClient(failPath))).toBeError();
	});

	it('fails when the underlying requests reject', async () => {
		const send = vi.fn().mockRejectedValue(new Error('network down'));
		const client: Client = { options: { token: 't' }, request: send };

		expect(await fetchSchema(client)).toBeError();
	});
});
