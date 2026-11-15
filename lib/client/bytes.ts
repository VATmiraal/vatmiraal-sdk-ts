import { result, error, safePromise, isError, type SafePromise } from 'result-interface';
import type { Client } from './types';
import { ApiError, isApiErrorBody } from './api-error';
import { toError } from '../common/to-error';

/**
 * Request `path` through `client` and read its body as raw bytes into a Result. Fails when the
 * request errors or the status is not ok.
 */
export async function requestBytes(
	client: Client,
	path: string,
	init?: RequestInit
): SafePromise<Uint8Array, Error> {
	const res = await client.request(path, init);
	if (isError(res)) {
		return res;
	}
	const response = res.value;
	if (!response.ok) {
		const body = await safePromise(response.json());
		if (!isError(body) && isApiErrorBody(body.value)) {
			return error(
				new ApiError(response.status, body.value.type, body.value.message, body.value.extra)
			);
		}
		return error(new Error(`${path} returned ${response.status}`));
	}
	const bytes = await safePromise(response.arrayBuffer());
	if (isError(bytes)) {
		return error(toError(bytes.error));
	}
	return result(new Uint8Array(bytes.value));
}
