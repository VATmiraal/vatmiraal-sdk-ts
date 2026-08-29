import { error, result, type Result } from 'result-interface';
import type { Transport } from '../../analysis/tax-grid-input-types';
import type { VatSchema } from '../../schema/schema-types';
import type { ValidationError } from './errors';
import { asSafe, type DeepReadonly, type Safe } from './safe';
import { mustBeOneOf } from './check';
import { scoped } from './path';

/** Validate a transport against the schema; returns the validated transport or the failures. */
export function transport(
	input: Transport,
	schema: VatSchema
): Result<Safe<Transport>, ValidationError[]> {
	const errors: ValidationError[] = [];
	validateTransport(input, schema, '', errors);
	return errors.length > 0 ? error(errors) : result(asSafe(input));
}

/** A boolean guard reusing {@link validateTransport}; narrows `input` to `Safe<Transport>`. */
export function isSafeTransport(
	input: DeepReadonly<Transport>,
	schema: VatSchema
): input is Safe<Transport> {
	const errors: ValidationError[] = [];
	validateTransport(input, schema, '', errors);
	return errors.length === 0;
}

/** Append a transport's failures to `errors` under `path` (used when nested in a request). */
export function validateTransport(
	input: DeepReadonly<Transport>,
	schema: VatSchema,
	path: string,
	errors: ValidationError[]
): void {
	const at = scoped(path);
	mustBeOneOf(input.from, at('from'), schema.countries, 'a known country', errors);
	mustBeOneOf(input.to, at('to'), schema.countries, 'a known country', errors);
	mustBeOneOf(input.by, at('by'), schema.transportBy, 'a known transport method', errors);
}
