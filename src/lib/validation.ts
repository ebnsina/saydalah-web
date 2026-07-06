/**
 * Client-side form validation with zod. This gives immediate UX feedback on
 * input shape (required, email, ranges); the API remains the source of truth
 * for business errors (conflicts, insufficient stock, …), which pages surface
 * from the error envelope.
 */

import { z } from 'zod';

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
