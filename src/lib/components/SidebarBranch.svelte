<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Building2, ChevronsUpDown, Check } from '@lucide/svelte';
	import { me } from '$lib/api/auth';
	import { listBranches } from '$lib/api/branches';
	import { branch, setBranch } from '$lib/stores/branch.svelte';

	const user = createQuery(() => ({ queryKey: ['me'], queryFn: me }));
	const isAdmin = $derived(user.data?.role === 'admin');
	const branches = createQuery(() => ({ queryKey: ['branches'], queryFn: listBranches }));

	// Pick a sensible default branch once the user/branches are known. This lives
	// in the always-mounted sidebar so every page's branch-scoped queries have a
	// branch as soon as the app loads.
	$effect(() => {
		if (branch.id || !user.data) return;
		if (!isAdmin && user.data.branch_id) setBranch(user.data.branch_id);
		else if (branches.data?.items.length) setBranch(branches.data.items[0].id);
	});

	const current = $derived(branches.data?.items.find((b) => b.id === branch.id));

	let open = $state(false);
	let root = $state<HTMLDivElement>();
	$effect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (root && !root.contains(e.target as Node)) open = false;
		}
		document.addEventListener('click', onClick, true);
		return () => document.removeEventListener('click', onClick, true);
	});

	const box =
		'flex w-full items-center gap-2 rounded-xl border border-surface-2 bg-surface px-3 py-2 text-sm text-fg';
</script>

{#if branches.data}
	{#if isAdmin}
		<div class="relative" bind:this={root}>
			<button type="button" onclick={() => (open = !open)} class="{box} transition hover:border-surface-3">
				<span class="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><Building2 size={14} /></span>
				<span class="min-w-0 flex-1 truncate text-left font-medium">{current?.name ?? 'Select branch'}</span>
				<ChevronsUpDown size={15} class="shrink-0 text-muted" />
			</button>
			{#if open}
				<div class="absolute right-0 left-0 z-30 mt-1 rounded-xl border border-surface-2 bg-surface p-1 shadow-lg">
					{#each branches.data.items as b (b.id)}
						<button
							type="button"
							onclick={() => {
								setBranch(b.id);
								open = false;
							}}
							class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-surface-2/60"
						>
							<Building2 size={14} class="shrink-0 text-muted" />
							<span class="min-w-0 flex-1 truncate text-fg">{b.name}</span>
							{#if b.id === branch.id}<Check size={14} class="shrink-0 text-accent" />{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class={box}>
			<span class="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><Building2 size={14} /></span>
			<span class="min-w-0 flex-1 truncate font-medium">{current?.name ?? '—'}</span>
		</div>
	{/if}
{/if}
