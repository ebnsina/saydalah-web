/** Prescription endpoints. */

import { get, post } from './client';
import type { Page, Prescription, Sale, PaymentMethod } from '$lib/types';

export interface PrescriptionItemInput {
	product_id: string;
	qty: number;
	dosage?: string;
}

export interface CreatePrescriptionInput {
	branch_id?: string | null;
	customer_id: string;
	doctor_name?: string;
	notes?: string;
	items: PrescriptionItemInput[];
}

export interface DispenseInput {
	payment_method: PaymentMethod;
	discount?: number;
	paid?: number;
}

export function listPrescriptions(
	branchId: string | null,
	opts: { page?: number; customerId?: string } = {}
): Promise<Page<Prescription>> {
	const q = new URLSearchParams({ page: String(opts.page ?? 1) });
	if (branchId) q.set('branch_id', branchId);
	if (opts.customerId) q.set('customer_id', opts.customerId);
	return get<Page<Prescription>>(`/prescriptions?${q.toString()}`);
}

export function getPrescription(id: string): Promise<Prescription> {
	return get<Prescription>(`/prescriptions/${id}`);
}

export function createPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
	return post<Prescription>('/prescriptions', input);
}

export function dispensePrescription(id: string, input: DispenseInput): Promise<Sale> {
	return post<Sale>(`/prescriptions/${id}/dispense`, input);
}
