/**
 * Theme preference. 'system' follows the OS via prefers-color-scheme (no
 * data-theme attribute); 'light'/'dark' pin it and persist to localStorage,
 * which the inline script in app.html applies before first paint.
 */

import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

export function getTheme(): Theme {
	if (!browser) return 'system';
	const v = localStorage.getItem('theme');
	return v === 'light' || v === 'dark' ? v : 'system';
}

export function setTheme(t: Theme): void {
	if (!browser) return;
	if (t === 'system') {
		delete document.documentElement.dataset.theme;
		localStorage.removeItem('theme');
	} else {
		document.documentElement.dataset.theme = t;
		localStorage.setItem('theme', t);
	}
}
