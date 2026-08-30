import type { AuthIdentity } from './auth-types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function isAuthIdentity(value: unknown): value is AuthIdentity {
	return isRecord(value) && typeof value.name === 'string' && typeof value.email === 'string';
}
