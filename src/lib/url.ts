/**
 * Helpers to keep list state (search, filters, page) in the URL query string,
 * so views are shareable, bookmarkable, and survive a refresh. Read with
 * `urlParam` inside a `$derived`; write with `setParams`.
 */

import { page } from '$app/state';
import { goto } from '$app/navigation';

/** Current value of a query param (reactive when read in a rune context). */
export function urlParam(key: string, fallback = ''): string {
	return page.url.searchParams.get(key) ?? fallback;
}

/**
 * Merge changes into the URL query string. Empty/null values remove the param.
 * Uses replaceState so filtering doesn't spam browser history, and keeps focus
 * so typing in a search box isn't interrupted.
 */
export function setParams(changes: Record<string, string | number | null>): void {
	const url = new URL(page.url);
	for (const [key, value] of Object.entries(changes)) {
		if (value === null || value === '') url.searchParams.delete(key);
		else url.searchParams.set(key, String(value));
	}
	goto(url, { replaceState: true, keepFocus: true, noScroll: true });
}
