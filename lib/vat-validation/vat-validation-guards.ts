import type { VatTemplate, VatValidationOutput } from './vat-validation-types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/** True when `value` is a well-formed {@link VatValidationOutput}. */
export function isVatValidationOutput(value: unknown): value is VatValidationOutput {
	return (
		isRecord(value) &&
		typeof value.valid === 'boolean' &&
		(value.template_validated === undefined || typeof value.template_validated === 'boolean') &&
		(value.invalid_context === undefined || isStringArray(value.invalid_context))
	);
}

/** True when `value` is a well-formed {@link VatTemplate}. */
export function isVatTemplate(value: unknown): value is VatTemplate {
	return (
		isRecord(value) &&
		typeof value.country === 'string' &&
		typeof value.country_code === 'string' &&
		typeof value.template === 'string'
	);
}

/** True when `value` is an array of {@link VatTemplate}. */
export function isVatTemplateArray(value: unknown): value is VatTemplate[] {
	return Array.isArray(value) && value.every(isVatTemplate);
}
