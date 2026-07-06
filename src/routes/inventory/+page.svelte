<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { fade } from 'svelte/transition';
	import { Boxes, TriangleAlert, Clock } from '@lucide/svelte';
	import { listBatches, nearExpiry, lowStock } from '$lib/api/inventory';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtDate, daysUntil, fmtMoney } from '$lib/format';
	import { productIcon } from '$lib/productIcon';
	import { urlParam, setParams } from '$lib/url';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';

	let page = $state(1);
	const tab = $derived(urlParam('tab', 'batches'));
	const branchReady = $derived(Boolean(branch.id));

	const low = createQuery(() => ({
		queryKey: ['low-stock', branch.id],
		queryFn: () => lowStock(branch.id),
		enabled: branchReady
	}));
	const expiring = createQuery(() => ({
		queryKey: ['near-expiry', branch.id],
		queryFn: () => nearExpiry(branch.id, 60),
		enabled: branchReady
	}));
	const batches = createQuery(() => ({
		queryKey: ['batches', branch.id, page],
		queryFn: () => listBatches(branch.id, page),
		enabled: branchReady
	}));

	const tabs = $derived([
		{ id: 'batches', label: 'In-stock batches', icon: Boxes, count: batches.data?.total },
		{
			id: 'low',
			label: 'Low stock',
			icon: TriangleAlert,
			count: low.data?.items.length,
			tone: (low.data?.items.length ? 'danger' : 'success') as 'danger' | 'success'
		},
		{
			id: 'expiring',
			label: 'Expiring ≤ 60d',
			icon: Clock,
			count: expiring.data?.items.length,
			tone: (expiring.data?.items.length ? 'warn' : 'success') as 'warn' | 'success'
		}
	]);

	function expiryTone(iso: string): string {
		const d = daysUntil(iso);
		if (d <= 30) return 'text-red-500';
		if (d <= 60) return 'text-amber-500';
		return 'text-fg-soft';
	}

	const th = 'px-4 py-2.5 font-medium';
	const td = 'px-4 py-2.5';
</script>

<svelte:head><title>Inventory — Saydalah</title></svelte:head>

<PageHeader title="Inventory" subtitle="Stock, expiry, and reorder alerts for the selected branch.">
	{#snippet actions()}<BranchSelect />{/snippet}
</PageHeader>

<!-- Tabs -->
<div class="mt-4">
	<Tabs {tabs} active={tab} onSelect={(id) => setParams({ tab: id })} />
</div>

<div class="mt-5">
	{#key tab}
	<div in:fade={{ duration: 140 }}>
	{#if !branchReady}
		<Spinner label="Selecting branch…" />
	{:else if tab === 'low'}
		<!-- Low stock -->
		{#if low.isPending}
			<TableSkeleton cols={2} />
		{:else if low.isError}
			<ErrorState message={low.error.message} onRetry={() => low.refetch()} />
		{:else if low.data.items.length === 0}
			<EmptyState title="All good" description="No products below their reorder level." />
		{:else}
			<div class="overflow-x-auto rounded-2xl border border-surface-2">
				<table class="w-full text-sm">
					<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
						<tr><th class={th}>Product</th><th class="{th} text-right">On hand</th><th class="{th} text-right">Reorder level</th><th class="{th} text-right">Short by</th></tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each low.data.items as item (item.product_id)}
							{@const fi = productIcon(item.product_form)}
							{@const Icon = fi.icon}
							<tr class="hover:bg-surface-2/30">
								<td class={td}><a href="/products/{item.product_id}" class="flex items-center gap-2.5 text-fg hover:text-accent hover:underline"><Icon size={16} class={fi.tint} />{item.product_name}</a></td>
								<td class="{td} text-right font-medium text-red-500 tabular-nums">{item.on_hand}</td>
								<td class="{td} text-right text-fg-soft tabular-nums">{item.reorder_level}</td>
								<td class="{td} text-right text-amber-500 tabular-nums">{Math.max(item.reorder_level - item.on_hand, 0)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else if tab === 'expiring'}
		<!-- Near expiry -->
		{#if expiring.isPending}
			<TableSkeleton cols={3} />
		{:else if expiring.isError}
			<ErrorState message={expiring.error.message} onRetry={() => expiring.refetch()} />
		{:else if expiring.data.items.length === 0}
			<EmptyState title="Nothing expiring soon" description="No batches expire within 60 days." />
		{:else}
			<div class="overflow-x-auto rounded-2xl border border-surface-2">
				<table class="w-full text-sm">
					<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
						<tr><th class={th}>Product</th><th class={th}>Batch</th><th class="{th} text-right">Qty</th><th class="{th} text-right">Expiry</th></tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each expiring.data.items as b (b.id)}
							{@const fi = productIcon(b.product_form)}
							{@const Icon = fi.icon}
							<tr class="hover:bg-surface-2/30">
								<td class={td}><a href="/products/{b.product_id}" class="flex items-center gap-2.5 text-fg hover:text-accent hover:underline"><Icon size={16} class={fi.tint} />{b.product_name}</a></td>
								<td class="{td} font-mono text-xs text-muted">{b.batch_no || '—'}</td>
								<td class="{td} text-right text-fg-soft tabular-nums">{b.quantity}</td>
								<td class="{td} text-right font-medium {expiryTone(b.expiry_date)}">{fmtDate(b.expiry_date)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else}
		<!-- In-stock batches -->
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
						<tr><th class={th}>Product</th><th class={th}>Batch</th><th class="{th} text-right">Qty</th><th class="{th} text-right">Price</th><th class={th}>Expiry</th></tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each batches.data.items as b (b.id)}
							{@const fi = productIcon(b.product_form)}
							{@const Icon = fi.icon}
							<tr class="hover:bg-surface-2/30">
								<td class={td}>
									<a href="/products/{b.product_id}" class="flex items-center gap-2.5 text-fg hover:text-accent hover:underline">
										<span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 {fi.tint}"><Icon size={15} /></span>
										{b.product_name}
									</a>
								</td>
								<td class="{td} font-mono text-xs text-muted">{b.batch_no || '—'}</td>
								<td class="{td} text-right text-fg-soft tabular-nums">{b.quantity}</td>
								<td class="{td} text-right font-mono text-fg-soft">{fmtMoney(b.sale_price)}</td>
								<td class="{td} {expiryTone(b.expiry_date)}">{fmtDate(b.expiry_date)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="mt-3 flex items-center justify-between text-sm text-muted">
				<span>{batches.data.total} batches</span>
				<div class="flex items-center gap-2">
					<button onclick={() => (page = Math.max(1, page - 1))} disabled={page <= 1} class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40">Prev</button>
					<span>Page {batches.data.page}</span>
					<button onclick={() => (page = page + 1)} disabled={batches.data.page * batches.data.page_size >= batches.data.total} class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40">Next</button>
				</div>
			</div>
		{/if}
	{/if}
	</div>
	{/key}
</div>
