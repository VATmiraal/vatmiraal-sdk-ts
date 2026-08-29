import type { SafePromise } from 'result-interface';
import type { Client } from './types';
import { requestJson } from './json';
import { PATH_OPENAPI, type HttpMethod } from './endpoints';

/**
 * A minimal view of an OpenAPI document: its `paths`, each mapping the methods it declares.
 * Only the parts the drift check reads are modelled.
 */
export interface OpenApiDocument {
	paths: Record<string, Partial<Record<Lowercase<HttpMethod>, unknown>>>;
}

function isOpenApiDocument(value: unknown): value is OpenApiDocument {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { paths: unknown }).paths === 'object' &&
		(value as { paths: unknown }).paths !== null
	);
}

/** Fetch the service's OpenAPI document. This endpoint requires no authentication. */
export function fetchOpenApi(client: Client): SafePromise<OpenApiDocument, Error> {
	return requestJson(client, PATH_OPENAPI, isOpenApiDocument);
}
