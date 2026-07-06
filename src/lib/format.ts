/** Small display formatters. */

export function fmtDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

/** Whole days from now until the given ISO date (negative if past). */
export function daysUntil(iso: string): number {
	const ms = new Date(iso).getTime() - Date.now();
	return Math.ceil(ms / 86_400_000);
}
