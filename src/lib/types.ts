/**
 * Shared types mirroring the Saydalah Go API (`/api/v1`).
 *
 * Money values are serialized by the API as decimal strings (to preserve
 * precision), so they are typed as `string` here.
 */

/** Error envelope returned by the API on non-2xx responses. */
export interface ApiErrorEnvelope {
	error: {
		message: string;
		details?: Record<string, string>;
	};
}

/** Paginated list envelope (`{ items, total, page, page_size }`). */
export interface Page<T> {
	items: T[];
	total: number;
	page: number;
	page_size: number;
}

export type Role = 'admin' | 'manager' | 'pharmacist' | 'cashier';

export interface User {
	id: string;
	email: string;
	full_name: string;
	role: Role;
	branch_id: string | null;
	// Present on the /users list response; absent on /auth/me.
	active?: boolean;
}

export interface LoginResponse {
	access_token: string;
	refresh_token: string;
	expires_at: string;
	user: User;
}

// --- Domain -----------------------------------------------------------------

export interface Branch {
	id: string;
	name: string;
	address: string;
	phone: string;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Product {
	id: string;
	name: string;
	generic_name: string;
	form: string;
	strength: string;
	barcode: string | null;
	category: string;
	unit: string;
	reorder_level: number;
	active: boolean;
	// On-hand stock at the queried branch (present on branch-scoped product lists).
	on_hand?: number;
	created_at: string;
	updated_at: string;
}

export interface Supplier {
	id: string;
	name: string;
	contact: string;
	phone: string;
	email: string;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Batch {
	id: string;
	product_id: string;
	product_name: string;
	product_form: string;
	batch_no: string;
	quantity: number;
	sale_price: string;
	expiry_date: string;
}

export interface LowStock {
	product_id: string;
	product_name: string;
	product_form: string;
	reorder_level: number;
	on_hand: number;
}

export interface OnHand {
	product_id: string;
	branch_id: string;
	on_hand: number;
}

export interface Customer {
	id: string;
	name: string;
	phone: string;
	address: string;
	created_at: string;
	updated_at: string;
}

export interface PrescriptionItem {
	product_id: string;
	qty: number;
	dosage: string;
}

export interface Prescription {
	id: string;
	customer_id: string;
	branch_id: string;
	doctor_name: string;
	notes: string;
	dispensed_at: string | null;
	created_at: string;
	items: PrescriptionItem[];
}

export interface MovementRow {
	id: string;
	product_id: string;
	product_name: string;
	branch_id: string;
	batch_id: string | null;
	type: string;
	qty: number;
	ref_type: string;
	ref_id: string | null;
	note: string;
	created_by: string | null;
	created_by_name: string | null;
	created_at: string;
}

export type PoStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
	product_id: string;
	qty: number;
	unit_cost: string;
}

export interface PurchaseOrder {
	id: string;
	branch_id: string;
	supplier_id: string;
	status: PoStatus;
	reference: string;
	ordered_at: string | null;
	received_at: string | null;
	created_at: string;
	items: PurchaseOrderItem[];
}

export type PaymentMethod = 'cash' | 'card' | 'mobile';

export interface SaleItem {
	product_id: string;
	batch_id: string;
	qty: number;
	unit_price: string;
}

export interface Sale {
	id: string;
	branch_id: string;
	cashier_id: string;
	customer_id: string | null;
	prescription_id: string | null;
	subtotal: string;
	discount: string;
	tax: string;
	total: string;
	paid: string;
	payment_method: PaymentMethod;
	voided_at: string | null;
	created_at: string;
	items: SaleItem[];
}
