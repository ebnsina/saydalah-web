/**
 * Auth token store and thin auth endpoints for the Saydalah API.
 *
 * The token is kept in memory for fast synchronous reads during the current
 * page's lifetime, and mirrored to `localStorage` so it survives reloads.
 */

import { browser } from '$app/environment';
import { get, post } from './client';
import type { LoginResponse, User } from '$lib/types';

const STORAGE_KEY = 'saydalah_token';

let token: string | null = browser ? localStorage.getItem(STORAGE_KEY) : null;

export function getToken(): string | null {
	return token;
}

export function setToken(next: string): void {
	token = next;
	if (browser) {
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			/* storage unavailable (private mode) — ignore */
		}
	}
}

export function clearToken(): void {
	token = null;
	if (browser) {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			/* storage unavailable (private mode) — ignore */
		}
	}
}

export function login(email: string, password: string): Promise<LoginResponse> {
	return post<LoginResponse>('/auth/login', { email, password });
}

export function me(): Promise<User> {
	return get<User>('/auth/me');
}
