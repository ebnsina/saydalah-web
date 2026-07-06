<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { Printer, ArrowLeft, Pill } from '@lucide/svelte';
	import { getSale } from '$lib/api/sales';
	import { getCustomer } from '$lib/api/customers';
	import { listBranches } from '$lib/api/branches';
	import { get } from '$lib/api/client';
	import { fmtMoney, fmtLongDate } from '$lib/format';
	import type { Page, Product } from '$lib/types';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';

	const id = $derived(page.params.id ?? '');

	const sale = createQuery(() => ({ queryKey: ['sale', id], queryFn: () => getSale(id) }));
	const branches = createQuery(() => ({ queryKey: ['branches'], queryFn: listBranches }));
	const products = createQuery(() => ({
		queryKey: ['products-all'],
		queryFn: () => get<Page<Product>>('/products?page_size=500')
	}));
	const customerId = $derived(sale.data?.customer_id ?? '');
	const customer = createQuery(() => ({
		queryKey: ['customer', customerId],
		queryFn: () => getCustomer(customerId),
		enabled: Boolean(customerId)
	}));

	const branch = $derived(branches.data?.items.find((b) => b.id === sale.data?.branch_id));
	function product(pid: string): Product | undefined {
		return products.data?.items.find((p) => p.id === pid);
	}

	const currency = import.meta.env.VITE_CURRENCY ?? 'BDT';
	const due = $derived(sale.data ? Number(sale.data.total) - Number(sale.data.paid) : 0);
</script>

<svelte:head><title>Invoice — Saydalah</title></svelte:head>

<div class="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
	<!-- Toolbar (hidden when printing) -->
	<div class="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
		<a
			href="/sales?view=history"
			class="inline-flex items-center gap-1.5 rounded-full border border-surface-2 bg-surface px-4 py-2 text-sm text-fg-soft transition hover:bg-surface-2"
		>
			<ArrowLeft size={15} /> Back
		</a>
		<button
			onclick={() => window.print()}
			class="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:bg-accent-strong"
		>
			<Printer size={15} /> Print / Save PDF
		</button>
	</div>

	{#if sale.isPending}
		<div class="py-24"><Spinner label="Loading invoice…" /></div>
	{:else if sale.isError}
		<div class="mx-auto max-w-3xl px-4"><ErrorState message={sale.error.message} onRetry={() => sale.refetch()} /></div>
	{:else}
		{@const s = sale.data}
		<!-- Invoice sheet -->
		<article
			class="relative mx-auto max-w-3xl overflow-hidden bg-white text-gray-800 shadow-sm ring-1 ring-gray-200 print:max-w-none print:shadow-none print:ring-0 sm:rounded-2xl"
		>
			{#if s.voided_at}
				<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
					<span class="rotate-[-22deg] text-[8rem] font-black tracking-widest text-red-500/10">VOID</span>
				</div>
			{/if}

			<div class="px-10 py-9 print:px-8">
				<!-- Header -->
				<header class="flex items-start justify-between gap-6">
					<div class="flex items-center gap-3">
						<span class="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent"><Pill size={26} /></span>
						<div>
							<h1 class="text-lg font-bold tracking-tight text-gray-900">Saydalah Pharmacy</h1>
							{#if branch}
								<p class="text-sm text-gray-500">{branch.name}</p>
								<p class="text-xs text-gray-400">{branch.address}{branch.phone ? ` · ${branch.phone}` : ''}</p>
							{/if}
						</div>
					</div>
					<div class="text-right">
						<h2 class="text-3xl font-black tracking-tight text-accent">INVOICE</h2>
						<p class="mt-1 font-mono text-xs text-gray-500">#{s.id.slice(0, 8).toUpperCase()}</p>
						<p class="text-xs text-gray-400">{fmtLongDate(new Date(s.created_at))}</p>
					</div>
				</header>

				<!-- Bill-to + status -->
				<div class="mt-8 flex items-start justify-between gap-6 border-t border-gray-100 pt-6">
					<div>
						<div class="text-[11px] font-medium tracking-widest text-gray-400 uppercase">Billed to</div>
						<div class="mt-1 text-base font-semibold text-gray-900">{customer.data?.name ?? 'Walk-in customer'}</div>
						{#if customer.data?.phone}<div class="text-sm text-gray-500">{customer.data.phone}</div>{/if}
						{#if customer.data?.address}<div class="text-sm text-gray-500">{customer.data.address}</div>{/if}
					</div>
					<div class="text-right">
						{#if s.voided_at}
							<span class="inline-block rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold tracking-wide text-red-600 uppercase">Voided</span>
						{:else if due > 0}
							<span class="inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold tracking-wide text-amber-600 uppercase">Due {fmtMoney(due)}</span>
						{:else}
							<span class="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wide text-emerald-600 uppercase">Paid</span>
						{/if}
						<div class="mt-2 text-xs text-gray-400 capitalize">via {s.payment_method}</div>
					</div>
				</div>

				<!-- Items -->
				<table class="mt-8 w-full text-sm">
					<thead>
						<tr class="border-b border-gray-200 text-left text-[11px] font-medium tracking-widest text-gray-500 uppercase">
							<th class="py-2 pr-4 font-medium">Item</th>
							<th class="py-2 pr-4 text-right font-medium">Qty</th>
							<th class="py-2 pr-4 text-right font-medium">Unit</th>
							<th class="py-2 text-right font-medium">Amount</th>
						</tr>
					</thead>
					<tbody>
						{#each s.items ?? [] as it (it.batch_id)}
							{@const p = product(it.product_id)}
							<tr class="border-b border-gray-100 last:border-0">
								<td class="py-3 pr-4">
									<div class="font-medium text-gray-900">{p?.name ?? it.product_id.slice(0, 8)}</div>
									{#if p?.strength}<div class="text-xs text-gray-400">{[p.form, p.strength].filter(Boolean).join(' · ')}</div>{/if}
								</td>
								<td class="py-3 pr-4 text-right tabular-nums">{it.qty}</td>
								<td class="py-3 pr-4 text-right font-mono tabular-nums text-gray-600">{fmtMoney(it.unit_price)}</td>
								<td class="py-3 text-right font-mono tabular-nums text-gray-900">{fmtMoney(it.qty * Number(it.unit_price))}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="border-t border-gray-200"></div>

				<!-- Totals -->
				<div class="mt-6 flex justify-end">
					<dl class="w-full max-w-xs space-y-2 text-sm">
						<div class="flex justify-between text-gray-500"><dt>Subtotal</dt><dd class="font-mono tabular-nums">{fmtMoney(s.subtotal)}</dd></div>
						{#if Number(s.discount) > 0}<div class="flex justify-between text-gray-500"><dt>Discount</dt><dd class="font-mono tabular-nums">−{fmtMoney(s.discount)}</dd></div>{/if}
						{#if Number(s.tax) > 0}<div class="flex justify-between text-gray-500"><dt>Tax</dt><dd class="font-mono tabular-nums">{fmtMoney(s.tax)}</dd></div>{/if}
						<div class="flex items-center justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900"><dt>Total</dt><dd class="font-mono tabular-nums">{fmtMoney(s.total)}</dd></div>
						<div class="flex justify-between text-gray-500"><dt>Paid</dt><dd class="font-mono tabular-nums">{fmtMoney(s.paid)}</dd></div>
						{#if due > 0}
							<div class="flex justify-between font-semibold text-amber-600"><dt>Balance due</dt><dd class="font-mono tabular-nums">{fmtMoney(due)}</dd></div>
						{:else if Number(s.paid) - Number(s.total) > 0}
							<div class="flex justify-between text-gray-500"><dt>Change</dt><dd class="font-mono tabular-nums">{fmtMoney(Number(s.paid) - Number(s.total))}</dd></div>
						{/if}
					</dl>
				</div>

				<!-- Footer -->
				<footer class="mt-12 flex flex-wrap items-end justify-between gap-4 border-t border-gray-100 pt-5 text-xs text-gray-400">
					<div>
						<p class="font-medium text-gray-500">Thank you for choosing Saydalah Pharmacy.</p>
						<p class="mt-0.5">Amounts in {currency}. Goods dispensed FEFO. This is a computer-generated invoice — no signature required.</p>
					</div>
					<div class="font-mono text-[10px] text-gray-300">#{s.id.slice(0, 8).toUpperCase()}</div>
				</footer>
			</div>
		</article>
	{/if}
</div>
