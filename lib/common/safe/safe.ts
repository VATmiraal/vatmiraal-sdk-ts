declare const valid: unique symbol;

/** Recursively mark every property, and every array, of `T` as readonly. */
export type DeepReadonly<T> = T extends (infer U)[]
	? ReadonlyArray<DeepReadonly<U>>
	: T extends object
		? { readonly [K in keyof T]: DeepReadonly<T[K]> }
		: T;

/**
 * A `T` that has passed validation: deeply readonly, so it cannot be changed, and branded, so it
 * can only come from a validating factory. Holding a `Safe<T>` guarantees it is valid.
 */
export type Safe<T> = DeepReadonly<T> & { readonly [valid]: true };

/** Brand an already-validated value as {@link Safe}. Used only by the validating factories. */
export function asSafe<T>(value: T): Safe<T> {
	return value as unknown as Safe<T>;
}
