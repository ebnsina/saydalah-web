/** Supplier endpoints. */

import { get, post, put } from './client';
import type { Page, Supplier } from '$lib/types';

export function listSuppliers(): Promise<Page<Supplier>> {
	return get<Page<Supplier>>('/suppliers?page_size=100');
}

export function createSupplier(input: {
	name: string;
	contact?: string;
	phone?: string;
	email?: string;
}): Promise<Supplier> {
	return post<Supplier>('/suppliers', input);
}

export function updateSupplier(
	id: string,
	input: { name: string; contact?: string; phone?: string; email?: string; active: boolean }
): Promise<Supplier> {
	return put<Supplier>(`/suppliers/${id}`, input);
}
