<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { Printer, ArrowLeft } from '@lucide/svelte';
	import { getSale } from '$lib/api/sales';
	import { listBranches } from '$lib/api/branches';
	import { get } from '$lib/api/client';
	import { fmtMoney } from '$lib/format';
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
	function pname(pid: string): string {
		return products.data?.items.find((p) => p.id === pid)?.name ?? pid.slice(0, 8);
	}
	const due = $derived(sale.data ? Number(sale.data.total) - Number(sale.data.paid) : 0);
	function ts(iso: string): string {
		return new Date(iso).toLocaleString('en-CA', { hour12: false }).replace(',', '');
	}
</script>

<svelte:head><title>Receipt — Saydalah</title></svelte:head>

<div class="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
	<div class="mx-auto mb-4 flex w-[80mm] max-w-full items-center justify-between px-2 print:hidden">
		<a href="/sales?view=history" class="inline-flex items-center gap-1.5 rounded-full border border-surface-2 bg-surface px-3 py-1.5 text-xs text-fg-soft transition hover:bg-surface-2">
			<ArrowLeft size={14} /> Back
		</a>
		<button onclick={() => window.print()} class="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-contrast transition hover:bg-accent-strong">
			<Printer size={14} /> Print
		</button>
	</div>

	{#if sale.isPending}
		<div class="py-24"><Spinner label="Loading receipt…" /></div>
	{:else if sale.isError}
		<div class="mx-auto w-[80mm] max-w-full px-2"><ErrorState message={sale.error.message} onRetry={() => sale.refetch()} /></div>
	{:else}
		{@const s = sale.data}
		<div class="receipt mx-auto w-[80mm] max-w-full bg-white px-3 py-4 font-mono text-[11px] leading-tight text-black shadow-sm ring-1 ring-gray-200 print:shadow-none print:ring-0">
			<div class="text-center">
				<div class="text-sm font-bold tracking-wide">SAYDALAH PHARMACY</div>
				{#if branch}<div>{branch.name}</div><div class="text-[10px]">{branch.address}</div>{#if branch.phone}<div class="text-[10px]">{branch.phone}</div>{/if}{/if}
			</div>

			<div class="my-2 border-t border-dashed border-gray-400"></div>
			<div class="flex justify-between text-[10px]"><span>#{s.id.slice(0, 8).toUpperCase()}</span><span>{ts(s.created_at)}</span></div>
			<div class="my-2 border-t border-dashed border-gray-400"></div>

			{#each s.items ?? [] as it (it.batch_id)}
				<div class="flex justify-between">
					<span class="truncate pr-2">{pname(it.product_id)}</span>
					<span class="tabular-nums">{fmtMoney(it.qty * Number(it.unit_price))}</span>
				</div>
				<div class="text-[10px] text-gray-500">{it.qty} × {fmtMoney(it.unit_price)}</div>
			{/each}

			<div class="my-2 border-t border-dashed border-gray-400"></div>
			<div class="flex justify-between"><span>Subtotal</span><span class="tabular-nums">{fmtMoney(s.subtotal)}</span></div>
			{#if Number(s.discount) > 0}<div class="flex justify-between"><span>Discount</span><span class="tabular-nums">-{fmtMoney(s.discount)}</span></div>{/if}
			{#if Number(s.tax) > 0}<div class="flex justify-between"><span>Tax</span><span class="tabular-nums">{fmtMoney(s.tax)}</span></div>{/if}
			<div class="mt-1 flex justify-between border-t border-gray-400 pt-1 text-sm font-bold"><span>TOTAL</span><span class="tabular-nums">{fmtMoney(s.total)}</span></div>
			<div class="flex justify-between"><span>Paid ({s.payment_method})</span><span class="tabular-nums">{fmtMoney(s.paid)}</span></div>
			{#if due > 0}
				<div class="flex justify-between font-bold"><span>BALANCE DUE</span><span class="tabular-nums">{fmtMoney(due)}</span></div>
			{:else if Number(s.paid) - Number(s.total) > 0}
				<div class="flex justify-between"><span>Change</span><span class="tabular-nums">{fmtMoney(Number(s.paid) - Number(s.total))}</span></div>
			{/if}

			{#if s.voided_at}<div class="mt-2 text-center font-bold">*** CANCELLED ***</div>{/if}

			<div class="my-2 border-t border-dashed border-gray-400"></div>
			<div class="text-center text-[10px]">
				<div>Thank you for your purchase!</div>
				<div>Dispensed earliest-expiry first · computer-generated</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@media print {
		@page {
			size: 80mm auto;
			margin: 0;
		}
		.receipt {
			width: 80mm;
			box-shadow: none;
		}
	}
</style>
