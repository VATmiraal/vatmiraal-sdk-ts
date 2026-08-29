import { describe, it, expect, vi, afterEach } from 'vitest';
import 'result-interface/vitest';
import { isResult } from 'result-interface';
import { VatmiraalClient, DEFAULT_BASE_URL } from '../../lib/client/vatmiraal-client';

type FetchImpl = (...args: unknown[]) => Promise<Response>;

function stubFetch(impl: FetchImpl): ReturnType<typeof vi.fn> {
	const mock = vi.fn(impl);
	vi.stubGlobal('fetch', mock);
	return mock;
}

function initOf(mock: ReturnType<typeof vi.fn>, call = 0): RequestInit {
	return mock.mock.calls[call]![1] as RequestInit;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('VatmiraalClient.baseUrl', () => {
	it('falls back to the default base URL when none is provided', () => {
		expect(new VatmiraalClient({ token: 'abc' }).baseUrl).toBe(DEFAULT_BASE_URL);
	});
});

describe('VatmiraalClient.request', () => {
	it('builds the URL from baseUrl and sends the bearer token', async () => {
		const mock = stubFetch(() => Promise.resolve(new Response('ok', { status: 200 })));
		const client = new VatmiraalClient({ token: 'abc', baseUrl: 'http://api.test' });

		const res = await client.request('/x');

		expect(res).toBeResult();
		expect(mock.mock.calls[0]![0]).toBe('http://api.test/x');
		expect((initOf(mock).headers as Headers).get('Authorization')).toBe('Bearer abc');
	});

	it('applies the OAuth credentials mode and no bearer header', async () => {
		const mock = stubFetch(() => Promise.resolve(new Response('', { status: 200 })));
		const client = new VatmiraalClient({ credentials: 'include', baseUrl: 'http://api.test' });

		await client.request('/x');

		expect(initOf(mock).credentials).toBe('include');
		expect((initOf(mock).headers as Headers).get('Authorization')).toBeNull();
	});

	it('resolves the Response as a Result, including on a non-ok status', async () => {
		const mock = stubFetch(() => Promise.resolve(new Response('', { status: 401 })));
		const client = new VatmiraalClient({ token: 'abc', baseUrl: 'http://api.test' });

		const res = await client.request('/x');

		expect(mock).toHaveBeenCalledTimes(1);
		expect(isResult(res) && res.value.status).toBe(401);
	});

	it('resolves an error result when fetch rejects', async () => {
		stubFetch(() => Promise.reject(new Error('network down')));
		const client = new VatmiraalClient({ token: 'abc', baseUrl: 'http://api.test' });

		expect(await client.request('/x')).toBeError(new Error('network down'));
	});
});
