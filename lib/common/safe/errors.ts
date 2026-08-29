/** A single validation failure: where it occurred and why. */
export interface ValidationError {
	/** Dotted path to the invalid field, e.g. `'transaction.supplier.country'`. */
	path: string;
	/** Human-readable reason the field is invalid. */
	message: string;
}
