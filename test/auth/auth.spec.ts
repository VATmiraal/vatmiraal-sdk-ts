import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { fetchIdentity, login, logout } from '../../lib/auth/auth';

function clientReturning(
	body: unknown,
	status = 200
): { client: Client; send: ReturnType<typeof vi.fn> } {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(body), { status })));
	return { client: { options: { token: 't' }, request: send }, send };
}

const identity = { name: 'Ada', email: 'ada@example.com' };

describe(login.name, () => {
	it('POSTs the id token to /auth/login and returns the identity', async () => {
		const { client, send } = clientReturning(identity);

		expect(await login(client, { id_token: 'abc' })).toBeResult(identity);
		expect(send).toHaveBeenCalledWith(
			'/auth/login',
			expect.objectContaining({ method: 'POST', body: JSON.stringify({ id_token: 'abc' }) })
		);
	});
});

describe(fetchIdentity.name, () => {
	it('GETs /auth/me', async () => {
		const { client, send } = clientReturning(identity);

		expect(await fetchIdentity(client)).toBeResult(identity);
		expect(send).toHaveBeenCalledWith('/auth/me', undefined);
	});
});

describe(logout.name, () => {
	it('POSTs /auth/logout and resolves to the ok flag', async () => {
		const { client, send } = clientReturning({ ok: true });

		expect(await logout(client)).toBeResult(true);
		expect(send).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }));
	});

	it('errors when the body is not an ok flag', async () => {
		const { client } = clientReturning({ ok: 'yes' });
		expect(await logout(client)).toBeError();
	});

	it('errors when the body is null', async () => {
		const send = vi.fn().mockResolvedValue(result(new Response('null')));
		const client: Client = { options: { token: 't' }, request: send };
		expect(await logout(client)).toBeError();
	});

	it('propagates a non-ok status', async () => {
		const { client } = clientReturning('no', 500);
		expect(await logout(client)).toBeError();
	});
});
