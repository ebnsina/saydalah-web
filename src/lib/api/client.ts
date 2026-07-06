/**
 * Typed fetch wrapper for the Saydalah Go REST API.
 *
 * Attaches the bearer token when present and parses the API's
 * `{ error: { message } }` envelope into a thrown `Error` on non-2xx
 * responses, so TanStack Query routes failures to `query.error`.
 */

import { getToken } from './auth';
import type { ApiErrorEnvelope } from '$lib/types';

const BASE_URL = (
	(import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080/api/v1'
).replace(/\/$/, '');

function authHeaders(): HeadersInit {
	const token = getToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...authHeaders(),
			...init.headers
		}
	});

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
	return request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
	return request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function del<T>(path: string): Promise<T> {
	return request<T>(path, { method: 'DELETE' });
}
