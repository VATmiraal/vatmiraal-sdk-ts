import { describe, it, expect } from 'vitest';
import { asSafe } from '../../../lib/common/safe/safe';

describe(asSafe.name, () => {
	it('brands the value without copying or changing it', () => {
		const value = { a: 1 };
		expect(asSafe(value)).toBe(value);
	});
});
