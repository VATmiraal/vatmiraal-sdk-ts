import { describe, it, expect } from 'vitest';
import {
	isStringArray,
	isBroadCategoryRef,
	isObjectCategory,
	isObjectCategoryArray,
	isPropertyArg,
	isPropertySpec,
	isPropertySpecArray
} from '../../lib/schema/schema-guards';

const ref = { value: 'services', label: 'Services' };
const arg = { name: 'rate', domain: 'rate' };
const spec = { value: 'p', label: 'P', args: [arg] };
const category = {
	value: 'c',
	label: 'C',
	broad_category: ref,
	transaction_types: ['service'],
	description: 'd',
	properties: ['p']
};

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

describe(isBroadCategoryRef.name, () => {
	it('accepts a well-formed ref', () => {
		expect(isBroadCategoryRef(ref)).toBe(true);
	});
	it('rejects non-records and missing fields', () => {
		expect(isBroadCategoryRef(null)).toBe(false);
		expect(isBroadCategoryRef({ value: 'x' })).toBe(false);
		expect(isBroadCategoryRef({ label: 'x' })).toBe(false);
	});
});

describe(isObjectCategory.name, () => {
	it('accepts a well-formed category', () => {
		expect(isObjectCategory(category)).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isObjectCategory(null)).toBe(false);
		expect(isObjectCategory({ ...category, value: 1 })).toBe(false);
		expect(isObjectCategory({ ...category, label: 1 })).toBe(false);
		expect(isObjectCategory({ ...category, broad_category: {} })).toBe(false);
		expect(isObjectCategory({ ...category, transaction_types: [1] })).toBe(false);
		expect(isObjectCategory({ ...category, description: 1 })).toBe(false);
		expect(isObjectCategory({ ...category, properties: [1] })).toBe(false);
	});
});

describe(isPropertyArg.name, () => {
	it('accepts args with and without the optional fields', () => {
		expect(isPropertyArg(arg)).toBe(true);
		expect(
			isPropertyArg({ name: 'n', domain: 'oneof', type_name: 't', values: ['a'], min: 0, max: 9 })
		).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isPropertyArg(null)).toBe(false);
		expect(isPropertyArg({ name: 1, domain: 'd' })).toBe(false);
		expect(isPropertyArg({ name: 'n', domain: 1 })).toBe(false);
		expect(isPropertyArg({ name: 'n', domain: 'd', type_name: 1 })).toBe(false);
		expect(isPropertyArg({ name: 'n', domain: 'd', values: [1] })).toBe(false);
		expect(isPropertyArg({ name: 'n', domain: 'd', min: 'x' })).toBe(false);
		expect(isPropertyArg({ name: 'n', domain: 'd', max: 'x' })).toBe(false);
	});
});

describe(isPropertySpec.name, () => {
	it('accepts a well-formed spec', () => {
		expect(isPropertySpec(spec)).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isPropertySpec(null)).toBe(false);
		expect(isPropertySpec({ ...spec, value: 1 })).toBe(false);
		expect(isPropertySpec({ ...spec, label: 1 })).toBe(false);
		expect(isPropertySpec({ ...spec, args: 'nope' })).toBe(false);
		expect(isPropertySpec({ ...spec, args: [{}] })).toBe(false);
	});
});

describe('array guards', () => {
	it('accept arrays of the right shape and reject others', () => {
		expect(isObjectCategoryArray([category])).toBe(true);
		expect(isObjectCategoryArray([{}])).toBe(false);
		expect(isPropertySpecArray([spec])).toBe(true);
		expect(isPropertySpecArray([{}])).toBe(false);
	});
});
