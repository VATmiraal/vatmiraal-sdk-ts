import { error, result, type Result } from 'result-interface';
import type { AnalysisObject } from '../../analysis/tax-grid-input-types';
import type { VatSchema } from '../../schema/schema-types';
import type { ValidationError } from './errors';
import { asSafe, type DeepReadonly, type Safe } from './safe';
import { mustBeOneOf } from './check';
import { validateProperties } from './properties';
import { validateTransport } from './transport';
import { scoped } from './path';

/** Validate an object against the schema; returns the validated object or the failures. */
export function analysisObject(
	input: AnalysisObject,
	schema: VatSchema
): Result<Safe<AnalysisObject>, ValidationError[]> {
	const errors: ValidationError[] = [];
	validateAnalysisObject(input, schema, '', errors);
	return errors.length > 0 ? error(errors) : result(asSafe(input));
}

/** A boolean guard reusing {@link validateAnalysisObject}; narrows `input` when valid. */
export function isSafeAnalysisObject(
	input: DeepReadonly<AnalysisObject>,
	schema: VatSchema
): input is Safe<AnalysisObject> {
	const errors: ValidationError[] = [];
	validateAnalysisObject(input, schema, '', errors);
	return errors.length === 0;
}

/** Append an object's failures to `errors` under `path` (used when nested in a request). */
export function validateAnalysisObject(
	input: DeepReadonly<AnalysisObject>,
	schema: VatSchema,
	path: string,
	errors: ValidationError[]
): void {
	const at = scoped(path);
	const objectTypes = schema.categories.map((category) => category.value);
	mustBeOneOf(input.type, at('type'), objectTypes, 'a known object type', errors);
	validateProperties(input.properties, schema.objectProperties, schema, at('properties'), errors);
	if (input.transport !== undefined) {
		validateTransport(input.transport, schema, at('transport'), errors);
	}
}
