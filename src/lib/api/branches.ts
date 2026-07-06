/** Branch endpoints. */

import { get, post, put } from './client';
import type { Branch, Page } from '$lib/types';

export function listBranches(): Promise<Page<Branch>> {
	return get<Page<Branch>>('/branches?page_size=100');
}

export function createBranch(input: {
	name: string;
	address?: string;
	phone?: string;
}): Promise<Branch> {
	return post<Branch>('/branches', input);
}

export function updateBranch(
	id: string,
	input: { name: string; address?: string; phone?: string; active: boolean }
): Promise<Branch> {
	return put<Branch>(`/branches/${id}`, input);
}
