import { result, error, safePromise, isError, type SafePromise } from 'result-interface';
import type { Client } from './types';
import { apiErrorFromResponse } from './api-error';
import { toError } from '../common/to-error';

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
	if (!res.value.ok) {
		return error(await apiErrorFromResponse(res.value, path));
	}
	const json = await safePromise(res.value.json());
	if (isError(json)) {
		return error(toError(json.error));
	}
	if (!guard(json.value)) {
		return error(new Error(`${path} returned an unexpected payload`));
	}
	return result(json.value);
}
