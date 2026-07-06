<script lang="ts">
	import { Pill, LogOut } from '@lucide/svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useQueryClient, createQuery } from '@tanstack/svelte-query';
	import { me, logout, isAuthenticated } from '$lib/api/auth';
	import { NAV, canSee } from '$lib/nav';
	import ThemeToggle from './ThemeToggle.svelte';

	const queryClient = useQueryClient();

	// Shared with the dashboard via the ['me'] key — fetched once, cached.
	const user = createQuery(() => ({
		queryKey: ['me'],
		queryFn: me,
		enabled: isAuthenticated(),
		retry: false
	}));

	const role = $derived(user.data?.role);

	async function handleLogout() {
		await logout();
		queryClient.clear();
		await goto('/login');
	}

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<header
	class="sticky top-0 z-20 border-b border-surface-2/70 bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60"
>
	<div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
		<a href="/" class="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
			<span class="grid h-8 w-8 place-items-center rounded-xl bg-accent/15 text-accent">
				<Pill size={18} />
			</span>
			<span class="text-lg text-fg">Saydalah</span>
		</a>

		{#if isAuthenticated()}
			<nav class="hidden items-center gap-1 text-sm sm:flex">
				{#each NAV as item (item.href)}
					{#if canSee(item, role)}
						<a
							href={item.href}
							class="rounded-lg px-3 py-1.5 transition {isActive(item.href)
								? 'bg-surface-2 text-fg'
								: 'text-muted hover:text-fg'}"
						>
							{item.label}
						</a>
					{/if}
				{/each}
			</nav>
		{/if}

		<div class="flex items-center gap-3">
			<ThemeToggle />
			{#if isAuthenticated() && user.data}
				<div class="hidden text-right text-xs leading-tight sm:block">
					<div class="font-medium text-fg-soft">{user.data.full_name || user.data.email}</div>
					<div class="text-muted capitalize">{user.data.role}</div>
				</div>
				<button
					type="button"
					onclick={handleLogout}
					title="Sign out"
					class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
				>
					<LogOut size={16} />
				</button>
			{/if}
		</div>
	</div>
</header>
