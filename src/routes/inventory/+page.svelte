<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { TriangleAlert, Clock } from '@lucide/svelte';
	import { listBatches, nearExpiry, lowStock } from '$lib/api/inventory';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtDate, daysUntil, fmtMoney } from '$lib/format';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';

	let page = $state(1);

	// All queries key on the selected branch so they refetch when it changes.
	const low = createQuery(() => ({
		queryKey: ['low-stock', branch.id],
		queryFn: () => lowStock(branch.id),
		enabled: Boolean(branch.id)
	}));
	const expiring = createQuery(() => ({
		queryKey: ['near-expiry', branch.id],
		queryFn: () => nearExpiry(branch.id, 60),
		enabled: Boolean(branch.id)
	}));
	const batches = createQuery(() => ({
		queryKey: ['batches', branch.id, page],
		queryFn: () => listBatches(branch.id, page),
		enabled: Boolean(branch.id)
	}));

	function expiryTone(iso: string): string {
		const d = daysUntil(iso);
		if (d <= 30) return 'text-red-500';
		if (d <= 60) return 'text-amber-500';
		return 'text-fg-soft';
	}
</script>

<svelte:head><title>Inventory — Saydalah</title></svelte:head>

<PageHeader title="Inventory" subtitle="Stock, expiry, and reorder alerts for the selected branch.">
	{#snippet actions()}<BranchSelect />{/snippet}
</PageHeader>

{#if !branch.id}
	<div class="mt-6"><Spinner label="Selecting branch…" /></div>
{:else}
	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Low stock -->
		<Card>
			<div class="mb-3 flex items-center gap-2">
				<TriangleAlert size={18} class="text-amber-500" />
				<h2 class="font-semibold text-fg">Low stock</h2>
			</div>
			{#if low.isPending}
				<div class="space-y-3 py-1">
					{#each Array(5) as _, i (i)}<Skeleton class="h-4 w-full" />{/each}
				</div>
			{:else if low.isError}
				<ErrorState message={low.error.message} onRetry={() => low.refetch()} />
			{:else if low.data.items.length === 0}
				<EmptyState title="All good" description="No products below their reorder level." />
			{:else}
				<ul class="divide-y divide-surface-2 text-sm">
					{#each low.data.items as item (item.product_id)}
						<li class="flex items-center justify-between py-2">
							<span class="text-fg">{item.product_name}</span>
							<span class="text-muted">
								<span class="font-medium text-red-500">{item.on_hand}</span>
								/ {item.reorder_level}
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>

		<!-- Near expiry -->
		<Card>
			<div class="mb-3 flex items-center gap-2">
				<Clock size={18} class="text-amber-500" />
				<h2 class="font-semibold text-fg">Expiring within 60 days</h2>
			</div>
			{#if expiring.isPending}
				<div class="space-y-3 py-1">
					{#each Array(5) as _, i (i)}<Skeleton class="h-4 w-full" />{/each}
				</div>
			{:else if expiring.isError}
				<ErrorState message={expiring.error.message} onRetry={() => expiring.refetch()} />
			{:else if expiring.data.items.length === 0}
				<EmptyState title="Nothing expiring soon" />
			{:else}
				<ul class="divide-y divide-surface-2 text-sm">
					{#each expiring.data.items.slice(0, 12) as b (b.id)}
						<li class="flex items-center justify-between py-2">
							<span class="text-fg">{b.product_name} <span class="text-muted">· {b.batch_no}</span></span>
							<span class={expiryTone(b.expiry_date)}>{fmtDate(b.expiry_date)}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</div>

	<!-- Batches -->
	<section class="mt-6">
		<h2 class="mb-3 font-semibold text-fg">In-stock batches</h2>
		{#if batches.isPending}
			<TableSkeleton cols={5} />
		{:else if batches.isError}
			<ErrorState message={batches.error.message} onRetry={() => batches.refetch()} />
		{:else if batches.data.items.length === 0}
			<EmptyState title="No stock" description="Receive a purchase order to add stock." />
		{:else}
			<div class="overflow-x-auto rounded-2xl border border-surface-2">
				<table class="w-full text-sm">
					<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
						<tr>
							<th class="px-4 py-2.5 font-medium">Product</th>
							<th class="px-4 py-2.5 font-medium">Batch</th>
							<th class="px-4 py-2.5 text-right font-medium">Qty</th>
							<th class="px-4 py-2.5 text-right font-medium">Price</th>
							<th class="px-4 py-2.5 font-medium">Expiry</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each batches.data.items as b (b.id)}
							<tr class="hover:bg-surface-2/30">
								<td class="px-4 py-2.5 text-fg">{b.product_name}</td>
								<td class="px-4 py-2.5 font-mono text-xs text-muted">{b.batch_no || '—'}</td>
								<td class="px-4 py-2.5 text-right text-fg-soft">{b.quantity}</td>
								<td class="px-4 py-2.5 text-right font-mono text-fg-soft">{fmtMoney(b.sale_price)}</td>
								<td class="px-4 py-2.5 {expiryTone(b.expiry_date)}">{fmtDate(b.expiry_date)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="mt-3 flex items-center justify-between text-sm text-muted">
				<span>{batches.data.total} batches</span>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (page = Math.max(1, page - 1))}
						disabled={page <= 1}
						class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40"
					>Prev</button>
					<span>Page {batches.data.page}</span>
					<button
						onclick={() => (page = page + 1)}
						disabled={batches.data.page * batches.data.page_size >= batches.data.total}
						class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40"
					>Next</button>
				</div>
			</div>
		{/if}
	</section>
{/if}
