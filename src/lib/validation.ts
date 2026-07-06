/**
 * Client-side form validation with zod. This gives immediate UX feedback on
 * input shape (required, email, ranges); the API remains the source of truth
 * for business errors (conflicts, insufficient stock, …), which pages surface
 * from the error envelope.
 */

import { z } from 'zod';
import { ApiError } from '$lib/api/client';

/**
 * Extract per-field messages from a failed API call (the envelope's
 * `error.details`), so server-side validation lands on the right field. Returns
 * an empty map for non-field errors.
 */
export function apiFieldErrors(err: unknown): Record<string, string> {
	return err instanceof ApiError && err.details ? err.details : {};
}

/** Run a schema and return either parsed data or a field→message error map. */
export function validate<T>(
	schema: z.ZodType<T>,
	data: unknown
): { data: T; errors: null } | { data: null; errors: Record<string, string> } {
	const res = schema.safeParse(data);
	if (res.success) return { data: res.data, errors: null };
	const errors: Record<string, string> = {};
	for (const issue of res.error.issues) {
		const key = issue.path.join('.') || '_';
		if (!errors[key]) errors[key] = issue.message;
	}
	return { data: null, errors };
}

export const loginSchema = z.object({
	email: z.email('Enter a valid email address'),
	password: z.string().min(1, 'Password is required')
});

export const saleSchema = z.object({
	payment_method: z.enum(['cash', 'card', 'mobile']),
	discount: z.number().min(0, 'Discount cannot be negative'),
	lines: z
		.array(z.object({ product_id: z.string(), qty: z.number().int().positive() }))
		.min(1, 'Add at least one product to the cart')
});

const optionalEmail = z.union([z.literal(''), z.email('Enter a valid email address')]);

export const branchSchema = z.object({
	name: z.string().trim().min(2, 'Branch name is required'),
	address: z.string().max(200),
	phone: z.string().max(40)
});

export const supplierSchema = z.object({
	name: z.string().trim().min(2, 'Supplier name is required'),
	contact: z.string().max(120),
	phone: z.string().max(40),
	email: optionalEmail
});

export const customerSchema = z.object({
	name: z.string().trim().min(2, 'Customer name is required'),
	phone: z.string().max(40),
	address: z.string().max(200)
});

const roleEnum = z.enum(['admin', 'manager', 'pharmacist', 'cashier']);
const branchRequiredUnlessAdmin = { message: 'Select a branch', path: ['branch_id'] };

export const userCreateSchema = z
	.object({
		full_name: z.string().trim().min(2, 'Full name is required'),
		email: z.email('Enter a valid email address'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		role: roleEnum,
		branch_id: z.string()
	})
	.refine((d) => d.role === 'admin' || d.branch_id !== '', branchRequiredUnlessAdmin);

export const userEditSchema = z
	.object({
		full_name: z.string().trim().min(2, 'Full name is required'),
		role: roleEnum,
		branch_id: z.string()
	})
	.refine((d) => d.role === 'admin' || d.branch_id !== '', branchRequiredUnlessAdmin);

export const productSchema = z.object({
	name: z.string().trim().min(2, 'Name must be at least 2 characters'),
	generic_name: z.string().max(160),
	form: z.string().max(60),
	strength: z.string().max(60),
	barcode: z.string().max(64),
	category: z.string().max(80),
	unit: z.string().max(32),
	reorder_level: z.number().int('Whole number').min(0, 'Must be 0 or more')
});
