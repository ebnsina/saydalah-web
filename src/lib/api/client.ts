/**
 * Typed fetch wrapper for the Saydalah Go REST API.
 *
 * Attaches the access token, parses the API's `{ error: { message } }` envelope
 * into a thrown `Error` on non-2xx responses (so TanStack Query routes failures
 * to `query.error`), and transparently refreshes an expired access token once
 * before retrying the request.
 */

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token';
import type { ApiErrorEnvelope, LoginResponse } from '$lib/types';

const BASE_URL = (
	(import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080/api/v1'
).replace(/\/$/, '');

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
	const rt = getRefreshToken();
	if (!rt) return false;
	if (!refreshing) {
		refreshing = fetch(`${BASE_URL}/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: rt })
		})
			.then(async (res) => {
				if (!res.ok) {
					clearTokens();
					return false;
				}
				const data = (await res.json()) as LoginResponse;
				setTokens(data.access_token, data.refresh_token);
				return true;
			})
			.catch(() => {
				clearTokens();
				return false;
			})
			.finally(() => {
				refreshing = null;
			});
	}
	return refreshing;
}

const TIMEOUT_MS = 12_000;

async function request<T>(path: string, init: RequestInit = {}, allowRetry = true): Promise<T> {
	const token = getAccessToken();

	// Abort the request if it takes too long, so the UI never hangs forever on a
	// spinner — the query surfaces a friendly timeout error instead.
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	let res: Response;
	try {
		res = await fetch(`${BASE_URL}${path}`, {
			...init,
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...init.headers
			}
		});
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') {
			throw new Error('The request timed out. Check your connection and try again.');
		}
		throw new Error('Could not reach the server. Check your connection and try again.');
	} finally {
		clearTimeout(timer);
	}

	// Expired/invalid access token: refresh once and retry (never for auth routes).
	if (res.status === 401 && allowRetry && !path.startsWith('/auth/') && getRefreshToken()) {
		if (await refreshAccessToken()) return request<T>(path, init, false);
	}

	if (!res.ok) {
		let message = `Request failed (HTTP ${res.status})`;
		try {
			const body = (await res.json()) as ApiErrorEnvelope;
			if (body?.error?.message) message = body.error.message;
		} catch {
			/* non-JSON error body */
		}
		throw new Error(message);
	}

	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}

export function get<T>(path: string): Promise<T> {
	return request<T>(path, { method: 'GET' });
}

export function post<T>(path: string, body?: unknown): Promise<T> {
	return request<T>(path, {
		method: 'POST',
		body: body !== undefined ? JSON.stringify(body) : undefined
	});
}

export function put<T>(path: string, body?: unknown): Promise<T> {
	return request<T>(path, {
		method: 'PUT',
		body: body !== undefined ? JSON.stringify(body) : undefined
	});
}

export function del<T>(path: string): Promise<T> {
	return request<T>(path, { method: 'DELETE' });
}
