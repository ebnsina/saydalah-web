<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Banknote, ShoppingCart, TriangleAlert, Clock, Pill, Boxes } from '@lucide/svelte';
	import { isAuthenticated, me } from '$lib/api/auth';
	import { lowStock, nearExpiry } from '$lib/api/inventory';
	import { listProducts } from '$lib/api/products';
	import { salesSummary, topProducts, inventoryValuation, salesDaily } from '$lib/api/reports';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtLongDate, todayParam, monthStartParam, fmtMoney } from '$lib/format';
	import { productIcon } from '$lib/productIcon';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';

	const user = createQuery(() => ({
		queryKey: ['me'],
		queryFn: me,
		enabled: isAuthenticated(),
		retry: false
	}));

	const canReport = $derived(user.data?.role === 'admin' || user.data?.role === 'manager');
	const today = todayParam();

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

	<div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
		<!-- Top products this month (managers) -->
		{#if canReport}
			<Card>
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-semibold text-fg">Top products this month</h2>
					<a href="/reports" class="text-xs text-accent hover:underline">Reports</a>
				</div>
				{#if monthTop.isPending}
					<Spinner />
				{:else if monthTop.data && monthTop.data.items.length > 0}
					<ol class="divide-y divide-surface-2 text-sm">
						{#each monthTop.data.items as p, i (p.product_id)}
							<li class="flex items-center justify-between py-2">
								<span class="flex items-center gap-3">
									<span class="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-xs font-medium text-muted">{i + 1}</span>
									<span class="text-fg">{p.product_name}</span>
								</span>
								<span class="text-muted">{p.units_sold} sold · <span class="font-mono text-fg-soft">{fmtMoney(p.revenue)}</span></span>
							</li>
						{/each}
					</ol>
				{:else}
					<EmptyState title="No sales yet this month" />
				{/if}
			</Card>
		{/if}

		<!-- Reorder attention (all staff) -->
		<Card>
			<div class="mb-3 flex items-center gap-2">
				<TriangleAlert size={16} class="text-amber-500" />
				<h2 class="font-semibold text-fg">Needs reordering</h2>
			</div>
			{#if low.isPending}
				<Spinner />
			{:else if low.data && low.data.items.length > 0}
				<ul class="divide-y divide-surface-2 text-sm">
					{#each low.data.items.slice(0, 5) as item (item.product_id)}
						{@const fi = productIcon(item.product_form)}
						{@const Icon = fi.icon}
						<li class="flex items-center justify-between py-2">
							<span class="flex items-center gap-2.5 text-fg"><Icon size={16} class={fi.tint} />{item.product_name}</span>
							<span class="text-muted"><span class="font-medium text-red-500">{item.on_hand}</span> / {item.reorder_level}</span>
						</li>
					{/each}
				</ul>
				<a href="/inventory" class="mt-3 inline-block text-xs text-accent hover:underline">View inventory →</a>
			{:else}
				<EmptyState title="Stock looks healthy" description="Nothing below reorder level." />
			{/if}
		</Card>
	</div>
{/if}
