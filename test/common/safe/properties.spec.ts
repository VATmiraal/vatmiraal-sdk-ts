import { describe, it, expect } from 'vitest';
import { validateProperties } from '../../../lib/common/safe/properties';
import type { AnalysisProperty } from '../../../lib/analysis/tax-grid-input-types';
import type { PropertySpec, VatSchema } from '../../../lib/schema/schema-types';
import type { ValidationError } from '../../../lib/common/safe/errors';

const schema = { countries: ['belgium', 'france'] } as unknown as VatSchema;

const specs: PropertySpec[] = [
	{ value: 'oneof_prop', label: '', args: [{ name: 'x', domain: 'oneof', values: ['a', 'b'] }] },
	{ value: 'oneof_empty', label: '', args: [{ name: 'x', domain: 'oneof' }] },
	{ value: 'country_prop', label: '', args: [{ name: 'x', domain: 'country' }] },
	{ value: 'int_prop', label: '', args: [{ name: 'x', domain: 'int', min: 1, max: 10 }] },
	{ value: 'int_open', label: '', args: [{ name: 'x', domain: 'int' }] },
	{ value: 'rate_prop', label: '', args: [{ name: 'x', domain: 'rate' }] },
	{ value: 'atom_prop', label: '', args: [{ name: 'x', domain: 'atom' }] }
];

function run(...props: AnalysisProperty[]): ValidationError[] {
	const errors: ValidationError[] = [];
	validateProperties(props, specs, schema, 'props', errors);
	return errors;
}

const paths = (errors: ValidationError[]): string[] => errors.map((e) => e.path);

describe('validateProperties structural checks', () => {
	it('flags an unknown property', () => {
		expect(run({ type: 'nope', args: [] })).toEqual([
			{ path: 'props[0].type', message: "unknown property 'nope'" }
		]);
	});
	it('flags the wrong number of arguments', () => {
		expect(run({ type: 'atom_prop', args: [] })).toEqual([
			{ path: 'props[0].args', message: 'expected 1 argument(s), got 0' }
		]);
	});
});

describe('validateProperties membership domains', () => {
	it('accepts a value in the oneof set and rejects one outside it', () => {
		expect(run({ type: 'oneof_prop', args: ['a'] })).toEqual([]);
		expect(paths(run({ type: 'oneof_prop', args: ['z'] }))).toEqual(['props[0].args[0]']);
		expect(paths(run({ type: 'oneof_prop', args: [1] }))).toEqual(['props[0].args[0]']);
	});
	it('rejects everything for an empty oneof set', () => {
		expect(paths(run({ type: 'oneof_empty', args: ['a'] }))).toEqual(['props[0].args[0]']);
	});
	it('accepts a known country and rejects an unknown one', () => {
		expect(run({ type: 'country_prop', args: ['belgium'] })).toEqual([]);
		expect(paths(run({ type: 'country_prop', args: ['atlantis'] }))).toEqual(['props[0].args[0]']);
	});
});

describe('validateProperties numeric domains', () => {
	it('accepts an integer within range and rejects out-of-range or non-integers', () => {
		expect(run({ type: 'int_prop', args: [5] })).toEqual([]);
		expect(run({ type: 'int_open', args: [5] })).toEqual([]);
		expect(paths(run({ type: 'int_prop', args: [1.5] }))).toEqual(['props[0].args[0]']);
		expect(paths(run({ type: 'int_prop', args: [0] }))).toEqual(['props[0].args[0]']);
		expect(paths(run({ type: 'int_prop', args: [11] }))).toEqual(['props[0].args[0]']);
	});
	it('accepts a rate in 0..100 and rejects anything else', () => {
		expect(run({ type: 'rate_prop', args: [50] })).toEqual([]);
		expect(paths(run({ type: 'rate_prop', args: [150] }))).toEqual(['props[0].args[0]']);
	});
});

describe('validateProperties free-form domain', () => {
	it('accepts a string and rejects a non-string', () => {
		expect(run({ type: 'atom_prop', args: ['anything'] })).toEqual([]);
		expect(paths(run({ type: 'atom_prop', args: [1] }))).toEqual(['props[0].args[0]']);
	});
});
