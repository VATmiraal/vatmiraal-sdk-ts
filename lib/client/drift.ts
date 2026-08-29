import { isError, result, type SafePromise } from 'result-interface';
import type { Client } from './types';
import { fetchOpenApi } from './openapi';
import { OPERATIONS, type HttpMethod } from './endpoints';

/** An endpoint the SDK calls that the live spec no longer declares. */
export interface DriftEntry {
	method: HttpMethod;
	path: string;
}

/** The outcome of an endpoint drift check. */
export interface DriftReport {
	/** True when every endpoint the SDK calls is present in the live spec. */
	ok: boolean;
	/** The endpoints the SDK calls that the spec is missing, from a rename or removal. */
	missing: DriftEntry[];
}

/**
 * Fetch the live OpenAPI document and check that every endpoint the SDK calls still exists in it,
 * reporting the ones the spec is missing. A renamed or removed route is thus caught before it
 * reaches a user.
 */
export async function checkEndpointDrift(client: Client): SafePromise<DriftReport, Error> {
	const spec = await fetchOpenApi(client);
	if (isError(spec)) {
		return spec;
	}
	const missing: DriftEntry[] = [];
	for (const operation of OPERATIONS) {
		const methods = spec.value.paths[operation.path];
		const method = operation.method.toLowerCase() as Lowercase<HttpMethod>;
		if (methods === undefined || methods[method] === undefined) {
			missing.push({ method: operation.method, path: operation.path });
		}
	}
	return result({ ok: missing.length === 0, missing });
}
