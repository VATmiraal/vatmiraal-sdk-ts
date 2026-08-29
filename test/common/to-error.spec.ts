import { describe, it, expect } from 'vitest';
import { toError } from '../../lib/common/to-error';

describe('toError', () => {
	it('returns an Error value unchanged', () => {
		const err = new Error('boom');
		expect(toError(err)).toBe(err);
	});
	it('wraps a non-Error value in an Error with its string form', () => {
		expect(toError('nope')).toEqual(new Error('nope'));
	});
});
