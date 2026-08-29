import type { Country } from '../common/domain-types';

/** A request to validate a VAT number. */
export interface VatValidationInput {
	/** The VAT number to validate. */
	vat: string;
	/** Validate against the country format template only, rather than a registry lookup. */
	template_validation?: boolean;
}

/** The outcome of validating a VAT number. */
export interface VatValidationOutput {
	/** Whether the VAT number is valid. */
	valid: boolean;
	/** Whether the number was validated against a format template. */
	template_validated?: boolean;
	/** The reasons the number was found invalid, when it is not valid. */
	invalid_context?: string[];
}

/** The expected VAT number format for a country. */
export interface VatTemplate {
	/** The country the template applies to. */
	country: Country;
	/** Two-letter VAT country code. */
	country_code: string;
	/** Expected VAT number format. */
	template: string;
}
