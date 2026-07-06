/**
 * QueryClient factory with project-wide defaults.
 *
 * A fresh client is created per request/app instance (never shared as a
 * module singleton) so SSR requests don't leak cache between users.
 */

import { QueryClient } from '@tanstack/svelte-query';

export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				gcTime: 5 * 60_000,
				retry: 1,
				refetchOnWindowFocus: false
			}
		}
	});
}
