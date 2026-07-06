/**
 * Display formatters built on the standard `Intl` APIs (no hand-rolled logic).
 * Formatter instances are created once and reused. Currency is configurable via
 * VITE_CURRENCY (default USD); amounts arrive from the API as decimal strings.
 */

const CURRENCY = (import.meta.env.VITE_CURRENCY as string | undefined) ?? 'BDT';

const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const longDateFmt = new Intl.DateTimeFormat(undefined, {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});
// en-CA renders ISO-style YYYY-MM-DD, which the API expects for range params.
const isoDateFmt = new Intl.DateTimeFormat('en-CA');
// narrowSymbol renders the Taka sign (৳) rather than the "BDT" code.
const moneyFmt = new Intl.NumberFormat(undefined, {
	style: 'currency',
	currency: CURRENCY,
	currencyDisplay: 'narrowSymbol'
});

export function fmtDate(iso: string): string {
	return dateFmt.format(new Date(iso));
}

export function fmtLongDate(d: Date = new Date()): string {
	return longDateFmt.format(d);
}

/** Today's local date as YYYY-MM-DD, for report range params. */
export function todayParam(d: Date = new Date()): string {
	return isoDateFmt.format(d);
}

/** First day of the current month as YYYY-MM-DD. */
export function monthStartParam(d: Date = new Date()): string {
	return isoDateFmt.format(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Format a decimal-string amount as localized currency. */
export function fmtMoney(v: string | number): string {
	const n = typeof v === 'string' ? Number(v) : v;
	return Number.isNaN(n) ? String(v) : moneyFmt.format(n);
}

/** Whole days from now until the given ISO date (negative if past). */
export function daysUntil(iso: string): number {
	const ms = new Date(iso).getTime() - Date.now();
	return Math.ceil(ms / 86_400_000);
}
