/**
 * Shared types for the Saydalah API.
 */

/** Error envelope returned by the Go API on non-2xx responses. */
export interface ApiErrorEnvelope {
	error: {
		message: string;
		code?: string;
	};
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	branchId?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: User;
}
