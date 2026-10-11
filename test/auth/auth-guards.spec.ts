import { describe, it, expect } from 'vitest';
import { isAuthIdentity } from '../../lib/auth/auth-guards';

describe(isAuthIdentity.name, () => {
	it('accepts an identity with a name and email', () => {
		expect(isAuthIdentity({ name: 'Ada', email: 'ada@example.com' })).toBe(true);
	});

	it('rejects non-records and missing or mistyped fields', () => {
		expect(isAuthIdentity(null)).toBe(false);
		expect(isAuthIdentity({ name: 1, email: 'ada@example.com' })).toBe(false);
		expect(isAuthIdentity({ name: 'Ada' })).toBe(false);
	});
});
