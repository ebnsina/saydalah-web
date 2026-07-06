<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { fade, fly } from 'svelte/transition';
	import { Menu, Pill } from '@lucide/svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { createQueryClient } from '$lib/query/client';
	import { isAuthenticated } from '$lib/api/auth';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();

	const queryClient = createQueryClient();
	let mobileOpen = $state(false);

	// Client-side guard: unauthenticated visitors are sent to /login.
	$effect(() => {
		if (!isAuthenticated() && page.url.pathname !== '/login') {
			goto('/login');
		}
	});

	// Close the mobile drawer on navigation.
	$effect(() => {
		void page.url.pathname;
		mobileOpen = false;
	});

	// Bare pages (no sidebar/topbar): login, and printable docs.
	const bare = $derived(
		page.url.pathname === '/login' ||
			page.url.pathname.startsWith('/invoice/') ||
			page.url.pathname.startsWith('/prescription-print/') ||
			page.url.pathname.startsWith('/day-end/') ||
			page.url.pathname.startsWith('/receipt/')
	);
	const showChrome = $derived(isAuthenticated() && !bare);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
	{#if showChrome}
		<div class="flex min-h-screen bg-bg text-fg">
			<!-- Desktop sidebar -->
			<div class="sticky top-0 hidden h-screen shrink-0 lg:block">
				<Sidebar />
			</div>

			<!-- Mobile drawer -->
			{#if mobileOpen}
				<button
					type="button"
					aria-label="Close menu"
					class="fixed inset-0 z-40 bg-black/40 lg:hidden"
					transition:fade={{ duration: 150 }}
					onclick={() => (mobileOpen = false)}
				></button>
				<div class="fixed inset-y-0 left-0 z-50 lg:hidden" transition:fly={{ x: -280, duration: 200 }}>
					<Sidebar onNavigate={() => (mobileOpen = false)} />
				</div>
			{/if}

			<div class="flex min-w-0 flex-1 flex-col">
				<!-- Mobile top bar -->
				<div class="flex items-center justify-between border-b border-surface-2 bg-bg px-4 py-3 lg:hidden">
					<a href="/" class="flex items-center gap-2 font-semibold">
						<span class="grid h-8 w-8 place-items-center rounded-xl bg-accent/15 text-accent"><Pill size={18} /></span>
						<span class="text-lg text-fg">Saydalah</span>
					</a>
					<button
						type="button"
						onclick={() => (mobileOpen = true)}
						class="grid h-9 w-9 place-items-center rounded-full border border-surface-2 text-muted hover:text-fg"
					>
						<Menu size={18} />
					</button>
				</div>

				<!-- White rounded content sheet inset on the gray canvas. -->
				<div class="flex-1 p-1">
					<main class="min-h-full w-full rounded-2xl border border-surface-2 bg-surface p-5 lg:p-8">
						{@render children()}
					</main>
				</div>
			</div>
		</div>
	{:else}
		<div class="min-h-screen bg-bg font-sans text-fg">
			{@render children()}
		</div>
	{/if}
</QueryClientProvider>
