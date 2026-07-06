/** Supplier endpoints. */

import { get, post } from './client';
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
