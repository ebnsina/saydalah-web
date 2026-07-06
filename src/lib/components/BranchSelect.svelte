<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Building2 } from '@lucide/svelte';
	import { me } from '$lib/api/auth';
	import { listBranches } from '$lib/api/branches';
	import { branch, setBranch } from '$lib/stores/branch.svelte';

	const user = createQuery(() => ({ queryKey: ['me'], queryFn: me }));
	const isAdmin = $derived(user.data?.role === 'admin');

	const branches = createQuery(() => ({
		queryKey: ['branches'],
		queryFn: listBranches,
		enabled: isAdmin
	}));

	// Pick a sensible default branch once the user/branches are known.
	$effect(() => {
		if (branch.id || !user.data) return;
		if (!isAdmin && user.data.branch_id) setBranch(user.data.branch_id);
		else if (branches.data?.items.length) setBranch(branches.data.items[0].id);
	});
</script>

{#if isAdmin && branches.data}
	<label
		class="flex items-center gap-2 rounded-full border border-surface-2 bg-surface py-1.5 pr-3 pl-4 text-sm focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15"
	>
		<Building2 size={16} class="text-muted" />
		<select
			value={branch.id ?? ''}
			onchange={(e) => setBranch(e.currentTarget.value || null)}
			class="bg-transparent text-fg focus:outline-none"
		>
			{#each branches.data.items as b (b.id)}
				<option value={b.id}>{b.name}</option>
			{/each}
		</select>
	</label>
{/if}
