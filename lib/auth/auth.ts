import { result, isError, type SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import type { AuthIdentity, LoginInput } from './auth-types';
import { isAuthIdentity } from './auth-guards';

function isOk(value: unknown): value is { ok: boolean } {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { ok: unknown }).ok === 'boolean'
	);
}

/**
 * Verify an OAuth ID token and open a session, returning the authenticated identity. The session
 * cookie the service sets is only stored and resent when the client is built with
 * `credentials: 'include'` (an `OAuthOptions` client).
 */
export function login(client: Client, input: LoginInput): SafePromise<AuthIdentity, Error> {
	return requestJson(client, '/auth/login', isAuthIdentity, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(input)
	});
}

/**
 * Fetch the identity the current session belongs to. Requires a client built with
 * `credentials: 'include'` so the session cookie is sent.
 */
export function fetchIdentity(client: Client): SafePromise<AuthIdentity, Error> {
	return requestJson(client, '/auth/me', isAuthIdentity);
}

/** Clear the current session. Resolves to `true` on success. */
export async function logout(client: Client): SafePromise<boolean, Error> {
	const res = await requestJson(client, '/auth/logout', isOk, { method: 'POST' });
	return isError(res) ? res : result(res.value.ok);
}
