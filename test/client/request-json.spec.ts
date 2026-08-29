import { describe, it, expect } from 'vitest';
import 'result-interface/vitest';
import { result, error, isError, type SafePromise } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { requestJson } from '../../lib/client/json';
import { ApiError } from '../../lib/client/api-error';

function clientReturning(res: Response | Error): Client {
	return {
		options: { token: 't' },
		request(): SafePromise<Response, Error> {
			return Promise.resolve(res instanceof Error ? error(res) : result(res));
		}
	};
}

const isNumberArray = (v: unknown): v is number[] =>
	Array.isArray(v) && v.every((n) => typeof n === 'number');

describe('requestJson', () => {
	it('parses and guards an ok JSON body', async () => {
		const client = clientReturning(new Response(JSON.stringify([1, 2, 3]), { status: 200 }));
		expect(await requestJson(client, '/x', isNumberArray)).toBeResult([1, 2, 3]);
	});

	it('returns an ApiError with the API message on a non-ok status', async () => {
		const body = { type: 'invalid_param', message: 'bad vat', extra: { field: 'vat' } };
		const client = clientReturning(new Response(JSON.stringify(body), { status: 400 }));

		const res = await requestJson(client, '/x', isNumberArray);

		expect(isError(res)).toBe(true);
		if (isError(res)) {
			expect(res.error).toBeInstanceOf(ApiError);
			const apiError = res.error as ApiError;
			expect(apiError.status).toBe(400);
			expect(apiError.type).toBe('invalid_param');
			expect(apiError.message).toBe('bad vat');
			expect(apiError.extra).toEqual({ field: 'vat' });
		}
	});

	it('falls back to a generic error when the body is not an API error', async () => {
		const client = clientReturning(new Response('nope', { status: 500 }));
		expect(await requestJson(client, '/x', isNumberArray)).toBeError(new Error('/x returned 500'));
	});

	it('errors when an ok body is not valid JSON', async () => {
		const client = clientReturning(new Response('not json', { status: 200 }));
		expect(await requestJson(client, '/x', isNumberArray)).toBeError();
	});

	it('errors when the payload does not satisfy the guard', async () => {
		const client = clientReturning(new Response(JSON.stringify(['a']), { status: 200 }));
		expect(await requestJson(client, '/x', isNumberArray)).toBeError(
			new Error('/x returned an unexpected payload')
		);
	});

	it('propagates a transport error', async () => {
		const client = clientReturning(new Error('boom'));
		expect(await requestJson(client, '/x', isNumberArray)).toBeError(new Error('boom'));
	});
});
