import type { AnalysisProperty } from '../../analysis/tax-grid-input-types';
import type { PropertyArg, PropertySpec, VatSchema } from '../../schema/schema-types';
import type { ValidationError } from './errors';
import type { DeepReadonly } from './safe';

/**
 * Validate `props` against their `specs`, appending failures under `path`. Each property must
 * name a known spec, carry the right number of arguments, and satisfy each argument's domain.
 */
export function validateProperties(
	props: DeepReadonly<AnalysisProperty[]>,
	specs: PropertySpec[],
	schema: VatSchema,
	path: string,
	errors: ValidationError[]
): void {
	for (let i = 0; i < props.length; i++) {
		const prop = props[i];
		const at = `${path}[${i}]`;
		const spec = specs.find((s) => s.value === prop.type);
		if (spec === undefined) {
			errors.push({ path: `${at}.type`, message: `unknown property '${prop.type}'` });
			continue;
		}
		if (prop.args.length !== spec.args.length) {
			errors.push({
				path: `${at}.args`,
				message: `expected ${spec.args.length} argument(s), got ${prop.args.length}`
			});
			continue;
		}
		for (let j = 0; j < spec.args.length; j++) {
			validateArg(prop.args[j], spec.args[j], schema, `${at}.args[${j}]`, errors);
		}
	}
}

/** A domain that accepts a value from a fixed set (`oneof`, `country`, ...). */
interface Membership {
	values: readonly string[];
	describe: string;
}

/** The allowed set for a membership domain, or `undefined` for a non-membership domain. */
function membership(spec: PropertyArg, schema: VatSchema): Membership | undefined {
	switch (spec.domain) {
		case 'oneof':
			return { values: spec.values ?? [], describe: `one of: ${(spec.values ?? []).join(', ')}` };
		case 'country':
			return { values: schema.countries, describe: 'a known country' };
		default:
			return undefined;
	}
}

/** Append a failure at `path` unless `value` satisfies its argument `spec`. */
function validateArg(
	value: unknown,
	spec: PropertyArg,
	schema: VatSchema,
	path: string,
	errors: ValidationError[]
): void {
	const set = membership(spec, schema);
	if (set !== undefined) {
		if (!(typeof value === 'string' && set.values.includes(value))) {
			errors.push({ path, message: `must be ${set.describe}` });
		}
		return;
	}
	switch (spec.domain) {
		case 'int':
			if (typeof value !== 'number' || !Number.isInteger(value)) {
				errors.push({ path, message: 'must be an integer' });
			} else if (spec.min !== undefined && value < spec.min) {
				errors.push({ path, message: `must be >= ${spec.min}` });
			} else if (spec.max !== undefined && value > spec.max) {
				errors.push({ path, message: `must be <= ${spec.max}` });
			}
			return;
		case 'rate':
			if (!(typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100)) {
				errors.push({ path, message: 'must be an integer rate between 0 and 100' });
			}
			return;
		default:
			// `atom`, `type_name`, and any other free-form domain accept a string.
			if (typeof value !== 'string') {
				errors.push({ path, message: 'must be a string' });
			}
	}
}
