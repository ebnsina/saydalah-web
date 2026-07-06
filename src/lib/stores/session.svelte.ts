/**
 * Reactive auth state. The token values themselves live in `$lib/api/token`
 * (plain, dependency-free), but whether a session exists must be *reactive* so
 * the app chrome (sidebar, guards) updates the instant a login or logout
 * happens — without waiting for a navigation or reload.
 */
import { browser } from '$app/environment';

export const session = $state<{ authed: boolean }>({
	authed: browser ? Boolean(localStorage.getItem('saydalah_access')) : false
});
