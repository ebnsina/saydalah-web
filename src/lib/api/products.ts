/** Product (catalog) endpoints. */

import { get, post, put } from './client';
import type { Page, Product } from '$lib/types';

export interface ProductInput {
	name: string;
	generic_name?: string;
	form?: string;
	strength?: string;
	barcode?: string | null;
	category?: string;
	unit?: string;
	reorder_level?: number;
}

export interface ProductFilter {
	search?: string;
	category?: string;
	active?: string; // 'true' | 'false' | ''
	page?: number;
	branchId?: string | null; // include per-branch on_hand
}

export function listProducts(params: ProductFilter = {}): Promise<Page<Product>> {
	const q = new URLSearchParams();
	if (params.search) q.set('search', params.search);
	if (params.category) q.set('category', params.category);
	if (params.active) q.set('active', params.active);
	if (params.page) q.set('page', String(params.page));
	if (params.branchId) q.set('branch_id', params.branchId);
	const qs = q.toString();
	return get<Page<Product>>(`/products${qs ? `?${qs}` : ''}`);
}

export function listCategories(): Promise<{ items: string[] }> {
	return get<{ items: string[] }>('/products/categories');
}

export function getProduct(id: string): Promise<Product> {
	return get<Product>(`/products/${id}`);
}

export function getProductByBarcode(code: string): Promise<Product> {
	return get<Product>(`/products/barcode/${encodeURIComponent(code)}`);
}

export function createProduct(input: ProductInput): Promise<Product> {
	return post<Product>('/products', input);
}

export function updateProduct(id: string, input: ProductInput & { active: boolean }): Promise<Product> {
	return put<Product>(`/products/${id}`, input);
}
