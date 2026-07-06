/**
 * Access + refresh token storage.
 *
 * Tokens are held in memory for fast synchronous reads and mirrored to
 * `localStorage` so a session survives reloads. This module has no other
 * dependencies, so both the HTTP client and the auth endpoints can use it
 * without an import cycle.
 */

import { browser } from '$app/environment';
import { session } from '$lib/stores/session.svelte';

const ACCESS_KEY = 'saydalah_access';
const REFRESH_KEY = 'saydalah_refresh';

let accessToken: string | null = browser ? localStorage.getItem(ACCESS_KEY) : null;
let refreshToken: string | null = browser ? localStorage.getItem(REFRESH_KEY) : null;

export function getAccessToken(): string | null {
	return accessToken;
}

export function getRefreshToken(): string | null {
	return refreshToken;
}

export function setTokens(access: string, refresh: string): void {
	accessToken = access;
	refreshToken = refresh;
	session.authed = true; // reactive: chrome/guards update immediately
	persist(ACCESS_KEY, access);
	persist(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
	accessToken = null;
	refreshToken = null;
	session.authed = false;
	persist(ACCESS_KEY, null);
	persist(REFRESH_KEY, null);
}

function persist(key: string, value: string | null): void {
	if (!browser) return;
	try {
		if (value === null) localStorage.removeItem(key);
		else localStorage.setItem(key, value);
	} catch {
		/* storage unavailable (private mode) — ignore */
	}
}
