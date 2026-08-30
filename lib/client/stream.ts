import { result, error, isError, type SafePromise } from 'result-interface';
import type { Client } from './types';
import { apiErrorFromResponse } from './api-error';

/**
 * Request `path` through `client` and stream its response body as decoded text lines. The outer
 * Result covers the setup: a transport failure or a non-ok status resolves as an error (mapped
 * through {@link apiErrorFromResponse}), and a response with no body resolves as an error too. On
 * success it resolves to an async generator that yields each newline-delimited line, with empty
 * lines skipped, as it arrives.
 */
export async function streamLines(
	client: Client,
	path: string,
	init?: RequestInit
): SafePromise<AsyncGenerator<string, void, void>, Error> {
	const res = await client.request(path, init);
	if (isError(res)) {
		return res;
	}
	if (!res.value.ok) {
		return error(await apiErrorFromResponse(res.value, path));
	}
	const body = res.value.body;
	if (body === null) {
		return error(new Error(`${path} returned no body`));
	}
	return result(readLines(body));
}

async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, void> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	for (;;) {
		const { value, done } = await reader.read();
		if (done) {
			break;
		}
		buffer += decoder.decode(value, { stream: true });
		let newline = buffer.indexOf('\n');
		while (newline !== -1) {
			const line = buffer.slice(0, newline).trim();
			buffer = buffer.slice(newline + 1);
			if (line !== '') {
				yield line;
			}
			newline = buffer.indexOf('\n');
		}
	}
	buffer += decoder.decode();
	const last = buffer.trim();
	if (last !== '') {
		yield last;
	}
}
