/** Branch endpoints. */

import { get, post } from './client';
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
