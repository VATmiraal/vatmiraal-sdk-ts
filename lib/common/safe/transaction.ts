import { error, result, type Result } from 'result-interface';
import type { VatmiraalAnalysisInput } from '../../analysis/tax-grid-input-types';
import type { VatSchema } from '../../schema/schema-types';
import type { ValidationError } from './errors';
import { asSafe, type DeepReadonly, type Safe } from './safe';
import { mustBeDate, mustBeNonNegative, mustBeOneOf } from './check';
import { validateParty } from './party';
import { validateAnalysisObject } from './analysis-object';
import { scoped } from './path';

/** Validate a transaction against the schema; returns the validated transaction or the failures. */
export function transaction(
	input: VatmiraalAnalysisInput,
	schema: VatSchema
): Result<Safe<VatmiraalAnalysisInput>, ValidationError[]> {
	const errors: ValidationError[] = [];
	validateTransaction(input, schema, '', errors);
	return errors.length > 0 ? error(errors) : result(asSafe(input));
}

/** A boolean guard reusing {@link validateTransaction}; narrows `input` when valid. */
export function isSafeTransaction(
	input: DeepReadonly<VatmiraalAnalysisInput>,
	schema: VatSchema
): input is Safe<VatmiraalAnalysisInput> {
	const errors: ValidationError[] = [];
	validateTransaction(input, schema, '', errors);
	return errors.length === 0;
}

/** Append a transaction's failures to `errors` under `path` (used when nested in a request). */
export function validateTransaction(
	input: DeepReadonly<VatmiraalAnalysisInput>,
	schema: VatSchema,
	path: string,
	errors: ValidationError[]
): void {
	const at = scoped(path);
	mustBeDate(input.taxable_point, at('taxable_point'), errors);
	mustBeOneOf(input.type, at('type'), schema.transactionTypes, 'a known transaction type', errors);
	mustBeNonNegative(input.taxable_amount, at('taxable_amount'), errors);
	mustBeNonNegative(input.vat_amount, at('vat_amount'), errors);
	validateParty(input.supplier, schema, at('supplier'), errors);
	validateParty(input.receiver, schema, at('receiver'), errors);
	validateAnalysisObject(input.object, schema, at('object'), errors);
}
