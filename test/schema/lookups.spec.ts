import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import {
	fetchBroadCategories,
	fetchBroadCategory,
	fetchCategory,
	fetchObjectProperty,
	fetchPartyProperty
} from '../../lib/schema/schema';

const CATEGORY = {
	value: 'general_service',
	label: 'General service',
	broad_category: { value: 'services', label: 'Services' },
	transaction_types: ['service'],
	description: 'A general service.',
	properties: []
};

const SPEC = { value: 'rate', label: 'Rate', args: [] };

function clientReturning(body: unknown) {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(body))));
	const client: Client = { options: { token: 't' }, request: send };
	return { client, send };
}

describe(fetchCategory.name, () => {
	it('GETs /category/{value} and parses the category', async () => {
		const { client, send } = clientReturning(CATEGORY);
		expect(await fetchCategory(client, 'general_service')).toBeResult(CATEGORY);
		expect(send).toHaveBeenCalledWith('/category/general_service', undefined);
	});
});

describe(fetchBroadCategories.name, () => {
	it('GETs /category/broad and parses the refs', async () => {
		const refs = [{ value: 'services', label: 'Services' }];
		const { client, send } = clientReturning(refs);
		expect(await fetchBroadCategories(client)).toBeResult(refs);
		expect(send).toHaveBeenCalledWith('/category/broad', undefined);
	});
});

describe(fetchBroadCategory.name, () => {
	it('GETs /category/broad/{value} and parses the detail', async () => {
		const detail = { value: 'services', label: 'Services', categories: [CATEGORY] };
		const { client, send } = clientReturning(detail);
		expect(await fetchBroadCategory(client, 'services')).toBeResult(detail);
		expect(send).toHaveBeenCalledWith('/category/broad/services', undefined);
	});
});

describe(fetchObjectProperty.name, () => {
	it('GETs /property/object/{value} and parses the spec', async () => {
		const { client, send } = clientReturning(SPEC);
		expect(await fetchObjectProperty(client, 'rate')).toBeResult(SPEC);
		expect(send).toHaveBeenCalledWith('/property/object/rate', undefined);
	});
});

describe(fetchPartyProperty.name, () => {
	it('GETs /property/party/{value} and parses the spec', async () => {
		const { client, send } = clientReturning(SPEC);
		expect(await fetchPartyProperty(client, 'rate')).toBeResult(SPEC);
		expect(send).toHaveBeenCalledWith('/property/party/rate', undefined);
	});
});
