import { describe, it, expect } from 'vitest';
import {
	isVatValidationOutput,
	isVatTemplate,
	isVatTemplateArray
} from '../../lib/vat-validation/vat-validation-guards';

const template = { country: 'belgium', country_code: 'BE', template: 'BE0999999999' };

describe(isVatValidationOutput.name, () => {
	it('accepts the minimal and the fully-populated shapes', () => {
		expect(isVatValidationOutput({ valid: true })).toBe(true);
		expect(
			isVatValidationOutput({ valid: false, template_validated: true, invalid_context: ['x'] })
		).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isVatValidationOutput(null)).toBe(false);
		expect(isVatValidationOutput({ valid: 'yes' })).toBe(false);
		expect(isVatValidationOutput({ valid: true, template_validated: 'no' })).toBe(false);
		expect(isVatValidationOutput({ valid: true, invalid_context: [1] })).toBe(false);
	});
});

describe(isVatTemplate.name, () => {
	it('accepts a well-formed template', () => {
		expect(isVatTemplate(template)).toBe(true);
	});
	it('rejects on each malformed field', () => {
		expect(isVatTemplate(null)).toBe(false);
		expect(isVatTemplate({ ...template, country: 1 })).toBe(false);
		expect(isVatTemplate({ ...template, country_code: 1 })).toBe(false);
		expect(isVatTemplate({ ...template, template: 1 })).toBe(false);
	});
});

describe(isVatTemplateArray.name, () => {
	it('accepts arrays of templates and rejects others', () => {
		expect(isVatTemplateArray([template])).toBe(true);
		expect(isVatTemplateArray([])).toBe(true);
		expect(isVatTemplateArray(template)).toBe(false);
		expect(isVatTemplateArray([{}])).toBe(false);
	});
});
