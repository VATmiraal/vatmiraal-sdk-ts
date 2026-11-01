import { result, error, safePromise, isError, type SafePromise } from 'result-interface';
import type { Client } from './types';
import { ApiError, isApiErrorBody } from './api-error';
import { toError } from '../common/to-error';

/**
 * Parse a received `Response`'s JSON body, validated by `guard`, into a Result.
 */
export async function parseJsonResponse<T>(
	res: Response,
	path: string,
	guard: (value: unknown) => value is T
): SafePromise<T, Error> {
	if (!res.ok) {
		const body = await safePromise(res.json());
		if (!isError(body) && isApiErrorBody(body.value)) {
			return error(new ApiError(res.status, body.value.type, body.value.message, body.value.extra));
		}
		return error(new Error(`${path} returned ${res.status}`));
	}
	const json = await safePromise(res.json());
	if (isError(json)) {
		return error(toError(json.error));
	}
	if (!guard(json.value)) {
		return error(new Error(`${path} returned an unexpected payload`));
	}
	return result(json.value);
}

/**
 * Request `path` through `client` and parse its JSON body, validated by `guard`, into a Result.
 * Fails when the request errors, the status is not ok, the body is not JSON, or the payload
 * does not satisfy `guard`.
 */
export async function requestJson<T>(
	client: Client,
	path: string,
	guard: (value: unknown) => value is T,
	init?: RequestInit
): SafePromise<T, Error> {
	const res = await client.request(path, init);
	if (isError(res)) {
		return res;
	}
	return parseJsonResponse(res.value, path, guard);
}
