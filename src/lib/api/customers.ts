/** Customer endpoints. */

import { get, post, put } from './client';
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

export function getCustomer(id: string): Promise<Customer> {
	return get<Customer>(`/customers/${id}`);
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
	return post<Customer>('/customers', input);
}

export function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
	return put<Customer>(`/customers/${id}`, input);
}
