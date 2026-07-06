<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { ArrowLeft, Barcode, Boxes } from '@lucide/svelte';
	import { getProduct } from '$lib/api/products';
	import { stockByBranch, productBatches } from '$lib/api/inventory';
	import { listMovements } from '$lib/api/stock';
	import { branch } from '$lib/stores/branch.svelte';
	import { productIcon } from '$lib/productIcon';
	import { movementIcon } from '$lib/movementIcon';
	import { fmtDate, fmtMoney, daysUntil } from '$lib/format';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';

	const id = $derived(page.params.id ?? '');
	const branchReady = $derived(Boolean(branch.id));

	const product = createQuery(() => ({ queryKey: ['product', id], queryFn: () => getProduct(id) }));
	const stock = createQuery(() => ({ queryKey: ['product-stock', id], queryFn: () => stockByBranch(id) }));
	const batches = createQuery(() => ({
		queryKey: ['product-batches', id, branch.id],
		queryFn: () => productBatches(branch.id, id),
		enabled: branchReady
	}));
	const movements = createQuery(() => ({
		queryKey: ['product-movements', id, branch.id],
		queryFn: () => listMovements(branch.id, { productId: id }),
		enabled: branchReady
	}));

	const totalOnHand = $derived((stock.data?.items ?? []).reduce((s, b) => s + b.on_hand, 0));
	const maxBranch = $derived(Math.max(1, ...(stock.data?.items ?? []).map((b) => b.on_hand)));

	function expiryTone(iso: string): string {
		const d = daysUntil(iso);
		if (d < 0) return 'text-red-500';
		if (d <= 60) return 'text-amber-500';
		return 'text-fg-soft';
	}
</script>

<svelte:head><title>{product.data?.name ?? 'Product'} — Saydalah</title></svelte:head>

<a href="/products" class="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg">
	<ArrowLeft size={15} /> Products
</a>

{#if product.isPending}
	<div class="mt-6"><Spinner label="Loading product…" /></div>
{:else if product.isError}
	<div class="mt-6"><ErrorState message={product.error.message} onRetry={() => product.refetch()} /></div>
{:else}
	{@const p = product.data}
	{@const fi = productIcon(p.form)}
	{@const Icon = fi.icon}

	<!-- Header -->
	<div class="mt-4 flex flex-wrap items-start justify-between gap-4">
		<div class="flex items-center gap-4">
			<span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-2 {fi.tint}"><Icon size={26} /></span>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-fg">{p.name}</h1>
				<p class="text-sm text-muted">{[p.generic_name, p.form, p.strength].filter(Boolean).join(' · ') || '—'}</p>
				<div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
					{#if p.category}<span class="rounded-full bg-surface-2 px-2.5 py-0.5 text-fg-soft">{p.category}</span>{/if}
					{#if p.barcode}<span class="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-muted"><Barcode size={12} />{p.barcode}</span>{/if}
					{#if !p.active}<span class="rounded-full bg-red-500/10 px-2.5 py-0.5 font-medium text-red-500">Inactive</span>{/if}
				</div>
			</div>
		</div>
		<BranchSelect />
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Stock across branches -->
		<Card>
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Boxes size={16} class="text-accent" />
					<h2 class="font-semibold text-fg">Stock by branch</h2>
				</div>
				<div class="text-right">
					<div class="font-mono text-lg font-semibold tabular-nums text-fg">{totalOnHand}</div>
					<div class="text-xs text-muted">total on hand</div>
				</div>
			</div>
			{#if stock.isPending}
				<Spinner />
			{:else}
				<div class="flex flex-col gap-3">
					{#each stock.data?.items ?? [] as b (b.branch_id)}
						<div class="grid grid-cols-[9rem_1fr_auto] items-center gap-3 text-sm">
							<span class="truncate text-fg-soft">{b.branch_name}</span>
							<div class="h-2.5 overflow-hidden rounded-full bg-surface-2">
								<div class="h-full rounded-full bg-accent" style="width: {(b.on_hand / maxBranch) * 100}%"></div>
							</div>
							<span class="font-mono text-xs tabular-nums text-muted">{b.on_hand}</span>
						</div>
					{/each}
				</div>
			{/if}
			<p class="mt-4 text-xs text-muted">Reorder level: <span class="font-medium text-fg-soft">{p.reorder_level}</span></p>
		</Card>

		<!-- Batches at current branch -->
		<Card>
			<h2 class="mb-4 font-semibold text-fg">In-stock batches <span class="text-sm font-normal text-muted">· this branch</span></h2>
			{#if !branchReady || batches.isPending}
				<Spinner />
			{:else if batches.isError}
				<ErrorState message={batches.error.message} onRetry={() => batches.refetch()} />
			{:else if batches.data.items.length === 0}
				<EmptyState title="No stock here" description="No in-stock batches at this branch." />
			{:else}
				<table class="w-full text-sm [&_:where(th,td)]:pr-6 [&_:where(th,td):last-child]:pr-0">
					<thead class="text-left text-xs tracking-wide text-muted uppercase">
						<tr><th class="py-1.5 font-medium">Batch</th><th class="py-1.5 text-right font-medium">Qty</th><th class="py-1.5 text-right font-medium">Price</th><th class="py-1.5 text-right font-medium">Expiry</th></tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each batches.data.items as b (b.id)}
							<tr>
								<td class="py-2 font-mono text-xs text-fg-soft">{b.batch_no || '—'}</td>
								<td class="py-2 text-right tabular-nums text-fg">{b.quantity}</td>
								<td class="py-2 text-right font-mono tabular-nums text-fg-soft">{fmtMoney(b.sale_price)}</td>
								<td class="py-2 text-right {expiryTone(b.expiry_date)}">{fmtDate(b.expiry_date)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</Card>
	</div>

	<!-- Movement history -->
	<div class="mt-6">
		<Card>
			<h2 class="mb-4 font-semibold text-fg">Movement history <span class="text-sm font-normal text-muted">· this branch</span></h2>
			{#if !branchReady || movements.isPending}
				<Spinner />
			{:else if movements.isError}
				<ErrorState message={movements.error.message} onRetry={() => movements.refetch()} />
			{:else if movements.data.items.length === 0}
				<EmptyState title="No movements" description="No stock activity for this product here yet." />
			{:else}
				<table class="w-full text-sm [&_:where(th,td)]:pr-6 [&_:where(th,td):last-child]:pr-0">
					<thead class="text-left text-xs tracking-wide text-muted uppercase">
						<tr><th class="py-1.5 font-medium">When</th><th class="py-1.5 font-medium">Type</th><th class="py-1.5 text-right font-medium">Qty</th><th class="py-1.5 font-medium">By</th></tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each movements.data.items as m (m.id)}
							{@const mi = movementIcon(m.type)}
							{@const MIcon = mi.icon}
							<tr>
								<td class="py-2 text-muted">{fmtDate(m.created_at)}</td>
								<td class="py-2"><span class="inline-flex items-center gap-1.5 capitalize {mi.tint}"><MIcon size={14} />{m.type.replace('_', ' ')}</span></td>
								<td class="py-2 text-right font-mono tabular-nums {m.qty < 0 ? 'text-red-500' : 'text-emerald-500'}">{m.qty > 0 ? '+' : ''}{m.qty}</td>
								<td class="py-2 text-muted">{m.created_by_name ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</Card>
	</div>
{/if}
