import type { SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import { PATH_INFERENCE_OBJECT } from '../client/endpoints';
import type { InferenceResult } from './inference-types';
import { isInferenceResult } from './inference-guards';

/** Infer candidate structured objects from a free-text description. */
export function inferObject(
	client: Client,
	description: string
): SafePromise<InferenceResult, Error> {
	return requestJson(client, PATH_INFERENCE_OBJECT, isInferenceResult, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ description })
	});
}
