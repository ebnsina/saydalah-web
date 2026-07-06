<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { Printer, ArrowLeft, Pill } from '@lucide/svelte';
	import { getSale } from '$lib/api/sales';
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

	const branch = $derived(branches.data?.items.find((b) => b.id === sale.data?.branch_id));
	function product(pid: string): Product | undefined {
		return products.data?.items.find((p) => p.id === pid);
	}

	const currency = import.meta.env.VITE_CURRENCY ?? 'BDT';
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
			class="relative mx-auto max-w-3xl overflow-hidden bg-white px-10 py-10 text-gray-800 shadow-sm ring-1 ring-gray-200 print:max-w-none print:px-0 print:shadow-none print:ring-0 sm:rounded-2xl"
		>
			{#if s.voided_at}
				<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
					<span class="rotate-[-22deg] text-[7rem] font-black tracking-widest text-red-500/10">VOID</span>
				</div>
			{/if}

			<!-- Header -->
			<header class="flex items-start justify-between gap-6 border-b border-gray-200 pb-6">
				<div class="flex items-center gap-3">
					<span class="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent"><Pill size={26} /></span>
					<div>
						<h1 class="text-xl font-bold tracking-tight text-gray-900">Saydalah Pharmacy</h1>
						{#if branch}
							<p class="text-sm text-gray-500">{branch.name}</p>
							<p class="text-xs text-gray-400">{branch.address}{branch.phone ? ` · ${branch.phone}` : ''}</p>
						{/if}
					</div>
				</div>
				<div class="text-right">
					<h2 class="text-2xl font-bold tracking-tight text-gray-900">INVOICE</h2>
					<p class="mt-1 font-mono text-xs text-gray-500">#{s.id.slice(0, 8).toUpperCase()}</p>
					<p class="text-xs text-gray-400">{fmtLongDate(new Date(s.created_at))}</p>
				</div>
			</header>

			<!-- Meta -->
			<div class="grid grid-cols-2 gap-6 py-6 text-sm sm:grid-cols-3">
				<div>
					<div class="text-xs tracking-wide text-gray-400 uppercase">Payment</div>
					<div class="mt-0.5 font-medium text-gray-800 capitalize">{s.payment_method}</div>
				</div>
				<div>
					<div class="text-xs tracking-wide text-gray-400 uppercase">Status</div>
					<div class="mt-0.5 font-medium {s.voided_at ? 'text-red-500' : 'text-emerald-600'}">
						{s.voided_at ? 'Voided' : 'Paid'}
					</div>
				</div>
				<div>
					<div class="text-xs tracking-wide text-gray-400 uppercase">Currency</div>
					<div class="mt-0.5 font-medium text-gray-800">{currency}</div>
				</div>
			</div>

			<!-- Items -->
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b-2 border-gray-200 text-left text-xs tracking-wide text-gray-400 uppercase">
						<th class="py-2 font-medium">Item</th>
						<th class="py-2 text-right font-medium">Qty</th>
						<th class="py-2 text-right font-medium">Unit</th>
						<th class="py-2 text-right font-medium">Amount</th>
					</tr>
				</thead>
				<tbody>
					{#each s.items ?? [] as it (it.batch_id)}
						{@const p = product(it.product_id)}
						<tr class="border-b border-gray-100">
							<td class="py-2.5">
								<div class="font-medium text-gray-900">{p?.name ?? it.product_id.slice(0, 8)}</div>
								{#if p?.strength}<div class="text-xs text-gray-400">{p.form} · {p.strength}</div>{/if}
							</td>
							<td class="py-2.5 text-right tabular-nums">{it.qty}</td>
							<td class="py-2.5 text-right font-mono tabular-nums text-gray-600">{fmtMoney(it.unit_price)}</td>
							<td class="py-2.5 text-right font-mono tabular-nums text-gray-900">{fmtMoney(it.qty * Number(it.unit_price))}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- Totals -->
			<div class="mt-6 flex justify-end">
				<dl class="w-full max-w-xs space-y-1.5 text-sm">
					<div class="flex justify-between text-gray-500">
						<dt>Subtotal</dt>
						<dd class="font-mono tabular-nums">{fmtMoney(s.subtotal)}</dd>
					</div>
					{#if Number(s.discount) > 0}
						<div class="flex justify-between text-gray-500">
							<dt>Discount</dt>
							<dd class="font-mono tabular-nums">−{fmtMoney(s.discount)}</dd>
						</div>
					{/if}
					{#if Number(s.tax) > 0}
						<div class="flex justify-between text-gray-500">
							<dt>Tax</dt>
							<dd class="font-mono tabular-nums">{fmtMoney(s.tax)}</dd>
						</div>
					{/if}
					<div class="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
						<dt>Total</dt>
						<dd class="font-mono tabular-nums">{fmtMoney(s.total)}</dd>
					</div>
					<div class="flex justify-between text-gray-500">
						<dt>Paid</dt>
						<dd class="font-mono tabular-nums">{fmtMoney(s.paid)}</dd>
					</div>
					{#if Number(s.paid) - Number(s.total) > 0}
						<div class="flex justify-between text-gray-500">
							<dt>Change</dt>
							<dd class="font-mono tabular-nums">{fmtMoney(Number(s.paid) - Number(s.total))}</dd>
						</div>
					{/if}
				</dl>
			</div>

			<!-- Footer -->
			<footer class="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
				<p>Thank you for choosing Saydalah Pharmacy.</p>
				<p class="mt-0.5">This is a computer-generated invoice.</p>
			</footer>
		</article>
	{/if}
</div>
