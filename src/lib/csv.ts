/** Minimal client-side CSV export (no dependencies). */

function escapeCell(value: unknown): string {
	const s = value == null ? '' : String(value);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV string from a header row and object rows. */
export function toCSV(headers: string[], rows: (string | number)[][]): string {
	const lines = [headers.map(escapeCell).join(',')];
	for (const row of rows) lines.push(row.map(escapeCell).join(','));
	return lines.join('\n');
}

/** Trigger a browser download of the given CSV text. */
export function downloadCSV(filename: string, csv: string): void {
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
