import { result, isError, type SafePromise } from 'result-interface';
import type { Client } from './types';
import { requestJson } from './json';

function isAlive(value: unknown): value is { alive: boolean } {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { alive: unknown }).alive === 'boolean'
	);
}

/** Check whether the service is alive. */
export async function ping(client: Client): SafePromise<boolean, Error> {
	const res = await requestJson(client, '/', isAlive);
	return isError(res) ? res : result(res.value.alive);
}
