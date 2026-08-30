export { VatmiraalClient, DEFAULT_BASE_URL } from './vatmiraal-client';
export type {
	Client,
	Method,
	OAuthOptions,
	Route,
	TokenOptions,
	VatmiraalClientOptions
} from './types';
export { ApiError, isApiErrorBody } from './api-error';
export type { ApiErrorBody } from './api-error';
export { ping } from './health';
