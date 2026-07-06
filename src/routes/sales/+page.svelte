<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { ScanLine, Plus, Minus, X, Trash2, Check, Ban } from '@lucide/svelte';
	import { listProducts, getProductByBarcode } from '$lib/api/products';
	import { createSale, listSales, voidSale } from '$lib/api/sales';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtMoney, fmtDate } from '$lib/format';
	import { urlParam, setParams } from '$lib/url';
	import { validate, saleSchema } from '$lib/validation';
	import type { Product, Sale, PaymentMethod } from '$lib/types';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';

	const queryClient = useQueryClient();

	const view = $derived(urlParam('view', 'pos'));

	// History
	const history = createQuery(() => ({
		queryKey: ['sales', branch.id],
		queryFn: () => listSales(branch.id),
		enabled: view === 'history' && Boolean(branch.id)
	}));
	const voidMut = createMutation(() => ({
		mutationFn: (id: string) => voidSale(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sales'] });
			queryClient.invalidateQueries({ queryKey: ['batches'] });
			queryClient.invalidateQueries({ queryKey: ['low-stock'] });
		}
	}));

	type Line = { product: Product; qty: number };
	let cart = $state<Line[]>([]);
	let barcode = $state('');
	let barcodeError = $state<string | null>(null);
	let search = $state('');
	let debounced = $state('');
	let paymentMethod = $state<PaymentMethod>('cash');
	let discount = $state(0);
	let saleError = $state<string | null>(null);
	let receipt = $state<Sale | null>(null);

	$effect(() => {
		const term = search;
		const t = setTimeout(() => (debounced = term), 250);
		return () => clearTimeout(t);
	});

	const results = createQuery(() => ({
		queryKey: ['product-search', debounced],
		queryFn: () => listProducts({ search: debounced }),
		enabled: debounced.trim().length > 0
	}));

	function addToCart(product: Product) {
		const line = cart.find((l) => l.product.id === product.id);
		if (line) line.qty += 1;
		else cart.push({ product, qty: 1 });
		saleError = null;
	}

	function setQty(id: string, qty: number) {
		if (qty <= 0) cart = cart.filter((l) => l.product.id !== id);
		else {
			const line = cart.find((l) => l.product.id === id);
			if (line) line.qty = qty;
		}
	}

	async function scanBarcode(event: SubmitEvent) {
		event.preventDefault();
		barcodeError = null;
		const code = barcode.trim();
		if (!code) return;
		try {
			addToCart(await getProductByBarcode(code));
			barcode = '';
		} catch (err) {
			barcodeError = err instanceof Error ? err.message : String(err);
		}
	}

	const checkout = createMutation(() => ({
		mutationFn: createSale,
		onSuccess: (sale: Sale) => {
			receipt = sale;
			cart = [];
			discount = 0;
			// Stock changed — inventory views are now stale.
			queryClient.invalidateQueries({ queryKey: ['batches'] });
			queryClient.invalidateQueries({ queryKey: ['low-stock'] });
		},
		onError: (err: Error) => {
			saleError = err.message; // API message, e.g. "insufficient stock"
		}
	}));

	function submit() {
		saleError = null;
		const payload = {
			payment_method: paymentMethod,
			discount,
			lines: cart.map((l) => ({ product_id: l.product.id, qty: l.qty }))
		};
		const result = validate(saleSchema, payload);
		if (result.errors) {
			saleError = Object.values(result.errors)[0];
			return;
		}
		checkout.mutate({ ...payload, branch_id: branch.id });
	}
</script>

<svelte:head><title>Point of Sale — Saydalah</title></svelte:head>

<div class="flex flex-wrap items-center justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-fg">Sales</h1>
		<p class="text-sm text-muted">Ring up sales (FEFO) or review and void past sales.</p>
	</div>
	<div class="flex items-center gap-2">
		<div class="flex rounded-full border border-surface-2 p-0.5 text-sm">
			<button
				onclick={() => setParams({ view: null })}
				class="rounded-full px-3 py-1 font-medium transition {view !== 'history' ? 'bg-accent text-accent-contrast' : 'text-muted hover:text-fg'}"
			>Point of sale</button>
			<button
				onclick={() => setParams({ view: 'history' })}
				class="rounded-full px-3 py-1 font-medium transition {view === 'history' ? 'bg-accent text-accent-contrast' : 'text-muted hover:text-fg'}"
			>History</button>
		</div>
		<BranchSelect />
	</div>
</div>

{#if view === 'history'}
	<!-- Sales history -->
	<div class="mt-6">
		{#if !branch.id}
			<TableSkeleton cols={5} />
		{:else if history.isPending}
			<TableSkeleton cols={5} />
		{:else if history.isError}
			<ErrorState message={history.error.message} onRetry={() => history.refetch()} />
		{:else if history.data.items.length === 0}
			<EmptyState title="No sales yet" description="Completed sales will appear here." />
		{:else}
			<div class="overflow-x-auto rounded-2xl border border-surface-2">
				<table class="w-full text-sm">
					<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
						<tr>
							<th class="px-4 py-2.5 font-medium">Sale</th>
							<th class="px-4 py-2.5 font-medium">When</th>
							<th class="px-4 py-2.5 font-medium">Payment</th>
							<th class="px-4 py-2.5 text-right font-medium">Total</th>
							<th class="px-4 py-2.5 font-medium">Status</th>
							<th class="px-4 py-2.5"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each history.data.items as s (s.id)}
							<tr class="group hover:bg-surface-2/30">
								<td class="px-4 py-2.5 font-mono text-xs text-fg-soft">#{s.id.slice(0, 8)}</td>
								<td class="px-4 py-2.5 text-muted">{fmtDate(s.created_at)}</td>
								<td class="px-4 py-2.5 capitalize text-fg-soft">{s.payment_method}</td>
								<td class="px-4 py-2.5 text-right font-mono tabular-nums text-fg">{fmtMoney(s.total)}</td>
								<td class="px-4 py-2.5">
									{#if s.voided_at}
										<span class="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">Voided</span>
									{:else}
										<span class="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">Completed</span>
									{/if}
								</td>
								<td class="px-4 py-2.5 text-right">
									{#if !s.voided_at}
										<button
											onclick={() => voidMut.mutate(s.id)}
											disabled={voidMut.isPending}
											class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
										>
											<Ban size={13} /> Void
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
{:else if receipt}
	<!-- Receipt -->
	<div class="mx-auto mt-8 max-w-md rounded-2xl border border-surface-2 bg-surface p-6">
		<div class="flex flex-col items-center gap-1 text-center">
			<span class="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
				<Check size={20} />
			</span>
			<h2 class="text-lg font-semibold text-fg">Sale complete</h2>
			<p class="font-mono text-xs text-muted">#{receipt.id.slice(0, 8)}</p>
		</div>
		<ul class="mt-4 divide-y divide-surface-2 text-sm">
			{#each receipt.items as it (it.batch_id)}
				<li class="flex items-center justify-between py-2">
					<span class="text-fg-soft">{it.qty} × <span class="font-mono">{fmtMoney(it.unit_price)}</span></span>
					<span class="font-mono text-fg">{fmtMoney(it.qty * Number(it.unit_price))}</span>
				</li>
			{/each}
		</ul>
		<dl class="mt-3 space-y-1 border-t border-surface-2 pt-3 text-sm">
			<div class="flex justify-between"><dt class="text-muted">Subtotal</dt><dd class="font-mono text-fg-soft">{fmtMoney(receipt.subtotal)}</dd></div>
			<div class="flex justify-between"><dt class="text-muted">Discount</dt><dd class="font-mono text-fg-soft">{fmtMoney(receipt.discount)}</dd></div>
			<div class="flex justify-between text-base font-semibold"><dt class="text-fg">Total</dt><dd class="font-mono text-fg">{fmtMoney(receipt.total)}</dd></div>
		</dl>
		<Button class="mt-5 w-full" onclick={() => (receipt = null)}>New sale</Button>
	</div>
{:else}
	<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
		<!-- Product picker -->
		<div class="flex flex-col gap-4">
			<form onsubmit={scanBarcode}>
				<div class="flex items-center gap-2 rounded-full border border-surface-2 bg-surface py-2 pr-2 pl-5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
					<ScanLine size={18} class="shrink-0 text-muted" />
					<input
						bind:value={barcode}
						placeholder="Scan or type a barcode, then Enter"
						class="w-full bg-transparent font-mono text-sm text-fg placeholder:text-muted focus:outline-none"
					/>
				</div>
			</form>
			{#if barcodeError}<p class="-mt-2 text-sm text-red-500">{barcodeError}</p>{/if}

			<SearchInput bind:value={search} placeholder="Search products to add…" />

			{#if debounced.trim() && results.data}
				<div class="overflow-hidden rounded-2xl border border-surface-2">
					{#if results.data.items.length === 0}
						<p class="p-4 text-sm text-muted">No products match “{debounced}”.</p>
					{:else}
						<ul class="divide-y divide-surface-2">
							{#each results.data.items.slice(0, 8) as p (p.id)}
								<li>
									<button
										type="button"
										onclick={() => addToCart(p)}
										class="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-surface-2/40"
									>
										<span>
											<span class="text-fg">{p.name}</span>
											{#if p.strength}<span class="text-muted"> · {p.strength}</span>{/if}
										</span>
										<Plus size={16} class="text-accent" />
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Cart -->
		<div class="flex h-fit flex-col gap-3 rounded-2xl border border-surface-2 bg-surface p-5">
			<h2 class="font-semibold text-fg">Cart</h2>
			{#if cart.length === 0}
				<p class="py-8 text-center text-sm text-muted">Scan or search to add products.</p>
			{:else}
				<ul class="divide-y divide-surface-2">
					{#each cart as line (line.product.id)}
						<li class="flex items-center gap-2 py-2 text-sm">
							<span class="flex-1 truncate text-fg">{line.product.name}</span>
							<div class="flex items-center gap-1.5">
								<button onclick={() => setQty(line.product.id, line.qty - 1)} class="grid h-6 w-6 place-items-center rounded-full border border-surface-2 text-muted hover:bg-surface-2"><Minus size={13} /></button>
								<span class="w-6 text-center font-medium text-fg">{line.qty}</span>
								<button onclick={() => setQty(line.product.id, line.qty + 1)} class="grid h-6 w-6 place-items-center rounded-full border border-surface-2 text-muted hover:bg-surface-2"><Plus size={13} /></button>
							</div>
							<button onclick={() => setQty(line.product.id, 0)} class="grid h-6 w-6 place-items-center rounded-full text-muted hover:text-red-500"><X size={14} /></button>
						</li>
					{/each}
				</ul>

				<label class="mt-1 flex items-center justify-between text-sm">
					<span class="text-muted">Payment</span>
					<select bind:value={paymentMethod} class="rounded-full border border-surface-2 bg-surface px-3 py-1.5 text-fg focus:border-accent focus:outline-none">
						<option value="cash">Cash</option>
						<option value="card">Card</option>
						<option value="mobile">Mobile</option>
					</select>
				</label>
				<label class="flex items-center justify-between text-sm">
					<span class="text-muted">Discount</span>
					<input type="number" min="0" bind:value={discount} class="w-24 rounded-full border border-surface-2 bg-surface px-3 py-1.5 text-right font-mono text-fg focus:border-accent focus:outline-none" />
				</label>

				{#if saleError}<p class="text-sm text-red-500">{saleError}</p>{/if}

				<Button class="mt-1 w-full" disabled={checkout.isPending} onclick={submit}>
					{checkout.isPending ? 'Processing…' : `Checkout · ${cart.reduce((n, l) => n + l.qty, 0)} items`}
				</Button>
				<button onclick={() => (cart = [])} class="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-red-500">
					<Trash2 size={13} /> Clear cart
				</button>
			{/if}
		</div>
	</div>
{/if}
