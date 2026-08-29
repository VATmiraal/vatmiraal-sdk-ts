import type { SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import type { Country } from '../common/domain-types';
import type { VatTemplate, VatValidationInput, VatValidationOutput } from './vat-validation-types';
import { isVatTemplate, isVatTemplateArray, isVatValidationOutput } from './vat-validation-guards';

/** Validate a VAT number, optionally against the country format template only. */
export function validateVat(
	client: Client,
	input: VatValidationInput
): SafePromise<VatValidationOutput, Error> {
	return requestJson(client, '/vat-validation', isVatValidationOutput, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(input)
	});
}

/** Fetch the VAT number format templates for every country. */
export function fetchVatTemplates(client: Client): SafePromise<VatTemplate[], Error> {
	return requestJson(client, '/vat-template', isVatTemplateArray);
}

/** Fetch the VAT number format template for one country. */
export function fetchVatTemplate(
	client: Client,
	country: Country
): SafePromise<VatTemplate, Error> {
	return requestJson(client, `/vat-template/${encodeURIComponent(country)}`, isVatTemplate);
}
