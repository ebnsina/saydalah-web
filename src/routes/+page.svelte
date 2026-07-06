<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Banknote, ShoppingCart, TriangleAlert, Clock, Pill, Boxes, Trophy } from '@lucide/svelte';
	import { isAuthenticated, me } from '$lib/api/auth';
	import { lowStock, nearExpiry } from '$lib/api/inventory';
	import { listProducts } from '$lib/api/products';
	import { salesSummary, topProducts, inventoryValuation, salesDaily } from '$lib/api/reports';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtLongDate, todayParam, monthStartParam, fmtMoney } from '$lib/format';
	import { productIcon } from '$lib/productIcon';
	import { urlParam, setParams } from '$lib/url';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';

	const user = createQuery(() => ({
		queryKey: ['me'],
		queryFn: me,
		enabled: isAuthenticated(),
		retry: false
	}));

	const canReport = $derived(user.data?.role === 'admin' || user.data?.role === 'manager');
	const today = todayParam();

	const tab = $derived(urlParam('tab', 'reorder'));
	const tabs = $derived([
		{ id: 'reorder', label: 'Needs reordering', icon: TriangleAlert, count: low.data?.items.length },
		...(canReport
			? [{ id: 'top', label: 'Top products this month', icon: Trophy, count: monthTop.data?.items.length }]
			: [])
	]);

	// Any authenticated staff can read these.
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
	const products = createQuery(() => ({
		queryKey: ['products', '', 1],
		queryFn: () => listProducts({})
	}));

	// Manager/admin-only reporting.
	const yesterday = todayParam(new Date(Date.now() - 86_400_000));
	const todaySales = createQuery(() => ({
		queryKey: ['sales-summary', branch.id, today],
		queryFn: () => salesSummary(branch.id, today, today),
		enabled: Boolean(branch.id) && canReport
	}));
	const yesterdaySales = createQuery(() => ({
		queryKey: ['sales-summary', branch.id, yesterday],
		queryFn: () => salesSummary(branch.id, yesterday, yesterday),
		enabled: Boolean(branch.id) && canReport
	}));

	// Percentage change vs. yesterday (undefined until both days are loaded).
	function pctDelta(now: number, prev: number): number {
		if (prev === 0) return now > 0 ? 100 : 0;
		return Math.round(((now - prev) / prev) * 100);
	}
	const revenueDelta = $derived(
		todaySales.data && yesterdaySales.data
			? pctDelta(Number(todaySales.data.revenue), Number(yesterdaySales.data.revenue))
			: undefined
	);
	const salesDelta = $derived(
		todaySales.data && yesterdaySales.data
			? pctDelta(todaySales.data.sale_count, yesterdaySales.data.sale_count)
			: undefined
	);
	// 14-day sparkline trend for the revenue/sales KPI cards.
	const sparkFrom = todayParam(new Date(Date.now() - 13 * 86_400_000));
	const sparkTo = todayParam(new Date(Date.now() + 86_400_000));
	const trend = createQuery(() => ({
		queryKey: ['dash-trend', branch.id, sparkFrom],
		queryFn: () => salesDaily(branch.id, sparkFrom, sparkTo),
		enabled: Boolean(branch.id) && canReport
	}));
	const revSpark = $derived((trend.data?.items ?? []).map((d) => Number(d.revenue)));
	const salesSpark = $derived((trend.data?.items ?? []).map((d) => d.sale_count));

	const monthTop = createQuery(() => ({
		queryKey: ['top-products', branch.id, monthStartParam()],
		queryFn: () => topProducts(branch.id, { from: monthStartParam(), to: today, limit: 5 }),
		enabled: Boolean(branch.id) && canReport
	}));
	const valuation = createQuery(() => ({
		queryKey: ['valuation', branch.id],
		queryFn: () => inventoryValuation(branch.id),
		enabled: Boolean(branch.id) && canReport
	}));
</script>

<svelte:head><title>Dashboard — Saydalah</title></svelte:head>

{#if !isAuthenticated()}
	<div class="mx-auto max-w-md py-24 text-center">
		<h1 class="text-xl font-semibold text-fg">Welcome to Saydalah</h1>
		<p class="mt-2 text-sm text-muted">Sign in to manage your pharmacy branches.</p>
		<a
			href="/login"
			class="mt-6 inline-block rounded-full bg-accent px-5 py-2 font-medium text-accent-contrast transition hover:bg-accent-strong"
		>Go to sign in</a>
	</div>
{:else}
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-fg">
				Welcome back{user.data ? `, ${user.data.full_name || user.data.email.split('@')[0]}` : ''}
			</h1>
			<p class="mt-0.5 text-sm text-muted">{fmtLongDate()}</p>
		</div>
		<BranchSelect />
	</div>

	<!-- Stats -->
	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#if canReport}
			<StatCard
				label="Today's revenue"
				value={Number(todaySales.data?.revenue ?? 0)}
				format={fmtMoney}
				delta={revenueDelta}
				hint="vs. yesterday"
				sparkline={revSpark}
				loading={todaySales.isPending}
				tone="accent"
			>
				{#snippet icon()}<Banknote size={16} />{/snippet}
			</StatCard>
			<StatCard
				label="Today's sales"
				value={todaySales.data?.sale_count ?? 0}
				delta={salesDelta}
				hint="vs. yesterday"
				sparkline={salesSpark}
				loading={todaySales.isPending}
			>
				{#snippet icon()}<ShoppingCart size={16} />{/snippet}
			</StatCard>
		{/if}
		<StatCard
			label="Low stock"
			value={low.data?.items.length ?? 0}
			hint="at or below reorder level"
			tone={low.data && low.data.items.length > 0 ? 'danger' : 'success'}
			loading={low.isPending}
		>
			{#snippet icon()}<TriangleAlert size={16} />{/snippet}
		</StatCard>
		<StatCard
			label="Expiring ≤ 60 days"
			value={expiring.data?.items.length ?? 0}
			tone={expiring.data && expiring.data.items.length > 0 ? 'warn' : 'success'}
			loading={expiring.isPending}
		>
			{#snippet icon()}<Clock size={16} />{/snippet}
		</StatCard>
		{#if !canReport}
			<StatCard label="Products" value={products.data?.total ?? 0} loading={products.isPending}>
				{#snippet icon()}<Pill size={16} />{/snippet}
			</StatCard>
		{/if}
	</div>

	{#if canReport && valuation.data}
		<div class="mt-4 grid gap-4 sm:grid-cols-3">
			<StatCard label="Stock on hand" value={valuation.data.total_units}>
				{#snippet icon()}<Boxes size={16} />{/snippet}
			</StatCard>
			<StatCard label="Inventory cost value" value={Number(valuation.data.cost_value)} format={fmtMoney}>
				{#snippet icon()}<Banknote size={16} />{/snippet}
			</StatCard>
			<StatCard
				label="Inventory retail value"
				value={Number(valuation.data.retail_value)}
				format={fmtMoney}
				tone="accent"
			>
				{#snippet icon()}<Banknote size={16} />{/snippet}
			</StatCard>
		</div>
	{/if}

	<!-- Tabbed lists -->
	<div class="mt-6 flex gap-1 border-b border-surface-2">
		{#each tabs as t (t.id)}
			{@const TIcon = t.icon}
			<button
				onclick={() => setParams({ tab: t.id })}
				class="inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition {tab === t.id
					? 'border-accent text-accent'
					: 'border-transparent text-muted hover:text-fg'}"
			>
				<TIcon size={15} />{t.label}
				{#if t.count !== undefined}<span class="rounded-full bg-surface-2 px-1.5 text-xs text-muted">{t.count}</span>{/if}
			</button>
		{/each}
	</div>

	<div class="mt-5">
		{#if tab === 'top' && canReport}
			<!-- Top products this month -->
			{#if monthTop.isPending}
				<TableSkeleton cols={3} />
			{:else if monthTop.data && monthTop.data.items.length > 0}
				<div class="overflow-x-auto rounded-2xl border border-surface-2">
					<table class="w-full text-sm">
						<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
							<tr><th class="px-4 py-2.5 font-medium">#</th><th class="px-4 py-2.5 font-medium">Product</th><th class="px-4 py-2.5 text-right font-medium">Units sold</th><th class="px-4 py-2.5 text-right font-medium">Revenue</th></tr>
						</thead>
						<tbody class="divide-y divide-surface-2">
							{#each monthTop.data.items as p, i (p.product_id)}
								<tr class="hover:bg-surface-2/30">
									<td class="px-4 py-2.5"><span class="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-xs font-medium text-muted">{i + 1}</span></td>
									<td class="px-4 py-2.5"><a href="/products/{p.product_id}" class="text-fg hover:text-accent hover:underline">{p.product_name}</a></td>
									<td class="px-4 py-2.5 text-right tabular-nums text-fg-soft">{p.units_sold}</td>
									<td class="px-4 py-2.5 text-right font-mono tabular-nums text-fg">{fmtMoney(p.revenue)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<EmptyState title="No sales yet this month" />
			{/if}
		{:else}
			<!-- Needs reordering -->
			{#if low.isPending}
				<TableSkeleton cols={4} />
			{:else if low.data && low.data.items.length > 0}
				<div class="overflow-x-auto rounded-2xl border border-surface-2">
					<table class="w-full text-sm">
						<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
							<tr><th class="px-4 py-2.5 font-medium">Product</th><th class="px-4 py-2.5 text-right font-medium">On hand</th><th class="px-4 py-2.5 text-right font-medium">Reorder level</th><th class="px-4 py-2.5 text-right font-medium">Short by</th></tr>
						</thead>
						<tbody class="divide-y divide-surface-2">
							{#each low.data.items as item (item.product_id)}
								{@const fi = productIcon(item.product_form)}
								{@const Icon = fi.icon}
								<tr class="hover:bg-surface-2/30">
									<td class="px-4 py-2.5"><a href="/products/{item.product_id}" class="flex items-center gap-2.5 text-fg hover:text-accent hover:underline"><Icon size={16} class={fi.tint} />{item.product_name}</a></td>
									<td class="px-4 py-2.5 text-right font-medium text-red-500 tabular-nums">{item.on_hand}</td>
									<td class="px-4 py-2.5 text-right text-fg-soft tabular-nums">{item.reorder_level}</td>
									<td class="px-4 py-2.5 text-right text-amber-500 tabular-nums">{Math.max(item.reorder_level - item.on_hand, 0)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<EmptyState title="Stock looks healthy" description="Nothing below reorder level." />
			{/if}
		{/if}
	</div>
{/if}
