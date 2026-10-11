import { error, isError, type SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import type { InferenceResult } from './inference-types';
import { isInferenceResult } from './inference-guards';

/**
 * Infer candidate structured objects from a free-text description. Fails when
 * classification wholly failed — no candidate resolved to a type (every candidate's
 * `type` is `null`, or there are none).
 */
export async function inferObject(
	client: Client,
	description: string
): SafePromise<InferenceResult, Error> {
	const res = await requestJson(client, '/inference/object', isInferenceResult, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ description })
	});
	if (isError(res)) {
		return res;
	}
	if (res.value.candidates.every((candidate) => candidate.type === null)) {
		return error(new Error('object inference could not classify the description'));
	}
	return res;
}
