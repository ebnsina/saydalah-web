<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { fade, fly } from 'svelte/transition';
	import { MoreHorizontal, LogOut } from '@lucide/svelte';
	import { me, logout } from '$lib/api/auth';
	import { NAV, canSee } from '$lib/nav';

	const user = createQuery(() => ({ queryKey: ['me'], queryFn: me }));
	const role = $derived(user.data?.role);

	// Four thumb-friendly primaries in the bar; everything else lives in "More".
	const PRIMARY = ['/', '/sales', '/inventory', '/customers'];
	const primary = $derived(NAV.filter((n) => PRIMARY.includes(n.href) && canSee(n, role)));
	const more = $derived(NAV.filter((n) => !PRIMARY.includes(n.href) && canSee(n, role)));

	let moreOpen = $state(false);
	$effect(() => {
		void page.url.pathname;
		moreOpen = false;
	});

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
	const moreActive = $derived(more.some((n) => isActive(n.href)));

	async function signOut() {
		await logout();
		goto('/login');
	}
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-40 border-t border-surface-2 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
>
	<div class="grid grid-cols-5">
		{#each primary as item (item.href)}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition {isActive(item.href) ? 'text-accent' : 'text-muted'}"
			>
				<Icon size={21} />
				<span class="truncate">{item.label}</span>
			</a>
		{/each}
		<button
			type="button"
			onclick={() => (moreOpen = true)}
			class="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition {moreActive ? 'text-accent' : 'text-muted'}"
		>
			<MoreHorizontal size={21} />
			<span>More</span>
		</button>
	</div>
</nav>

{#if moreOpen}
	<div class="fixed inset-0 z-50 flex items-end lg:hidden">
		<button
			type="button"
			aria-label="Close menu"
			class="fixed inset-0 bg-black/40 backdrop-blur-sm"
			transition:fade={{ duration: 150 }}
			onclick={() => (moreOpen = false)}
		></button>
		<div
			class="relative z-10 w-full rounded-t-3xl border border-surface-2 bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
			transition:fly={{ y: 120, duration: 240, opacity: 0 }}
		>
			<div class="mx-auto mb-4 h-1.5 w-10 rounded-full bg-surface-3"></div>
			<div class="grid grid-cols-3 gap-2">
				{#each more as item (item.href)}
					{@const Icon = item.icon}
					<a
						href={item.href}
						class="flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition {isActive(item.href) ? 'border-accent/40 bg-accent/10 text-accent' : 'border-surface-2 text-fg-soft hover:bg-surface-2'}"
					>
						<Icon size={20} />
						<span class="text-center leading-tight">{item.label}</span>
					</a>
				{/each}
				<button
					type="button"
					onclick={signOut}
					class="flex flex-col items-center gap-1.5 rounded-2xl border border-surface-2 p-3 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
				>
					<LogOut size={20} />
					<span>Sign out</span>
				</button>
			</div>
		</div>
	</div>
{/if}
