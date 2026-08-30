import { safePromise, error, isError, type SafePromise } from 'result-interface';
import { URLPattern } from 'urlpattern-polyfill';
import type { Client, Route, VatmiraalClientOptions } from './types';
import { toError } from '../common/to-error';

/** Base URL used when options omit `baseUrl`. */
export const DEFAULT_BASE_URL = 'https://api.vatmiraal.be';

/**
 * Every route the SDK knows how to call, its path in OpenAPI template form. This is the
 * authoritative surface: {@link VatmiraalClient} refuses to issue anything not listed here, and
 * the e2e suite checks it against the live OpenAPI spec so a new backend route without SDK support
 * is caught.
 */
export const REGISTERED_ROUTES = [
	{ method: 'GET', path: '/' },
	{ method: 'POST', path: '/tax-grid-analysis' },
	{ method: 'POST', path: '/vat-validation' },
	{ method: 'GET', path: '/vat-template' },
	{ method: 'GET', path: '/vat-template/{country}' },
	{ method: 'POST', path: '/inference/object' },
	{ method: 'GET', path: '/transaction-type' },
	{ method: 'GET', path: '/party-type' },
	{ method: 'GET', path: '/transport-by' },
	{ method: 'GET', path: '/country' },
	{ method: 'GET', path: '/category' },
	{ method: 'GET', path: '/property/object' },
	{ method: 'GET', path: '/property/party' }
] as const satisfies readonly Route[];

/** Registered templates compiled once, `{param}` rewritten to the URLPattern `:param` form. */
const PATTERNS = REGISTERED_ROUTES.map((route) => ({
	method: route.method,
	pattern: new URLPattern({ pathname: route.path.replace(/\{(\w+)\}/g, ':$1') })
}));

/** Whether `method` and a concrete `path` match a registered route. */
function isRegistered(method: string, path: string): boolean {
	const wanted = method.toUpperCase();
	const pathname = path.split('?')[0];
	return PATTERNS.some((r) => r.method === wanted && r.pattern.test({ pathname }));
}

/**
 * The standard {@link Client}: reaches the service at `baseUrl` and authenticates each request
 * with the configured token or credentials.
 */
export class VatmiraalClient implements Client {
	readonly routes: readonly Route[] = REGISTERED_ROUTES;

	constructor(readonly options: VatmiraalClientOptions) {}

	/** Base URL requests are made relative to, with the default applied. */
	get baseUrl(): string {
		return this.options.baseUrl ?? DEFAULT_BASE_URL;
	}

	async request(path: string, init?: RequestInit): SafePromise<Response, Error> {
		const method = init?.method ?? 'GET';
		if (!isRegistered(method, path)) {
			return error(new Error(`${method} ${path} is not a registered VATmiraal route`));
		}
		const sent = await safePromise(
			globalThis.fetch(`${this.baseUrl}${path}`, this.applyAuth(init))
		);
		return isError(sent) ? error(toError(sent.error)) : sent;
	}

	private applyAuth(init?: RequestInit): RequestInit {
		const headers = new Headers(init?.headers);
		if (this.options.token) {
			headers.set('Authorization', `Bearer ${this.options.token}`);
		}
		const next: RequestInit = { ...init, headers };
		if (this.options.credentials) {
			next.credentials = this.options.credentials;
		}
		return next;
	}
}
