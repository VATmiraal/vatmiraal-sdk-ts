import type { ValidationError } from './errors';

/**
 * Append an error at `name` unless `value` is one of `allowed`. `describe` names the expected
 * set for the message, e.g. `'a known country'`.
 */
export function mustBeOneOf<T extends string>(
	value: T,
	name: string,
	allowed: readonly T[],
	describe: string,
	errors: ValidationError[]
): void {
	if (!allowed.includes(value)) {
		errors.push({ path: name, message: `must be ${describe}` });
	}
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Append an error at `name` unless `value` is a `YYYY-MM-DD` date string. */
export function mustBeDate(value: string, name: string, errors: ValidationError[]): void {
	if (!ISO_DATE.test(value)) {
		errors.push({ path: name, message: 'must be a date in YYYY-MM-DD format' });
	}
}

/** Append an error at `name` unless `value` is a number `>= 0`. */
export function mustBeNonNegative(value: number, name: string, errors: ValidationError[]): void {
	if (!(value >= 0)) {
		errors.push({ path: name, message: 'must be a number >= 0' });
	}
}
