import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { fetchOpenApi } from '../../lib/client/openapi';

describe(fetchOpenApi.name, () => {
	it('GETs /openapi.json and returns the document', async () => {
		const doc = { paths: { '/': { get: {} } } };
		const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(doc))));
		const client: Client = { options: { token: 't' }, request: send };

		expect(await fetchOpenApi(client)).toBeResult(doc);
		expect(send).toHaveBeenCalledWith('/openapi.json', undefined);
	});

	it('propagates a request error', async () => {
		const send = vi.fn().mockResolvedValue(result(new Response('', { status: 500 })));
		const client: Client = { options: { token: 't' }, request: send };

		expect(await fetchOpenApi(client)).toBeError();
	});

	it('rejects a payload without a paths object', async () => {
		for (const body of ['42', '"str"', 'null', '{"paths":null}', '{"paths":"nope"}']) {
			const send = vi.fn().mockResolvedValue(result(new Response(body)));
			const client: Client = { options: { token: 't' }, request: send };
			expect(await fetchOpenApi(client)).toBeError();
		}
	});
});
