import { isRecord } from '../common/guards';
import type { AuthIdentity } from './auth-types';

export function isAuthIdentity(value: unknown): value is AuthIdentity {
	return isRecord(value) && typeof value.name === 'string' && typeof value.email === 'string';
}
