<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { Search, Pill } from '@lucide/svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { createQueryClient } from '$lib/query/client';
	import { isAuthenticated } from '$lib/api/auth';
	import { palette } from '$lib/stores/palette.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SidebarBranch from '$lib/components/SidebarBranch.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';

	let { children } = $props();

	const queryClient = createQueryClient();

	// Client-side guard: unauthenticated visitors are sent to /login.
	$effect(() => {
		if (!isAuthenticated() && page.url.pathname !== '/login') {
			goto('/login');
		}
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
		<CommandPalette />
		<div class="flex min-h-screen bg-bg text-fg">
			<!-- Desktop sidebar -->
			<div class="sticky top-0 hidden h-screen shrink-0 lg:block">
				<Sidebar />
			</div>

			<div class="flex min-w-0 flex-1 flex-col">
				<!-- Mobile top bar: logo · branch · search -->
				<div class="flex items-center gap-2 border-b border-surface-2 bg-bg px-3 py-2.5 lg:hidden">
					<a href="/" class="flex shrink-0 items-center gap-2 font-semibold">
						<span class="grid h-8 w-8 place-items-center rounded-xl bg-accent/15 text-accent"><Pill size={18} /></span>
					</a>
					<div class="ml-auto min-w-0 max-w-[190px] flex-1"><SidebarBranch /></div>
					<button
						type="button"
						onclick={() => (palette.open = true)}
						aria-label="Search"
						class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-surface-2 text-muted transition hover:text-fg"
					>
						<Search size={17} />
					</button>
				</div>

				<!-- White rounded content sheet inset on the gray canvas. Extra bottom
				     padding on mobile so the fixed bottom nav never covers content. -->
				<div class="flex-1 p-1 pb-20 lg:pb-1">
					<main class="min-h-full w-full rounded-2xl border border-surface-2 bg-surface p-4 sm:p-5 lg:p-8">
						{@render children()}
					</main>
				</div>
			</div>

			<!-- Mobile bottom navigation -->
			<BottomNav />
		</div>
	{:else}
		<div class="min-h-screen bg-bg font-sans text-fg">
			{@render children()}
		</div>
	{/if}
</QueryClientProvider>
