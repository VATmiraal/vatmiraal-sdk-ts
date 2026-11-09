import { describe, it, expect } from 'vitest';
import {
	isCarDeductabilityArg,
	isCarDeductabilitySchema,
	isCarDeductabilitySchemaMap,
	isCarDeductabilityValueArray,
	isDeductabilityResult,
	isDeductabilityResultArray
} from '../../lib/car-deductability/car-deductability-guards';

const arg = { name: 'home_work_km', lower_bound: 0, upper_bound: null };
const schema = { type: 'car', method: 'semi_flat_rate', args: [arg] };
const legalRef = {
	article: '11',
	paragraph: '8',
	section: '4',
	subsection: 'D.c',
	book: 'btw_commentaar',
	comment: 'Recht op aftrek, 01.09.2025'
};
const applicable = { not_applicable: false, percentage: 35, legal_reference: legalRef };
const notApplicable = { not_applicable: true };

describe(isCarDeductabilityArg.name, () => {
	it('accepts an arg with numeric and null bounds', () => {
		expect(isCarDeductabilityArg(arg)).toBe(true);
		expect(isCarDeductabilityArg({ name: 'x', lower_bound: 1, upper_bound: 365 })).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isCarDeductabilityArg(null)).toBe(false);
		expect(isCarDeductabilityArg({ ...arg, name: 1 })).toBe(false);
		expect(isCarDeductabilityArg({ ...arg, lower_bound: 'x' })).toBe(false);
		expect(isCarDeductabilityArg({ ...arg, upper_bound: 'x' })).toBe(false);
	});
});

describe(isCarDeductabilitySchema.name, () => {
	it('accepts a well-formed schema', () => {
		expect(isCarDeductabilitySchema(schema)).toBe(true);
		expect(isCarDeductabilitySchema({ type: 'car', method: 'flat_rate', args: [] })).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isCarDeductabilitySchema(null)).toBe(false);
		expect(isCarDeductabilitySchema({ ...schema, type: 1 })).toBe(false);
		expect(isCarDeductabilitySchema({ ...schema, method: 1 })).toBe(false);
		expect(isCarDeductabilitySchema({ ...schema, args: 'nope' })).toBe(false);
		expect(isCarDeductabilitySchema({ ...schema, args: [{}] })).toBe(false);
	});
});

describe(isCarDeductabilityValueArray.name, () => {
	it('accepts an array of value refs and rejects others', () => {
		expect(isCarDeductabilityValueArray([{ value: 'flat_rate' }, { value: 'car' }])).toBe(true);
		expect(isCarDeductabilityValueArray([])).toBe(true);
		expect(isCarDeductabilityValueArray([{ value: 1 }])).toBe(false);
		expect(isCarDeductabilityValueArray('nope')).toBe(false);
	});
});

describe(isCarDeductabilitySchemaMap.name, () => {
	it('accepts a record of schemas keyed by any string', () => {
		expect(isCarDeductabilitySchemaMap({ car: schema, light_truck: schema })).toBe(true);
		expect(isCarDeductabilitySchemaMap({})).toBe(true);
	});
	it('rejects non-records and malformed values', () => {
		expect(isCarDeductabilitySchemaMap(null)).toBe(false);
		expect(isCarDeductabilitySchemaMap({ car: {} })).toBe(false);
	});
});

describe(isDeductabilityResult.name, () => {
	it('accepts both discriminated shapes', () => {
		expect(isDeductabilityResult(applicable)).toBe(true);
		expect(isDeductabilityResult(notApplicable)).toBe(true);
	});
	it('rejects malformed or mixed shapes', () => {
		expect(isDeductabilityResult(null)).toBe(false);
		expect(isDeductabilityResult({ not_applicable: false })).toBe(false);
		expect(isDeductabilityResult({ ...applicable, percentage: 'x' })).toBe(false);
		expect(isDeductabilityResult({ ...applicable, legal_reference: {} })).toBe(false);
	});
});

describe(isDeductabilityResultArray.name, () => {
	it('accepts arrays of results and rejects others', () => {
		expect(isDeductabilityResultArray([applicable, notApplicable])).toBe(true);
		expect(isDeductabilityResultArray([{}])).toBe(false);
	});
});
