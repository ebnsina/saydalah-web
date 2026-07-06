<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Plus, Trash2, PackageCheck } from '@lucide/svelte';
	import { listOrders, createOrder, receiveOrder, type ReceiveLine } from '$lib/api/purchasing';
	import { listSuppliers } from '$lib/api/suppliers';
	import { listProducts } from '$lib/api/products';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtDate, fmtMoney, todayParam } from '$lib/format';
	import type { PurchaseOrder } from '$lib/types';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';

	const qc = useQueryClient();
	const branchReady = $derived(Boolean(branch.id));

	const orders = createQuery(() => ({
		queryKey: ['purchase-orders', branch.id],
		queryFn: () => listOrders(branch.id),
		enabled: branchReady
	}));
	const suppliers = createQuery(() => ({ queryKey: ['suppliers'], queryFn: listSuppliers }));
	const products = createQuery(() => ({
		queryKey: ['products', '', 1],
		queryFn: () => listProducts({})
	}));

	function supplierName(id: string): string {
		return suppliers.data?.items.find((s) => s.id === id)?.name ?? '—';
	}

	const statusTone: Record<string, string> = {
		draft: 'bg-surface-2 text-muted',
		ordered: 'bg-accent/10 text-accent',
		received: 'bg-emerald-500/10 text-emerald-500',
		cancelled: 'bg-red-500/10 text-red-500'
	};

	// --- create order ---
	let showCreate = $state(false);
	let supplierId = $state('');
	let reference = $state('');
	let items = $state<{ product_id: string; qty: number; unit_cost: number }[]>([
		{ product_id: '', qty: 1, unit_cost: 0 }
	]);
	let createError = $state<string | null>(null);

	function resetCreate() {
		supplierId = '';
		reference = '';
		items = [{ product_id: '', qty: 1, unit_cost: 0 }];
		createError = null;
	}

	const create = createMutation(() => ({
		mutationFn: createOrder,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['purchase-orders'] });
			showCreate = false;
			resetCreate();
		},
		onError: (e: Error) => (createError = e.message)
	}));

	function submitCreate() {
		createError = null;
		const validItems = items.filter((i) => i.product_id && i.qty > 0);
		if (!supplierId) return (createError = 'Choose a supplier');
		if (validItems.length === 0) return (createError = 'Add at least one item');
		create.mutate({ branch_id: branch.id, supplier_id: supplierId, reference, items: validItems });
	}

	// --- receive order ---
	let receiveOpen = $state(false);
	let receiving = $state<PurchaseOrder | null>(null);
	let lines = $state<ReceiveLine[]>([]);
	let receiveError = $state<string | null>(null);

	function openReceive(po: PurchaseOrder) {
		receiving = po;
		receiveError = null;
		receiveOpen = true;
		lines = po.items.map((it) => ({
			product_id: it.product_id,
			batch_no: '',
			quantity: it.qty,
			cost_price: Number(it.unit_cost),
			sale_price: 0,
			expiry_date: ''
		}));
	}

	const receive = createMutation(() => ({
		mutationFn: (v: { id: string; lines: ReceiveLine[] }) => receiveOrder(v.id, v.lines),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['purchase-orders'] });
			qc.invalidateQueries({ queryKey: ['batches'] });
			qc.invalidateQueries({ queryKey: ['low-stock'] });
			receiveOpen = false;
		},
		onError: (e: Error) => (receiveError = e.message)
	}));

	function submitReceive() {
		receiveError = null;
		if (!receiving) return;
		if (lines.some((l) => !l.expiry_date)) return (receiveError = 'Every line needs an expiry date');
		const payload = lines.map((l) => ({ ...l, expiry_date: `${l.expiry_date}T00:00:00Z` }));
		receive.mutate({ id: receiving.id, lines: payload });
	}

	function productName(id: string): string {
		return products.data?.items.find((p) => p.id === id)?.name ?? id.slice(0, 8);
	}

	const field =
		'rounded-full border border-surface-2 bg-surface px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none';
</script>

<svelte:head><title>Purchasing — Saydalah</title></svelte:head>

<PageHeader title="Purchasing" subtitle="Order stock from suppliers and receive it into inventory.">
	{#snippet actions()}
		<BranchSelect />
		<Button onclick={() => (showCreate = true)}><Plus size={16} /> New order</Button>
	{/snippet}
</PageHeader>

<div class="mt-6">
	{#if !branchReady}
		<Spinner label="Selecting branch…" />
	{:else if orders.isPending}
		<Spinner label="Loading orders…" />
	{:else if orders.isError}
		<ErrorState message={orders.error.message} onRetry={() => orders.refetch()} />
	{:else if orders.data.items.length === 0}
		<EmptyState title="No purchase orders" description="Create one to order stock." />
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-surface-2">
			<table class="w-full text-sm">
				<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
					<tr>
						<th class="px-4 py-2.5 font-medium">Reference</th>
						<th class="px-4 py-2.5 font-medium">Supplier</th>
						<th class="px-4 py-2.5 font-medium">Status</th>
						<th class="px-4 py-2.5 text-right font-medium">Items</th>
						<th class="px-4 py-2.5 font-medium">Ordered</th>
						<th class="px-4 py-2.5"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-2">
					{#each orders.data.items as po (po.id)}
						<tr class="hover:bg-surface-2/30">
							<td class="px-4 py-2.5 font-mono text-xs text-fg-soft">{po.reference || po.id.slice(0, 8)}</td>
							<td class="px-4 py-2.5 text-fg">{supplierName(po.supplier_id)}</td>
							<td class="px-4 py-2.5">
								<span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {statusTone[po.status]}">{po.status}</span>
							</td>
							<td class="px-4 py-2.5 text-right tabular-nums text-fg-soft">{po.items.length}</td>
							<td class="px-4 py-2.5 text-muted">{po.ordered_at ? fmtDate(po.ordered_at) : '—'}</td>
							<td class="px-4 py-2.5 text-right">
								{#if po.status === 'ordered'}
									<button
										onclick={() => openReceive(po)}
										class="inline-flex items-center gap-1 rounded-full border border-surface-2 px-3 py-1 text-xs text-fg-soft transition hover:bg-surface-2"
									>
										<PackageCheck size={13} /> Receive
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Create order modal -->
<Modal bind:open={showCreate} title="New purchase order">
	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Supplier</span>
			<select bind:value={supplierId} class={field}>
				<option value="" disabled>Choose a supplier…</option>
				{#each suppliers.data?.items ?? [] as s (s.id)}<option value={s.id}>{s.name}</option>{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Reference</span>
			<input bind:value={reference} placeholder="PO-1234" class={field} />
		</label>

		<div class="mt-1 flex flex-col gap-2">
			<span class="text-sm font-medium text-fg-soft">Items</span>
			{#each items as item, i (i)}
				<div class="flex items-center gap-2">
					<select bind:value={item.product_id} class="{field} flex-1">
						<option value="" disabled>Product…</option>
						{#each products.data?.items ?? [] as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
					</select>
					<input type="number" min="1" bind:value={item.qty} class="{field} w-20 text-right" title="Quantity" />
					<input type="number" min="0" step="0.01" bind:value={item.unit_cost} class="{field} w-24 text-right" title="Unit cost" />
					<button onclick={() => (items = items.filter((_, j) => j !== i))} class="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-red-500" title="Remove"><Trash2 size={14} /></button>
				</div>
			{/each}
			<button onclick={() => (items = [...items, { product_id: '', qty: 1, unit_cost: 0 }])} class="self-start text-xs text-accent hover:underline">+ Add item</button>
		</div>

		{#if createError}<p class="text-sm text-red-500">{createError}</p>{/if}
		<div class="mt-2 flex justify-end gap-2">
			<Button onclick={submitCreate} disabled={create.isPending}>{create.isPending ? 'Placing…' : 'Place order'}</Button>
			<Button variant="secondary" onclick={() => (showCreate = false)}>Cancel</Button>
		</div>
	</div>
</Modal>

<!-- Receive modal -->
<Modal bind:open={receiveOpen} title="Receive goods">
	{#if receiving}
		<div class="flex flex-col gap-3">
			<p class="text-sm text-muted">Enter the received batches for each line.</p>
			{#each lines as line, i (i)}
				<div class="rounded-xl border border-surface-2 p-3">
					<div class="mb-2 text-sm font-medium text-fg">{productName(line.product_id)}</div>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
						<input bind:value={line.batch_no} placeholder="Batch no" class={field} />
						<input type="number" min="1" bind:value={line.quantity} placeholder="Qty" class="{field} text-right" title="Quantity" />
						<input type="number" min="0" step="0.01" bind:value={line.sale_price} placeholder="Sale price" class="{field} text-right" title="Sale price" />
						<input type="date" min={todayParam()} bind:value={line.expiry_date} class={field} title="Expiry" />
					</div>
				</div>
			{/each}
			{#if receiveError}<p class="text-sm text-red-500">{receiveError}</p>{/if}
			<div class="mt-1 flex justify-end gap-2">
				<Button onclick={submitReceive} disabled={receive.isPending}>{receive.isPending ? 'Receiving…' : 'Receive into stock'}</Button>
				<Button variant="secondary" onclick={() => (receiveOpen = false)}>Cancel</Button>
			</div>
		</div>
	{/if}
</Modal>
