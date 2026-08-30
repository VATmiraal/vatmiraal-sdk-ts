import { describe, it, expect } from 'vitest';
import {
	isAuditArg,
	isAuditCapabilities,
	isAuditDimension,
	isAuditProperty,
	isAuditScenario,
	isAuditTrailer,
	isNumericRange
} from '../../lib/audit/audit-guards';

const grid = { grid: '55', amount: 21, justifications: [] };
const property = { type: 'location', args: ['belgium'] };
const scenario = {
	supplier_type: 'company',
	supplier_country: 'belgium',
	receiver_type: 'company',
	receiver_country: 'other_eu',
	transaction_type: 'service',
	supplier_properties: [property],
	customer_properties: [],
	object_properties: [],
	grids: [grid]
};
const trailer = { done: true, count: 1, truncated: false, reason: 'complete' };
const dimension = { field: 'supplier', label: 'Supplier', mode: 'required', control: 'select' };
const capabilities = {
	response_type: 'application/x-ndjson',
	conventions: { ground: 'scalar' },
	dimensions: [dimension]
};

describe(isNumericRange.name, () => {
	it('accepts an object with min and max', () => {
		expect(isNumericRange({ min: 0, max: 9 })).toBe(true);
	});
	it('rejects non-records and objects missing a bound', () => {
		expect(isNumericRange(null)).toBe(false);
		expect(isNumericRange({})).toBe(false);
		expect(isNumericRange({ min: 0 })).toBe(false);
	});
});

describe(isAuditArg.name, () => {
	it('accepts scalars and numeric ranges', () => {
		expect(isAuditArg({ min: 0, max: 9 })).toBe(true);
		expect(isAuditArg(null)).toBe(true);
		expect(isAuditArg('x')).toBe(true);
		expect(isAuditArg(1)).toBe(true);
		expect(isAuditArg(true)).toBe(true);
	});
	it('rejects other values', () => {
		expect(isAuditArg(undefined)).toBe(false);
		expect(isAuditArg({ foo: 1 })).toBe(false);
	});
});

describe(isAuditProperty.name, () => {
	it('accepts a well-formed property', () => {
		expect(isAuditProperty(property)).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isAuditProperty(null)).toBe(false);
		expect(isAuditProperty({ type: 1, args: [] })).toBe(false);
		expect(isAuditProperty({ type: 'p', args: 'x' })).toBe(false);
		expect(isAuditProperty({ type: 'p', args: [undefined] })).toBe(false);
	});
});

describe(isAuditScenario.name, () => {
	it('accepts a well-formed scenario', () => {
		expect(isAuditScenario(scenario)).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isAuditScenario(null)).toBe(false);
		expect(isAuditScenario({ ...scenario, supplier_type: 1 })).toBe(false);
		expect(isAuditScenario({ ...scenario, supplier_country: 1 })).toBe(false);
		expect(isAuditScenario({ ...scenario, receiver_type: 1 })).toBe(false);
		expect(isAuditScenario({ ...scenario, receiver_country: 1 })).toBe(false);
		expect(isAuditScenario({ ...scenario, transaction_type: 1 })).toBe(false);
		expect(isAuditScenario({ ...scenario, supplier_properties: 'x' })).toBe(false);
		expect(isAuditScenario({ ...scenario, supplier_properties: [{}] })).toBe(false);
		expect(isAuditScenario({ ...scenario, customer_properties: 'x' })).toBe(false);
		expect(isAuditScenario({ ...scenario, object_properties: 'x' })).toBe(false);
		expect(isAuditScenario({ ...scenario, grids: 'x' })).toBe(false);
		expect(isAuditScenario({ ...scenario, grids: [{}] })).toBe(false);
	});
});

describe(isAuditTrailer.name, () => {
	it('accepts a well-formed trailer', () => {
		expect(isAuditTrailer(trailer)).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isAuditTrailer(null)).toBe(false);
		expect(isAuditTrailer({ ...trailer, done: 1 })).toBe(false);
		expect(isAuditTrailer({ ...trailer, count: 'x' })).toBe(false);
		expect(isAuditTrailer({ ...trailer, truncated: 1 })).toBe(false);
		expect(isAuditTrailer({ ...trailer, reason: 1 })).toBe(false);
	});
});

describe(isAuditDimension.name, () => {
	it('accepts a minimal and a fully populated dimension', () => {
		expect(isAuditDimension(dimension)).toBe(true);
		expect(
			isAuditDimension({
				...dimension,
				values_from: '/party-type',
				values: ['company'],
				classes_from: '/country-class',
				description: 'The supplier.'
			})
		).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isAuditDimension(null)).toBe(false);
		expect(isAuditDimension({ ...dimension, field: 1 })).toBe(false);
		expect(isAuditDimension({ ...dimension, label: 1 })).toBe(false);
		expect(isAuditDimension({ ...dimension, mode: 1 })).toBe(false);
		expect(isAuditDimension({ ...dimension, control: 1 })).toBe(false);
		expect(isAuditDimension({ ...dimension, values_from: 1 })).toBe(false);
		expect(isAuditDimension({ ...dimension, values: [1] })).toBe(false);
		expect(isAuditDimension({ ...dimension, classes_from: 1 })).toBe(false);
		expect(isAuditDimension({ ...dimension, description: 1 })).toBe(false);
	});
});

describe(isAuditCapabilities.name, () => {
	it('accepts a well-formed capabilities descriptor', () => {
		expect(isAuditCapabilities(capabilities)).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isAuditCapabilities(null)).toBe(false);
		expect(isAuditCapabilities({ ...capabilities, response_type: 1 })).toBe(false);
		expect(isAuditCapabilities({ ...capabilities, conventions: 'x' })).toBe(false);
		expect(isAuditCapabilities({ ...capabilities, dimensions: 'x' })).toBe(false);
		expect(isAuditCapabilities({ ...capabilities, dimensions: [{}] })).toBe(false);
	});
});
