<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { createQueryClient } from '$lib/query/client';
	import { isAuthenticated } from '$lib/api/auth';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();

	// One client per app instance (per request on SSR) — never a module singleton.
	const queryClient = createQueryClient();

	// Client-side guard: unauthenticated visitors are sent to /login. The token
	// lives in localStorage, so this necessarily runs on the client.
	$effect(() => {
		if (!isAuthenticated() && page.url.pathname !== '/login') {
			goto('/login');
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="flex min-h-screen flex-col bg-bg font-sans text-fg">
		<Header />
		<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
			{@render children()}
		</main>
	</div>
</QueryClientProvider>
