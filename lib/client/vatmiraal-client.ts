import { safePromise, error, isError, type SafePromise } from 'result-interface';
import type { Client, VatmiraalClientOptions } from './types';
import { toError } from '../common/to-error';

/** Base URL used when options omit `baseUrl`. */
export const DEFAULT_BASE_URL = 'https://api.vatmiraal.be';

/**
 * The standard {@link Client}: reaches the service at `baseUrl` and authenticates each request
 * with the configured token or credentials.
 */
export class VatmiraalClient implements Client {
	constructor(readonly options: VatmiraalClientOptions) {}

	/** Base URL requests are made relative to, with the default applied. */
	get baseUrl(): string {
		return this.options.baseUrl ?? DEFAULT_BASE_URL;
	}

	async request(path: string, init?: RequestInit): SafePromise<Response, Error> {
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
