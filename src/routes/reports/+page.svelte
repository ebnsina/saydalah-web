<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { ShoppingCart, Banknote, Tag, Boxes } from '@lucide/svelte';
	import { salesSummary, topProducts, inventoryValuation } from '$lib/api/reports';
	import { branch } from '$lib/stores/branch.svelte';
	import { monthStartParam, todayParam, fmtMoney } from '$lib/format';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';

	let from = $state(monthStartParam());
	let to = $state(todayParam());
	const branchReady = $derived(Boolean(branch.id));

	const summary = createQuery(() => ({
		queryKey: ['rep-summary', branch.id, from, to],
		queryFn: () => salesSummary(branch.id, from, to),
		enabled: Boolean(branch.id)
	}));
	const top = createQuery(() => ({
		queryKey: ['rep-top', branch.id, from, to],
		queryFn: () => topProducts(branch.id, { from, to, limit: 10 }),
		enabled: Boolean(branch.id)
	}));
	const val = createQuery(() => ({
		queryKey: ['rep-val', branch.id],
		queryFn: () => inventoryValuation(branch.id),
		enabled: Boolean(branch.id)
	}));

	const dateInput =
		'rounded-full border border-surface-2 bg-surface px-4 py-1.5 text-sm text-fg focus:border-accent focus:outline-none';
</script>

<svelte:head><title>Reports — Saydalah</title></svelte:head>

<PageHeader title="Reports" subtitle="Sales performance and inventory valuation.">
	{#snippet actions()}<BranchSelect />{/snippet}
</PageHeader>

<div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
	<span>From</span>
	<input type="date" bind:value={from} max={to} class={dateInput} />
	<span>to</span>
	<input type="date" bind:value={to} min={from} max={todayParam()} class={dateInput} />
</div>

{#if !branchReady}
	<div class="mt-6"><Spinner label="Selecting branch…" /></div>
{:else if summary.isError}
	<div class="mt-6"><ErrorState message={summary.error.message} onRetry={() => summary.refetch()} /></div>
{:else}
	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<StatCard label="Sales" value={summary.data?.sale_count ?? 0} loading={summary.isPending}>
			{#snippet icon()}<ShoppingCart size={16} />{/snippet}
		</StatCard>
		<StatCard
			label="Revenue"
			value={Number(summary.data?.revenue ?? 0)}
			format={fmtMoney}
			loading={summary.isPending}
			tone="accent"
		>
			{#snippet icon()}<Banknote size={16} />{/snippet}
		</StatCard>
		<StatCard
			label="Discounts"
			value={Number(summary.data?.discount_total ?? 0)}
			format={fmtMoney}
			loading={summary.isPending}
		>
			{#snippet icon()}<Tag size={16} />{/snippet}
		</StatCard>
		<StatCard
			label="Inventory retail value"
			value={Number(val.data?.retail_value ?? 0)}
			format={fmtMoney}
			loading={val.isPending}
		>
			{#snippet icon()}<Boxes size={16} />{/snippet}
		</StatCard>
	</div>

	<div class="mt-6">
		<Card>
			<h2 class="mb-3 font-semibold text-fg">Top products</h2>
			{#if top.isPending}
				<TableSkeleton cols={4} />
			{:else if top.data && top.data.items.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="text-left text-xs tracking-wide text-muted uppercase">
							<tr>
								<th class="py-2 pr-4 font-medium">#</th>
								<th class="py-2 pr-4 font-medium">Product</th>
								<th class="py-2 pr-4 text-right font-medium">Units sold</th>
								<th class="py-2 text-right font-medium">Revenue</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-surface-2">
							{#each top.data.items as p, i (p.product_id)}
								<tr>
									<td class="py-2 pr-4 text-muted">{i + 1}</td>
									<td class="py-2 pr-4 text-fg">{p.product_name}</td>
									<td class="py-2 pr-4 text-right font-mono tabular-nums text-fg-soft">{p.units_sold}</td>
									<td class="py-2 text-right font-mono tabular-nums text-fg-soft">{fmtMoney(p.revenue)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<EmptyState title="No sales in this range" />
			{/if}
		</Card>
	</div>
{/if}
