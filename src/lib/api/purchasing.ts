/** Purchasing (purchase orders + goods receipt) endpoints. */

import { get, post } from './client';
import type { Page, PurchaseOrder } from '$lib/types';

export interface POItemInput {
	product_id: string;
	qty: number;
	unit_cost: number;
}

export interface CreatePOInput {
	branch_id?: string | null;
	supplier_id: string;
	reference?: string;
	items: POItemInput[];
}

export interface ReceiveLine {
	product_id: string;
	batch_no: string;
	quantity: number;
	cost_price: number;
	sale_price: number;
	expiry_date: string; // RFC3339
}

export function listOrders(branchId: string | null, page = 1): Promise<Page<PurchaseOrder>> {
	const q = new URLSearchParams({ page: String(page) });
	if (branchId) q.set('branch_id', branchId);
	return get<Page<PurchaseOrder>>(`/purchase-orders?${q.toString()}`);
}

export function createOrder(input: CreatePOInput): Promise<PurchaseOrder> {
	return post<PurchaseOrder>('/purchase-orders', input);
}

export function receiveOrder(id: string, lines: ReceiveLine[]): Promise<PurchaseOrder> {
	return post<PurchaseOrder>(`/purchase-orders/${id}/receive`, { lines });
}
