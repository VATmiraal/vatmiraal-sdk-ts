import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import {
	fetchBroadCategories,
	fetchBroadCategory,
	fetchCategory,
	fetchCountryClasses,
	fetchObjectProperty,
	fetchPartyProperty
} from '../../lib/schema/schema';

function clientReturning(body: unknown): { client: Client; send: ReturnType<typeof vi.fn> } {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(body))));
	return { client: { options: { token: 't' }, request: send }, send };
}

const ref = { value: 'services', label: 'Services' };
const category = {
	value: 'general_service',
	label: 'General service',
	broad_category: ref,
	transaction_types: ['service'],
	description: 'A general service.',
	properties: []
};
const spec = { value: 'location', label: 'Location', args: [] };
const countryClass = { class: 'other_eu', countries: ['france', 'germany'] };

describe(fetchCategory.name, () => {
	it('GETs /category/{value}, url-encoding the value', async () => {
		const { client, send } = clientReturning(category);
		expect(await fetchCategory(client, 'general/service')).toBeResult(category);
		expect(send).toHaveBeenCalledWith('/category/general%2Fservice', undefined);
	});
});

describe(fetchBroadCategories.name, () => {
	it('GETs /category/broad', async () => {
		const { client, send } = clientReturning([ref]);
		expect(await fetchBroadCategories(client)).toBeResult([ref]);
		expect(send).toHaveBeenCalledWith('/category/broad', undefined);
	});
});

describe(fetchBroadCategory.name, () => {
	it('GETs /category/broad/{value}', async () => {
		const detail = { value: 'services', label: 'Services', categories: [category] };
		const { client, send } = clientReturning(detail);
		expect(await fetchBroadCategory(client, 'services')).toBeResult(detail);
		expect(send).toHaveBeenCalledWith('/category/broad/services', undefined);
	});
});

describe(fetchObjectProperty.name, () => {
	it('GETs /property/object/{value}', async () => {
		const { client, send } = clientReturning(spec);
		expect(await fetchObjectProperty(client, 'location')).toBeResult(spec);
		expect(send).toHaveBeenCalledWith('/property/object/location', undefined);
	});
});

describe(fetchPartyProperty.name, () => {
	it('GETs /property/party/{value}', async () => {
		const { client, send } = clientReturning(spec);
		expect(await fetchPartyProperty(client, 'vat_liable')).toBeResult(spec);
		expect(send).toHaveBeenCalledWith('/property/party/vat_liable', undefined);
	});
});

describe(fetchCountryClasses.name, () => {
	it('GETs /country-class', async () => {
		const { client, send } = clientReturning([countryClass]);
		expect(await fetchCountryClasses(client)).toBeResult([countryClass]);
		expect(send).toHaveBeenCalledWith('/country-class', undefined);
	});
});
