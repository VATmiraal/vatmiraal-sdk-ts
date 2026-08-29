import { error, result, type Result } from 'result-interface';
import type { TaxGridAnalysisRequest } from '../../analysis/tax-grid-input-types';
import type { VatSchema } from '../../schema/schema-types';
import type { ValidationError } from './errors';
import { asSafe, type DeepReadonly, type Safe } from './safe';
import { mustBeOneOf } from './check';
import { validateTransaction } from './transaction';
import { scoped } from './path';

const PERSPECTIVES = ['supplier', 'receiver'] as const;

/** Validate a full tax-grid analysis request; returns the validated request or the failures. */
export function taxGridAnalysisRequest(
	input: TaxGridAnalysisRequest,
	schema: VatSchema
): Result<Safe<TaxGridAnalysisRequest>, ValidationError[]> {
	const errors: ValidationError[] = [];
	validateTaxGridAnalysisRequest(input, schema, '', errors);
	return errors.length > 0 ? error(errors) : result(asSafe(input));
}

/** A boolean guard reusing {@link validateTaxGridAnalysisRequest}; narrows `input` when valid. */
export function isSafeTaxGridAnalysisRequest(
	input: DeepReadonly<TaxGridAnalysisRequest>,
	schema: VatSchema
): input is Safe<TaxGridAnalysisRequest> {
	const errors: ValidationError[] = [];
	validateTaxGridAnalysisRequest(input, schema, '', errors);
	return errors.length === 0;
}

/** Append a request's failures to `errors` under `path`. */
export function validateTaxGridAnalysisRequest(
	input: DeepReadonly<TaxGridAnalysisRequest>,
	schema: VatSchema,
	path: string,
	errors: ValidationError[]
): void {
	const at = scoped(path);
	validateTransaction(input.transaction, schema, at('transaction'), errors);
	mustBeOneOf(
		input.perspective,
		at('perspective'),
		PERSPECTIVES,
		"'supplier' or 'receiver'",
		errors
	);
}
