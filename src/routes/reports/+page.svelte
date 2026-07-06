<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { ShoppingCart, Banknote, Tag, Boxes, Download, CreditCard, Smartphone, FileText } from '@lucide/svelte';
	import {
		salesSummary,
		topProducts,
		inventoryValuation,
		salesDaily,
		salesByPayment
	} from '$lib/api/reports';
	import { branch } from '$lib/stores/branch.svelte';
	import { monthStartParam, todayParam, fmtMoney } from '$lib/format';
	import { toCSV, downloadCSV } from '$lib/csv';
	import BarChart from '$lib/components/ui/BarChart.svelte';
	import LineChart from '$lib/components/ui/LineChart.svelte';
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
	const daily = createQuery(() => ({
		queryKey: ['rep-daily', branch.id, from, to],
		queryFn: () => salesDaily(branch.id, from, to),
		enabled: Boolean(branch.id)
	}));
	const byPayment = createQuery(() => ({
		queryKey: ['rep-payment', branch.id, from, to],
		queryFn: () => salesByPayment(branch.id, from, to),
		enabled: Boolean(branch.id)
	}));
	const paymentIcon: Record<string, typeof Banknote> = {
		cash: Banknote,
		card: CreditCard,
		mobile: Smartphone
	};
	const paymentTotal = $derived(
		(byPayment.data?.items ?? []).reduce((s, p) => s + Number(p.revenue), 0)
	);

	// Toggle the trend between revenue and order count.
	let trendMetric = $state<'revenue' | 'count'>('revenue');
	const trendData = $derived(
		(daily.data?.items ?? []).map((d) => ({
			label: d.day,
			value: trendMetric === 'revenue' ? Number(d.revenue) : d.sale_count
		}))
	);

	const dateInput =
		'rounded-full border border-surface-2 bg-surface px-4 py-1.5 text-sm text-fg focus:border-accent focus:outline-none';

	function exportTop() {
		const items = top.data?.items ?? [];
		const csv = toCSV(
			['Rank', 'Product', 'Units sold', 'Revenue'],
			items.map((p, i) => [i + 1, p.product_name, p.units_sold, p.revenue])
		);
		downloadCSV(`top-products_${from}_${to}.csv`, csv);
	}
</script>

<svelte:head><title>Reports — Saydalah</title></svelte:head>

<PageHeader title="Reports" subtitle="Sales performance and inventory valuation.">
	{#snippet actions()}
		<a
			href="/day-end/{to}"
			class="inline-flex items-center gap-1.5 rounded-full border border-surface-2 px-4 py-1.5 text-sm text-fg-soft transition hover:bg-surface-2"
		>
			<FileText size={15} /> Day-end report
		</a>
		<BranchSelect />
	{/snippet}
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

	<!-- Sales trend + payment breakdown -->
	<div class="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
		<Card>
			<div class="mb-2 flex items-center justify-between">
				<h2 class="font-semibold text-fg">Sales trend</h2>
				<div class="flex rounded-full border border-surface-2 p-0.5 text-xs">
					<button
						onclick={() => (trendMetric = 'revenue')}
						class="rounded-full px-3 py-1 font-medium transition {trendMetric === 'revenue' ? 'bg-accent text-accent-contrast' : 'text-muted hover:text-fg'}"
					>Revenue</button>
					<button
						onclick={() => (trendMetric = 'count')}
						class="rounded-full px-3 py-1 font-medium transition {trendMetric === 'count' ? 'bg-accent text-accent-contrast' : 'text-muted hover:text-fg'}"
					>Orders</button>
				</div>
			</div>
			{#if daily.isPending}
				<div class="h-44"><Spinner /></div>
			{:else if daily.isError}
				<ErrorState message={daily.error.message} onRetry={() => daily.refetch()} />
			{:else}
				<LineChart data={trendData} money={trendMetric === 'revenue'} />
			{/if}
		</Card>

		<!-- Payment methods -->
		<Card>
			<h2 class="mb-4 font-semibold text-fg">Payment methods</h2>
			{#if byPayment.isPending}
				<Spinner />
			{:else if byPayment.isError}
				<ErrorState message={byPayment.error.message} onRetry={() => byPayment.refetch()} />
			{:else if byPayment.data.items.length === 0}
				<EmptyState title="No sales in this range" />
			{:else}
				<div class="flex flex-col gap-4">
					{#each byPayment.data.items as p (p.payment_method)}
						{@const PIcon = paymentIcon[p.payment_method] ?? Banknote}
						{@const pct = paymentTotal > 0 ? (Number(p.revenue) / paymentTotal) * 100 : 0}
						<div>
							<div class="mb-1 flex items-center justify-between text-sm">
								<span class="inline-flex items-center gap-2 text-fg-soft capitalize"><PIcon size={15} class="text-accent" />{p.payment_method}</span>
								<span class="font-mono tabular-nums text-fg">{fmtMoney(p.revenue)}</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-surface-2">
								<div class="h-full rounded-full bg-accent" style="width: {pct}%"></div>
							</div>
							<div class="mt-0.5 text-right text-xs text-muted">{p.sale_count} sale{p.sale_count === 1 ? '' : 's'} · {pct.toFixed(0)}%</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	</div>

	<div class="mt-6">
		<Card>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-semibold text-fg">Top products</h2>
				{#if top.data && top.data.items.length > 0}
					<button
						onclick={exportTop}
						class="inline-flex items-center gap-1.5 rounded-full border border-surface-2 px-3 py-1.5 text-xs text-fg-soft transition hover:bg-surface-2"
					>
						<Download size={13} /> Export CSV
					</button>
				{/if}
			</div>
			{#if top.isPending}
				<TableSkeleton cols={4} />
			{:else if top.data && top.data.items.length > 0}
				<div class="mb-6">
					<BarChart money data={top.data.items.slice(0, 8).map((p) => ({ label: p.product_name, value: Number(p.revenue) }))} />
				</div>
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
