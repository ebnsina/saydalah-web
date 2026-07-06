import { describe, it, expect } from 'vitest';
import {
	validate,
	loginSchema,
	customerSchema,
	userCreateSchema,
	apiFieldErrors
} from './validation';
import { ApiError } from './api/client';

describe('validate', () => {
	it('returns parsed data on success', () => {
		const r = validate(loginSchema, { email: 'a@b.com', password: 'x' });
		expect(r.errors).toBeNull();
		expect(r.data).toEqual({ email: 'a@b.com', password: 'x' });
	});

	it('reports field errors on bad input', () => {
		const r = validate(loginSchema, { email: 'nope', password: '' });
		expect(r.data).toBeNull();
		expect(r.errors?.email).toBeTruthy();
		expect(r.errors?.password).toBeTruthy();
	});

	it('customer name must be at least 2 chars', () => {
		expect(validate(customerSchema, { name: 'a', phone: '', address: '' }).errors?.name).toBeTruthy();
	});
});

describe('userCreateSchema branch rule', () => {
	const base = { full_name: 'Jane', email: 'j@x.com', password: 'password1' };

	it('requires a branch for non-admin roles', () => {
		const r = validate(userCreateSchema, { ...base, role: 'cashier', branch_id: '' });
		expect(r.errors?.branch_id).toBeTruthy();
	});

	it('allows admin without a branch', () => {
		const r = validate(userCreateSchema, { ...base, role: 'admin', branch_id: '' });
		expect(r.errors).toBeNull();
	});

	it('rejects a short password', () => {
		const r = validate(userCreateSchema, { ...base, password: 'short', role: 'admin', branch_id: '' });
		expect(r.errors?.password).toBeTruthy();
	});
});

describe('apiFieldErrors', () => {
	it('extracts details from an ApiError', () => {
		const err = new ApiError('validation failed', 422, { email: 'bad' });
		expect(apiFieldErrors(err)).toEqual({ email: 'bad' });
	});
	it('returns empty for a plain error', () => {
		expect(apiFieldErrors(new Error('boom'))).toEqual({});
	});
});
