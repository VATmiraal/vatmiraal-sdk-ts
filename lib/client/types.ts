import type { SafePromise } from 'result-interface';

/** Options common to every authentication mode. */
interface CommonOptions {
	/** Base URL of the service. Defaults to the production URL. Should not end with a slash. */
	baseUrl?: string;
}

/** Authenticate with a bearer token, sent as `Authorization: Bearer <token>`. */
export interface TokenOptions extends CommonOptions {
	token: string;
	credentials?: never;
}

/** Authenticate with an OAuth session cookie, sent by setting the request credentials mode. */
export interface OAuthOptions extends CommonOptions {
	/**
	 * How the browser attaches cookies to each request. Set to `'include'`: the service is a
	 * different origin, and the session cookie is only sent when credentials are included.
	 */
	credentials: RequestInit['credentials'];
	token?: never;
}

/** Options for a {@link VatmiraalClient}. Provide a token or credentials, not both. */
export type VatmiraalClientOptions = TokenOptions | OAuthOptions;

/** An HTTP method the SDK issues. */
export type Method = 'GET' | 'POST';

/**
 * A route the SDK is allowed to call, its path in OpenAPI template form (e.g.
 * `/vat-template/{country}`).
 */
export interface Route {
	readonly method: Method;
	readonly path: string;
}

/**
 * The request surface the API functions depend on. {@link VatmiraalClient} is the standard
 * implementation; a unit test, or an implementor wanting different reconnect behavior, can
 * provide its own.
 */
export interface Client {
	/** The options this client was created with. */
	readonly options: VatmiraalClientOptions;
	/**
	 * The routes this client is allowed to issue. {@link request} refuses anything not listed here,
	 * so the SDK's surface is declared in one place rather than scattered across call sites.
	 */
	readonly routes: readonly Route[];
	/**
	 * Perform a request and resolve its `Response` as a Result, never throwing. A non-ok status
	 * (4xx/5xx) still resolves as an ok Result carrying that `Response`; only a transport failure
	 * resolves as an error. A path that matches no {@link routes} entry resolves as an error
	 * without touching the network.
	 */
	request(path: string, init?: RequestInit): SafePromise<Response, Error>;
}
