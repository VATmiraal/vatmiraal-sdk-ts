import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { ping } from '../../lib/client/health';

describe(ping.name, () => {
	it('GETs / and returns the alive boolean', async () => {
		const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify({ alive: true }))));
		const client: Client = { options: { token: 't' }, routes: [], request: send };

		expect(await ping(client)).toBeResult(true);
		expect(send).toHaveBeenCalledWith('/', undefined);
	});

	it('returns false when the service reports not alive', async () => {
		const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify({ alive: false }))));
		const client: Client = { options: { token: 't' }, routes: [], request: send };

		expect(await ping(client)).toBeResult(false);
	});

	it('propagates an error when the request fails', async () => {
		const send = vi.fn().mockResolvedValue(result(new Response('', { status: 500 })));
		const client: Client = { options: { token: 't' }, routes: [], request: send };

		expect(await ping(client)).toBeError();
	});
});
