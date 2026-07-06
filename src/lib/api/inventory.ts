/** Inventory read endpoints (branch-scoped). */

import { get } from './client';
import type { Batch, LowStock, OnHand, Page } from '$lib/types';

function branchQ(branchId: string | null, extra: Record<string, string> = {}): string {
	const q = new URLSearchParams(extra);
	if (branchId) q.set('branch_id', branchId);
	const s = q.toString();
	return s ? `?${s}` : '';
}

export function listBatches(branchId: string | null, page = 1): Promise<Page<Batch>> {
	return get<Page<Batch>>(`/inventory/batches${branchQ(branchId, { page: String(page) })}`);
}

export function nearExpiry(branchId: string | null, withinDays = 30): Promise<{ items: Batch[] }> {
	return get<{ items: Batch[] }>(
		`/inventory/near-expiry${branchQ(branchId, { within_days: String(withinDays) })}`
	);
}

export function lowStock(branchId: string | null): Promise<{ items: LowStock[] }> {
	return get<{ items: LowStock[] }>(`/inventory/low-stock${branchQ(branchId)}`);
}

export function onHand(branchId: string | null, productId: string): Promise<OnHand> {
	return get<OnHand>(`/inventory/on-hand/${productId}${branchQ(branchId)}`);
}

export interface BranchStock {
	branch_id: string;
	branch_name: string;
	on_hand: number;
}

export function stockByBranch(productId: string): Promise<{ items: BranchStock[] }> {
	return get<{ items: BranchStock[] }>(`/inventory/products/${productId}/stock`);
}

export function productBatches(branchId: string | null, productId: string): Promise<{ items: Batch[] }> {
	return get<{ items: Batch[] }>(`/inventory/products/${productId}/batches${branchQ(branchId)}`);
}
