/** Credentials to exchange for a session at `/auth/login`. */
export interface LoginInput {
	/** The OAuth ID token (e.g. a Google ID token) to verify. */
	id_token: string;
}

/** The identity of the authenticated user. */
export interface AuthIdentity {
	name: string;
	email: string;
}
