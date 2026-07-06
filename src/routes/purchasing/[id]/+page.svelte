<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { ArrowLeft, Truck, FileText, PackageCheck, Ban } from '@lucide/svelte';
	import { getOrder, receiveOrder, type ReceiveLine } from '$lib/api/purchasing';
	import { listSuppliers } from '$lib/api/suppliers';
	import { listProducts } from '$lib/api/products';
	import { fmtDate, fmtMoney, fmtLongDate } from '$lib/format';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';

	const qc = useQueryClient();
	const id = $derived(page.params.id ?? '');

	const po = createQuery(() => ({ queryKey: ['purchase-order', id], queryFn: () => getOrder(id) }));
	const suppliers = createQuery(() => ({ queryKey: ['suppliers'], queryFn: listSuppliers }));
	const products = createQuery(() => ({ queryKey: ['products-all'], queryFn: () => listProducts({ page: 1 }) }));

	function supplierName(sid: string) {
		return suppliers.data?.items.find((s) => s.id === sid)?.name ?? '—';
	}
	function productName(pid: string) {
		return products.data?.items.find((p) => p.id === pid)?.name ?? pid.slice(0, 8);
	}

	const statusTone: Record<string, string> = {
		draft: 'bg-surface-2 text-muted',
		ordered: 'bg-accent/10 text-accent',
		received: 'bg-emerald-500/10 text-emerald-500',
		cancelled: 'bg-red-500/10 text-red-500'
	};
	const statusIcon: Record<string, typeof Truck> = {
		draft: FileText,
		ordered: Truck,
		received: PackageCheck,
		cancelled: Ban
	};
	const total = $derived(
		(po.data?.items ?? []).reduce((t, it) => t + it.qty * Number(it.unit_cost), 0)
	);

	// --- inline receive ---
	const field =
		'w-full rounded-lg border border-surface-2 bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none';
	let lines = $state<ReceiveLine[]>([]);
	let receiveError = $state<string | null>(null);
	$effect(() => {
		if (po.data && lines.length === 0 && po.data.status === 'ordered') {
			lines = (po.data.items ?? []).map((it) => ({
				product_id: it.product_id,
				batch_no: '',
				quantity: it.qty,
				cost_price: Number(it.unit_cost),
				sale_price: 0,
				expiry_date: ''
			}));
		}
	});
	const receive = createMutation(() => ({
		mutationFn: () => receiveOrder(id, lines.map((l) => ({ ...l, expiry_date: `${l.expiry_date}T00:00:00Z` }))),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['purchase-order', id] });
			qc.invalidateQueries({ queryKey: ['purchase-orders'] });
			qc.invalidateQueries({ queryKey: ['batches'] });
			qc.invalidateQueries({ queryKey: ['low-stock'] });
		},
		onError: (e: Error) => (receiveError = e.message)
	}));
	function submitReceive() {
		receiveError = null;
		if (lines.some((l) => !l.expiry_date)) return (receiveError = 'Every line needs an expiry date');
		if (lines.some((l) => l.sale_price <= 0)) return (receiveError = 'Every line needs a sale price');
		receive.mutate();
	}
</script>

<svelte:head><title>Purchase order — Saydalah</title></svelte:head>

<a href="/purchasing" class="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg">
	<ArrowLeft size={15} /> Purchasing
</a>

{#if po.isPending}
	<div class="mt-6"><Spinner label="Loading order…" /></div>
{:else if po.isError}
	<div class="mt-6"><ErrorState message={po.error.message} onRetry={() => po.refetch()} /></div>
{:else}
	{@const o = po.data}
	{@const SIcon = statusIcon[o.status]}
	<div class="mt-4 flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-semibold tracking-tight text-fg">{o.reference || `PO #${o.id.slice(0, 8)}`}</h1>
				<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {statusTone[o.status]}"><SIcon size={12} />{o.status}</span>
			</div>
			<p class="mt-1 text-sm text-muted">{supplierName(o.supplier_id)}</p>
		</div>
		<div class="text-right text-sm">
			<div class="font-mono text-lg font-semibold tabular-nums text-fg">{fmtMoney(total)}</div>
			<div class="text-xs text-muted">order value</div>
		</div>
	</div>

	<div class="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted">
		<span>Created {fmtLongDate(new Date(o.created_at))}</span>
		{#if o.ordered_at}<span>Ordered {fmtDate(o.ordered_at)}</span>{/if}
		{#if o.received_at}<span>Received {fmtDate(o.received_at)}</span>{/if}
	</div>

	<div class="mt-6">
		<Card>
			<h2 class="mb-4 font-semibold text-fg">Order items</h2>
			<table class="w-full text-sm [&_:where(th,td)]:pr-6 [&_:where(th,td):last-child]:pr-0">
				<thead class="text-left text-xs tracking-wide text-muted uppercase">
					<tr><th class="py-1.5 font-medium">Product</th><th class="py-1.5 text-right font-medium">Qty</th><th class="py-1.5 text-right font-medium">Unit cost</th><th class="py-1.5 text-right font-medium">Line total</th></tr>
				</thead>
				<tbody class="divide-y divide-surface-2">
					{#each o.items ?? [] as it (it.product_id)}
						<tr>
							<td class="py-2"><a href="/products/{it.product_id}" class="text-fg hover:text-accent hover:underline">{productName(it.product_id)}</a></td>
							<td class="py-2 text-right tabular-nums text-fg-soft">{it.qty}</td>
							<td class="py-2 text-right font-mono tabular-nums text-fg-soft">{fmtMoney(it.unit_cost)}</td>
							<td class="py-2 text-right font-mono tabular-nums text-fg">{fmtMoney(it.qty * Number(it.unit_cost))}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Card>
	</div>

	{#if o.status === 'ordered'}
		<div class="mt-6">
			<Card>
				<h2 class="mb-1 font-semibold text-fg">Receive into stock</h2>
				<p class="mb-4 text-sm text-muted">Enter the batch number, expiry, and sale price for each line to create stock batches.</p>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="text-left text-xs tracking-wide text-muted uppercase">
							<tr><th class="py-1.5 pr-3 font-medium">Product</th><th class="py-1.5 pr-3 font-medium">Batch #</th><th class="py-1.5 pr-3 font-medium">Qty</th><th class="py-1.5 pr-3 font-medium">Cost</th><th class="py-1.5 pr-3 font-medium">Sale price</th><th class="py-1.5 font-medium">Expiry</th></tr>
						</thead>
						<tbody>
							{#each lines as line, i (i)}
								<tr>
									<td class="py-1.5 pr-3 text-fg-soft">{productName(line.product_id)}</td>
									<td class="py-1.5 pr-3"><input bind:value={line.batch_no} placeholder="LOT-123" class="{field} w-28" /></td>
									<td class="py-1.5 pr-3"><input type="number" min="1" bind:value={line.quantity} class="{field} w-20 text-right" /></td>
									<td class="py-1.5 pr-3"><input type="number" min="0" step="0.01" bind:value={line.cost_price} class="{field} w-24 text-right" /></td>
									<td class="py-1.5 pr-3"><input type="number" min="0" step="0.01" bind:value={line.sale_price} class="{field} w-24 text-right" /></td>
									<td class="py-1.5"><input type="date" bind:value={line.expiry_date} class="{field} w-40" /></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if receiveError}<p class="mt-3 text-sm text-red-500">{receiveError}</p>{/if}
				<div class="mt-4 flex justify-end">
					<Button onclick={submitReceive} disabled={receive.isPending}>
						<PackageCheck size={15} /> {receive.isPending ? 'Receiving…' : 'Receive into stock'}
					</Button>
				</div>
			</Card>
		</div>
	{/if}
{/if}
