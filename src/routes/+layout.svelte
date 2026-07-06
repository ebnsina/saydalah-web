<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { createQueryClient } from '$lib/query/client';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();

	// One client per app instance (per request on SSR) — never a module singleton.
	const queryClient = createQueryClient();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="min-h-screen bg-bg font-sans text-fg">
		<Header />
		<main>
			{@render children()}
		</main>
	</div>
</QueryClientProvider>
