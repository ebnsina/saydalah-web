<script lang="ts">
	import { Pill, LogOut } from '@lucide/svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useQueryClient, createQuery } from '@tanstack/svelte-query';
	import { me, logout, isAuthenticated } from '$lib/api/auth';
	import { NAV, canSee } from '$lib/nav';
	import ThemeToggle from './ThemeToggle.svelte';

	let { onNavigate }: { onNavigate?: () => void } = $props();

	const queryClient = useQueryClient();
	const user = createQuery(() => ({
		queryKey: ['me'],
		queryFn: me,
		enabled: isAuthenticated(),
		retry: false
	}));
	const role = $derived(user.data?.role);

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	async function handleLogout() {
		await logout();
		queryClient.clear();
		await goto('/login');
	}
</script>

<aside class="flex h-full w-64 flex-col bg-bg">
	<a href="/" onclick={onNavigate} class="flex items-center gap-2 px-5 py-4 font-semibold tracking-tight">
		<span class="grid h-8 w-8 place-items-center rounded-xl bg-accent/15 text-accent">
			<Pill size={18} />
		</span>
		<span class="text-lg text-fg">Saydalah</span>
	</a>

	<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-2">
		{#each NAV as item (item.href)}
			{#if canSee(item, role)}
				{@const Icon = item.icon}
				<a
					href={item.href}
					onclick={onNavigate}
					class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition {isActive(
						item.href
					)
						? 'bg-accent/10 text-accent'
						: 'text-muted hover:bg-surface-2 hover:text-fg'}"
				>
					<Icon size={18} />
					{item.label}
				</a>
			{/if}
		{/each}
	</nav>

	<div class="border-t border-surface-2 p-3">
		<div class="flex items-center gap-2">
			{#if user.data}
				<div class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-medium text-fg-soft">
					{(user.data.full_name || user.data.email).charAt(0).toUpperCase()}
				</div>
				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-medium text-fg">{user.data.full_name || user.data.email}</div>
					<div class="truncate text-xs text-muted capitalize">{user.data.role}</div>
				</div>
			{:else}
				<div class="flex-1"></div>
			{/if}
			<button
				type="button"
				onclick={handleLogout}
				title="Sign out"
				class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
			>
				<LogOut size={16} />
			</button>
		</div>
		<div class="mt-3 flex items-center justify-between">
			<span class="text-xs text-muted">Theme</span>
			<ThemeToggle />
		</div>
	</div>
</aside>
