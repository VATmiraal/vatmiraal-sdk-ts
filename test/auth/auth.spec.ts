import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { fetchIdentity, login, logout } from '../../lib/auth/auth';

const IDENTITY = { name: 'Ada', email: 'ada@example.com' };

function clientReturning(body: unknown) {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(body))));
	const client: Client = { options: { token: 't' }, request: send };
	return { client, send };
}

describe(login.name, () => {
	it('POSTs the id_token to /auth/login and parses the identity', async () => {
		const { client, send } = clientReturning(IDENTITY);

		expect(await login(client, { id_token: 'google-token' })).toBeResult(IDENTITY);
		expect(send).toHaveBeenCalledWith(
			'/auth/login',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ id_token: 'google-token' })
			})
		);
	});

	it('errors when the identity is malformed', async () => {
		const { client } = clientReturning({ name: 'Ada' });
		expect(await login(client, { id_token: 'google-token' })).toBeError();
	});
});

describe(fetchIdentity.name, () => {
	it('GETs /auth/me and parses the identity', async () => {
		const { client, send } = clientReturning(IDENTITY);

		expect(await fetchIdentity(client)).toBeResult(IDENTITY);
		expect(send).toHaveBeenCalledWith('/auth/me', undefined);
	});
});

describe(logout.name, () => {
	it('POSTs /auth/logout and resolves to the ok flag', async () => {
		const { client, send } = clientReturning({ ok: true });

		expect(await logout(client)).toBeResult(true);
		expect(send).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }));
	});

	it('resolves to false when the service reports not ok', async () => {
		const { client } = clientReturning({ ok: false });
		expect(await logout(client)).toBeResult(false);
	});

	it('errors when the response is malformed', async () => {
		const { client } = clientReturning({});
		expect(await logout(client)).toBeError();
	});
});
