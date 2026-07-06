/** Reporting endpoints (branch-scoped, manager/admin). */

import { get } from './client';

export interface SalesSummary {
	from: string;
	to: string;
	sale_count: number;
	subtotal_total: string;
	discount_total: string;
	tax_total: string;
	revenue: string;
}

export interface TopProduct {
	product_id: string;
	product_name: string;
	units_sold: number;
	revenue: string;
}

export interface InventoryValuation {
	total_units: number;
	cost_value: string;
	retail_value: string;
}

function rangeQ(branchId: string | null, from?: string, to?: string): string {
	const q = new URLSearchParams();
	if (branchId) q.set('branch_id', branchId);
	if (from) q.set('from', from);
	if (to) q.set('to', to);
	const s = q.toString();
	return s ? `?${s}` : '';
}

export function salesSummary(
	branchId: string | null,
	from?: string,
	to?: string
): Promise<SalesSummary> {
	return get<SalesSummary>(`/reports/sales-summary${rangeQ(branchId, from, to)}`);
}

export function topProducts(
	branchId: string | null,
	opts: { from?: string; to?: string; limit?: number } = {}
): Promise<{ items: TopProduct[] }> {
	const q = new URLSearchParams();
	if (branchId) q.set('branch_id', branchId);
	if (opts.from) q.set('from', opts.from);
	if (opts.to) q.set('to', opts.to);
	q.set('limit', String(opts.limit ?? 5));
	return get<{ items: TopProduct[] }>(`/reports/top-products?${q.toString()}`);
}

export interface DailySales {
	day: string;
	sale_count: number;
	revenue: string;
}

export function salesDaily(
	branchId: string | null,
	from?: string,
	to?: string
): Promise<{ items: DailySales[] }> {
	return get<{ items: DailySales[] }>(`/reports/sales-daily${rangeQ(branchId, from, to)}`);
}

export interface PaymentBreakdown {
	payment_method: string;
	sale_count: number;
	revenue: string;
}

export function salesByPayment(
	branchId: string | null,
	from?: string,
	to?: string
): Promise<{ items: PaymentBreakdown[] }> {
	return get<{ items: PaymentBreakdown[] }>(`/reports/sales-by-payment${rangeQ(branchId, from, to)}`);
}

export function inventoryValuation(branchId: string | null): Promise<InventoryValuation> {
	return get<InventoryValuation>(`/reports/inventory-valuation${rangeQ(branchId)}`);
}
