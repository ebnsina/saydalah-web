/** Manual stock operations + movement ledger. */

import { get, post } from './client';
import type { MovementRow, Page } from '$lib/types';

export function listMovements(
	branchId: string | null,
	opts: { productId?: string; page?: number } = {}
): Promise<Page<MovementRow>> {
	const q = new URLSearchParams({ page: String(opts.page ?? 1) });
	if (branchId) q.set('branch_id', branchId);
	if (opts.productId) q.set('product_id', opts.productId);
	return get<Page<MovementRow>>(`/stock/movements?${q.toString()}`);
}

export function adjustStock(input: { batch_id: string; delta: number; note?: string }): Promise<unknown> {
	return post('/stock/adjustments', input);
}

export function returnStock(input: {
	batch_id: string;
	qty: number;
	sale_id?: string;
	note?: string;
}): Promise<unknown> {
	return post('/stock/returns', input);
}

export function transferStock(input: {
	batch_id: string;
	to_branch_id: string;
	qty: number;
	note?: string;
}): Promise<unknown> {
	return post('/stock/transfers', input);
}

export function stockTake(input: {
	branch_id?: string | null;
	lines: { batch_id: string; counted_qty: number }[];
}): Promise<unknown> {
	return post('/stock/stock-takes', input);
}
