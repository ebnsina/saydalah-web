/** Customer endpoints. */

import { get, post } from './client';
import type { Customer, Page } from '$lib/types';

export interface CustomerInput {
	name: string;
	phone?: string;
	address?: string;
}

export function listCustomers(params: { search?: string; page?: number } = {}): Promise<Page<Customer>> {
	const q = new URLSearchParams();
	if (params.search) q.set('search', params.search);
	if (params.page) q.set('page', String(params.page));
	const qs = q.toString();
	return get<Page<Customer>>(`/customers${qs ? `?${qs}` : ''}`);
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
	return post<Customer>('/customers', input);
}
