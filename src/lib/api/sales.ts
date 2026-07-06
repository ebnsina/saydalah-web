/** Sales (POS) endpoints. */

import { get, post } from './client';
import type { Page, PaymentMethod, Sale } from '$lib/types';

export interface SaleLineInput {
	product_id: string;
	qty: number;
}

export interface CreateSaleInput {
	branch_id?: string | null;
	customer_id?: string | null;
	payment_method: PaymentMethod;
	discount?: number;
	paid?: number;
	lines: SaleLineInput[];
}

export function createSale(input: CreateSaleInput): Promise<Sale> {
	return post<Sale>('/sales', input);
}

export function listSales(branchId: string | null, page = 1): Promise<Page<Sale>> {
	const q = new URLSearchParams({ page: String(page) });
	if (branchId) q.set('branch_id', branchId);
	return get<Page<Sale>>(`/sales?${q.toString()}`);
}

export function voidSale(id: string): Promise<Sale> {
	return post<Sale>(`/sales/${id}/void`);
}
