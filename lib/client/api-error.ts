/** The error body returned on a failed request. */
export interface ApiErrorBody {
	/** Machine-readable error code. */
	type: string;
	/** Human-readable explanation of the error. */
	message: string;
	/** Optional error-specific details. */
	extra?: unknown;
}

/** True when `value` is a well-formed {@link ApiErrorBody}. */
export function isApiErrorBody(value: unknown): value is ApiErrorBody {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { type: unknown }).type === 'string' &&
		typeof (value as { message: unknown }).message === 'string'
	);
}

/** An error returned by the API, carrying its HTTP status, error code, message, and details. */
export class ApiError extends Error {
	constructor(
		/** HTTP status of the failed response. */
		readonly status: number,
		/** Machine-readable error code. */
		readonly type: string,
		message: string,
		/** Optional error-specific details. */
		readonly extra?: unknown
	) {
		super(message);
		this.name = 'ApiError';
	}
}
