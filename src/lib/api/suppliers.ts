/** Supplier endpoints. */

import { get } from './client';
import type { Page, Supplier } from '$lib/types';

export function listSuppliers(): Promise<Page<Supplier>> {
	return get<Page<Supplier>>('/suppliers?page_size=100');
}
