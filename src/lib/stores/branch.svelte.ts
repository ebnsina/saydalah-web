/**
 * Selected-branch state, shared across branch-scoped pages (inventory, sales,
 * reports). Admins may switch branches; branch-scoped staff are implicitly
 * pinned to their own branch (the API enforces this regardless).
 */

import { browser } from '$app/environment';

const KEY = 'saydalah_branch';

export const branch = $state<{ id: string | null }>({
	id: browser ? localStorage.getItem(KEY) : null
});

export function setBranch(id: string | null): void {
	branch.id = id;
	if (!browser) return;
	try {
		if (id) localStorage.setItem(KEY, id);
		else localStorage.removeItem(KEY);
	} catch {
		/* storage unavailable — ignore */
	}
}
