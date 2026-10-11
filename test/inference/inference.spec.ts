import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { inferObject } from '../../lib/inference/inference';

const candidate = {
	type: 'general_service',
	transaction_types: ['service'],
	properties: [],
	missing_properties: [],
	extra: [],
	invalid: [],
	metadata: {}
};

const clientReturning = (body: unknown) => {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(body))));
	const client: Client = { options: { token: 't' }, routes: [], request: send };
	return { client, send };
};

describe(inferObject.name, () => {
	it('POSTs the description to /inference/object and parses the candidates', async () => {
		const out = { candidates: [candidate] };
		const { client, send } = clientReturning(out);

		expect(await inferObject(client, 'consulting services')).toBeResult(out);
		expect(send).toHaveBeenCalledWith(
			'/inference/object',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ description: 'consulting services' })
			})
		);
	});

	it('errors when every candidate is unclassified', async () => {
		const { client } = clientReturning({ candidates: [{ ...candidate, type: null }] });
		expect(await inferObject(client, 'mystery')).toBeError();
	});

	it('errors when there are no candidates', async () => {
		const { client } = clientReturning({ candidates: [] });
		expect(await inferObject(client, 'mystery')).toBeError();
	});

	it('passes through a request error when the payload is malformed', async () => {
		const { client } = clientReturning({ candidates: 'nope' });
		expect(await inferObject(client, 'mystery')).toBeError();
	});
});
