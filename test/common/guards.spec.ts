import { describe, it, expect } from 'vitest';
import { isRecord, isStringArray } from '../../lib/common/guards';

describe(isRecord.name, () => {
	it('accepts a plain object', () => {
		expect(isRecord({})).toBe(true);
	});

	it('rejects null and non-objects', () => {
		expect(isRecord(null)).toBe(false);
		expect(isRecord('x')).toBe(false);
		expect(isRecord(3)).toBe(false);
	});
});

describe(isStringArray.name, () => {
	it('accepts arrays of strings', () => {
		expect(isStringArray([])).toBe(true);
		expect(isStringArray(['a', 'b'])).toBe(true);
	});

	it('rejects non-arrays and non-string elements', () => {
		expect(isStringArray('a')).toBe(false);
		expect(isStringArray([1])).toBe(false);
	});
});
