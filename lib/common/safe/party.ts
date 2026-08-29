import { error, result, type Result } from 'result-interface';
import type { Party } from '../../analysis/tax-grid-input-types';
import type { VatSchema } from '../../schema/schema-types';
import type { ValidationError } from './errors';
import { asSafe, type DeepReadonly, type Safe } from './safe';
import { mustBeOneOf } from './check';
import { validateProperties } from './properties';
import { scoped } from './path';

/** Validate a party against the schema; returns the validated party or the failures. */
export function party(input: Party, schema: VatSchema): Result<Safe<Party>, ValidationError[]> {
	const errors: ValidationError[] = [];
	validateParty(input, schema, '', errors);
	return errors.length > 0 ? error(errors) : result(asSafe(input));
}

/** A boolean guard reusing {@link validateParty}; narrows `input` to `Safe<Party>` when valid. */
export function isSafeParty(input: DeepReadonly<Party>, schema: VatSchema): input is Safe<Party> {
	const errors: ValidationError[] = [];
	validateParty(input, schema, '', errors);
	return errors.length === 0;
}

/** Append a party's failures to `errors` under `path` (used when nested in a request). */
export function validateParty(
	input: DeepReadonly<Party>,
	schema: VatSchema,
	path: string,
	errors: ValidationError[]
): void {
	const at = scoped(path);
	mustBeOneOf(input.type, at('type'), schema.partyTypes, 'a known party type', errors);
	mustBeOneOf(input.country, at('country'), schema.countries, 'a known country', errors);
	validateProperties(input.properties, schema.partyProperties, schema, at('properties'), errors);
}
