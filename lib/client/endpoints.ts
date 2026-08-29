/** The HTTP methods the SDK issues. */
export type HttpMethod = 'GET' | 'POST';

/** One endpoint the SDK calls: its method and its path in OpenAPI template form. */
export interface Operation {
	readonly method: HttpMethod;
	readonly path: string;
}

// Static endpoint paths. Kept here so a call site and the drift manifest reference the same
// literal and cannot fall out of step.
export const PATH_HEALTH = '/';
export const PATH_OPENAPI = '/openapi.json';
export const PATH_TAX_GRID_ANALYSIS = '/tax-grid-analysis';
export const PATH_VAT_VALIDATION = '/vat-validation';
export const PATH_VAT_TEMPLATES = '/vat-template';
export const PATH_INFERENCE_OBJECT = '/inference/object';
export const PATH_TRANSACTION_TYPE = '/transaction-type';
export const PATH_PARTY_TYPE = '/party-type';
export const PATH_TRANSPORT_BY = '/transport-by';
export const PATH_COUNTRY = '/country';
export const PATH_CATEGORY = '/category';
export const PATH_OBJECT_PROPERTY = '/property/object';
export const PATH_PARTY_PROPERTY = '/property/party';

/** The by-country VAT template path in template form, matching its OpenAPI path key. */
export const PATH_VAT_TEMPLATE_BY_COUNTRY = '/vat-template/{country}';

/** Build the by-country VAT template path, url-encoding the country. */
export function vatTemplatePath(country: string): string {
	return `/vat-template/${encodeURIComponent(country)}`;
}

/**
 * Every endpoint the SDK's operations call, in the template form used by OpenAPI path keys.
 * The drift check verifies each of these still exists in the live spec. The auth-free meta
 * endpoint `PATH_OPENAPI` is intentionally not listed.
 */
export const OPERATIONS = [
	{ method: 'GET', path: PATH_HEALTH },
	{ method: 'POST', path: PATH_TAX_GRID_ANALYSIS },
	{ method: 'POST', path: PATH_VAT_VALIDATION },
	{ method: 'GET', path: PATH_VAT_TEMPLATES },
	{ method: 'GET', path: PATH_VAT_TEMPLATE_BY_COUNTRY },
	{ method: 'POST', path: PATH_INFERENCE_OBJECT },
	{ method: 'GET', path: PATH_TRANSACTION_TYPE },
	{ method: 'GET', path: PATH_PARTY_TYPE },
	{ method: 'GET', path: PATH_TRANSPORT_BY },
	{ method: 'GET', path: PATH_COUNTRY },
	{ method: 'GET', path: PATH_CATEGORY },
	{ method: 'GET', path: PATH_OBJECT_PROPERTY },
	{ method: 'GET', path: PATH_PARTY_PROPERTY }
] as const satisfies readonly Operation[];
