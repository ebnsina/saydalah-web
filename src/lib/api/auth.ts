/**
 * Auth endpoints: login, logout, and the current-user lookup. Token storage
 * lives in `./token`; automatic access-token refresh lives in `./client`.
 */

import { get, post } from './client';
import { setTokens, getRefreshToken, clearTokens } from './token';
import { session } from '$lib/stores/session.svelte';
import type { LoginResponse, User } from '$lib/types';

/**
 * Whether a session exists (optimistic — the token may be expired). Reads the
 * reactive `session` store so callers inside `$derived`/`$effect` re-run the
 * instant login or logout changes it.
 */
export function isAuthenticated(): boolean {
	return session.authed;
}

/** Exchange credentials for a token pair and persist it. */
export async function login(email: string, password: string): Promise<LoginResponse> {
	const res = await post<LoginResponse>('/auth/login', { email, password });
	setTokens(res.access_token, res.refresh_token);
	return res;
}

/** Revoke the refresh token server-side (best effort) and clear local tokens. */
export async function logout(): Promise<void> {
	const rt = getRefreshToken();
	try {
		if (rt) await post('/auth/logout', { refresh_token: rt });
	} catch {
		/* revoke is best-effort; clear locally regardless */
	} finally {
		clearTokens();
	}
}

/** Fetch the signed-in user's profile. */
export function me(): Promise<User> {
	return get<User>('/auth/me');
}

/** Change the signed-in user's own password (verifies the current one). */
export function changePassword(current_password: string, new_password: string): Promise<void> {
	return post<void>('/auth/change-password', { current_password, new_password });
}
