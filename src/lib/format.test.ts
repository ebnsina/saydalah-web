import { describe, it, expect } from 'vitest';
import { fmtMoney, todayParam, monthStartParam, daysUntil } from './format';

describe('fmtMoney', () => {
	it('formats a decimal string as currency', () => {
		expect(fmtMoney('3.24')).toMatch(/3\.24/);
	});
	it('accepts numbers', () => {
		expect(fmtMoney(1000)).toMatch(/1,000/);
	});
	it('falls back to the raw value for non-numeric input', () => {
		expect(fmtMoney('n/a')).toBe('n/a');
	});
});

describe('date params', () => {
	it('todayParam is YYYY-MM-DD', () => {
		expect(todayParam(new Date(2026, 6, 6))).toBe('2026-07-06');
	});
	it('monthStartParam is the first of the month', () => {
		expect(monthStartParam(new Date(2026, 6, 20))).toBe('2026-07-01');
	});
});

describe('daysUntil', () => {
	it('is positive for a future date', () => {
		const future = new Date(Date.now() + 3 * 86_400_000).toISOString();
		expect(daysUntil(future)).toBeGreaterThan(0);
	});
	it('is negative for a past date', () => {
		const past = new Date(Date.now() - 3 * 86_400_000).toISOString();
		expect(daysUntil(past)).toBeLessThan(0);
	});
});
