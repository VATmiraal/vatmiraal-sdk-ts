import { describe, it, expect } from 'vitest';
import { isAuthIdentity } from '../../lib/auth/auth-guards';

describe(isAuthIdentity.name, () => {
	it('accepts a well-formed identity', () => {
		expect(isAuthIdentity({ name: 'Ada', email: 'ada@example.com' })).toBe(true);
	});
	it('rejects non-records and malformed fields', () => {
		expect(isAuthIdentity(null)).toBe(false);
		expect(isAuthIdentity({ name: 1, email: 'a' })).toBe(false);
		expect(isAuthIdentity({ name: 'a', email: 1 })).toBe(false);
	});
});
