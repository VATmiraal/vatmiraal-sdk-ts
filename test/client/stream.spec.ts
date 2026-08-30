import { describe, it, expect } from 'vitest';
import 'result-interface/vitest';
import { result, error, isError, type SafePromise } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { streamLines } from '../../lib/client/stream';

function clientReturning(res: Response | Error): Client {
	return {
		options: { token: 't' },
		request(): SafePromise<Response, Error> {
			return Promise.resolve(res instanceof Error ? error(res) : result(res));
		}
	};
}

function streamOf(chunks: string[]): Response {
	const enc = new TextEncoder();
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			for (const chunk of chunks) {
				controller.enqueue(enc.encode(chunk));
			}
			controller.close();
		}
	});
	return new Response(body);
}

async function collect(res: Awaited<ReturnType<typeof streamLines>>): Promise<string[]> {
	if (isError(res)) {
		throw res.error;
	}
	const lines: string[] = [];
	for await (const line of res.value) {
		lines.push(line);
	}
	return lines;
}

describe(streamLines.name, () => {
	it('yields non-empty lines, skips blanks, and flushes a trailing line without a newline', async () => {
		const client = clientReturning(new Response('a\n\nb\nc'));
		expect(await collect(await streamLines(client, '/x'))).toEqual(['a', 'b', 'c']);
	});

	it('handles a stream that ends with a trailing newline', async () => {
		const client = clientReturning(new Response('a\nb\n'));
		expect(await collect(await streamLines(client, '/x'))).toEqual(['a', 'b']);
	});

	it('buffers a line split across chunks', async () => {
		const client = clientReturning(streamOf(['{"a":1}\n{"b":', '2}\n']));
		expect(await collect(await streamLines(client, '/x'))).toEqual(['{"a":1}', '{"b":2}']);
	});

	it('errors when the response has no body', async () => {
		const client = clientReturning(new Response(null, { status: 200 }));
		expect(await streamLines(client, '/x')).toBeError(new Error('/x returned no body'));
	});

	it('errors on a non-ok status', async () => {
		const client = clientReturning(new Response('busy', { status: 503 }));
		expect(await streamLines(client, '/x')).toBeError(new Error('/x returned 503'));
	});

	it('propagates a transport error', async () => {
		const client = clientReturning(new Error('down'));
		expect(await streamLines(client, '/x')).toBeError(new Error('down'));
	});
});
