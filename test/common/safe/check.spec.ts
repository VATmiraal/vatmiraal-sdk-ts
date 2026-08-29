import { describe, it, expect } from 'vitest';
import { mustBeOneOf, mustBeDate, mustBeNonNegative } from '../../../lib/common/safe/check';
import type { ValidationError } from '../../../lib/common/safe/errors';

describe(mustBeOneOf.name, () => {
	it('appends nothing when the value is allowed', () => {
		const errors: ValidationError[] = [];
		mustBeOneOf('a', 'field', ['a', 'b'], 'a or b', errors);
		expect(errors).toEqual([]);
	});
	it('appends an error naming the expected set when the value is not allowed', () => {
		const errors: ValidationError[] = [];
		mustBeOneOf('z', 'field', ['a', 'b'], 'a or b', errors);
		expect(errors).toEqual([{ path: 'field', message: 'must be a or b' }]);
	});
});

describe(mustBeDate.name, () => {
	it('accepts a YYYY-MM-DD string', () => {
		const errors: ValidationError[] = [];
		mustBeDate('2026-01-01', 'when', errors);
		expect(errors).toEqual([]);
	});
	it('rejects anything else', () => {
		const errors: ValidationError[] = [];
		mustBeDate('01/01/2026', 'when', errors);
		expect(errors).toEqual([{ path: 'when', message: 'must be a date in YYYY-MM-DD format' }]);
	});
});

describe(mustBeNonNegative.name, () => {
	it('accepts zero and positive numbers', () => {
		const errors: ValidationError[] = [];
		mustBeNonNegative(0, 'amount', errors);
		mustBeNonNegative(5, 'amount', errors);
		expect(errors).toEqual([]);
	});
	it('rejects negative numbers', () => {
		const errors: ValidationError[] = [];
		mustBeNonNegative(-1, 'amount', errors);
		expect(errors).toEqual([{ path: 'amount', message: 'must be a number >= 0' }]);
	});
});
