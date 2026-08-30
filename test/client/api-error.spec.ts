import { describe, it, expect } from 'vitest';
import { ApiError, apiErrorFromResponse, isApiErrorBody } from '../../lib/client/api-error';

describe(isApiErrorBody.name, () => {
	it('accepts a well-formed body and rejects others', () => {
		expect(isApiErrorBody({ type: 't', message: 'm' })).toBe(true);
		expect(isApiErrorBody(null)).toBe(false);
		expect(isApiErrorBody({ type: 1, message: 'm' })).toBe(false);
		expect(isApiErrorBody({ type: 't', message: 1 })).toBe(false);
	});
});

describe(apiErrorFromResponse.name, () => {
	it('builds an ApiError from a well-formed error body', async () => {
		const body = { type: 'invalid_param', message: 'bad vat', extra: { field: 'vat' } };
		const err = await apiErrorFromResponse(
			new Response(JSON.stringify(body), { status: 400 }),
			'/x'
		);

		expect(err).toBeInstanceOf(ApiError);
		const apiError = err as ApiError;
		expect(apiError.status).toBe(400);
		expect(apiError.type).toBe('invalid_param');
		expect(apiError.message).toBe('bad vat');
		expect(apiError.extra).toEqual({ field: 'vat' });
	});

	it('falls back to a generic error when the body is valid JSON but not an error body', async () => {
		const err = await apiErrorFromResponse(
			new Response(JSON.stringify({ oops: true }), { status: 500 }),
			'/x'
		);
		expect(err).not.toBeInstanceOf(ApiError);
		expect(err.message).toBe('/x returned 500');
	});

	it('falls back to a generic error when the body is not JSON', async () => {
		const err = await apiErrorFromResponse(new Response('nope', { status: 502 }), '/x');
		expect(err.message).toBe('/x returned 502');
	});
});
