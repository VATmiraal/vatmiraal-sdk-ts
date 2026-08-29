import { describe, it, expect } from 'vitest';
import { isInferenceResult } from '../../lib/inference/inference-guards';

const candidate = {
	type: 'general_service',
	transaction_types: ['service'],
	properties: [{ type: 'rate', args: ['a', 1, true] }],
	missing_properties: ['location'],
	extra: [{ type: 'extra', args: [1] }],
	invalid: [{ type: 'invalid' }],
	comment: 'looks fine'
};

const wrap = (c: unknown) => ({ candidates: [c] });

describe(isInferenceResult.name, () => {
	it('accepts a well-formed result', () => {
		expect(isInferenceResult({ candidates: [candidate] })).toBe(true);
		expect(isInferenceResult({ candidates: [] })).toBe(true);
	});

	it('rejects when the envelope is malformed', () => {
		expect(isInferenceResult(null)).toBe(false);
		expect(isInferenceResult({ candidates: 'nope' })).toBe(false);
		expect(isInferenceResult(wrap(null))).toBe(false);
	});

	it('rejects on each malformed candidate field', () => {
		expect(isInferenceResult(wrap({ ...candidate, type: 1 }))).toBe(false);
		expect(isInferenceResult(wrap({ ...candidate, transaction_types: [1] }))).toBe(false);
		expect(isInferenceResult(wrap({ ...candidate, properties: 'nope' }))).toBe(false);
		expect(isInferenceResult(wrap({ ...candidate, missing_properties: [1] }))).toBe(false);
		expect(isInferenceResult(wrap({ ...candidate, extra: 'nope' }))).toBe(false);
		expect(isInferenceResult(wrap({ ...candidate, invalid: 'nope' }))).toBe(false);
		expect(isInferenceResult(wrap({ ...candidate, comment: 1 }))).toBe(false);
	});

	it('rejects on malformed nested properties', () => {
		// analysis property: type must be a string, args must be primitives
		expect(isInferenceResult(wrap({ ...candidate, properties: [{ type: 1, args: [] }] }))).toBe(
			false
		);
		expect(isInferenceResult(wrap({ ...candidate, properties: [{ type: 'p', args: [{}] }] }))).toBe(
			false
		);
		// raw property: non-record, wrong type, or non-primitive args
		expect(isInferenceResult(wrap({ ...candidate, extra: [null] }))).toBe(false);
		expect(isInferenceResult(wrap({ ...candidate, invalid: [{ type: 'x', args: [{}] }] }))).toBe(
			false
		);
	});
});
