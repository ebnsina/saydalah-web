<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { Printer, ArrowLeft, Pill, Banknote, CreditCard, Smartphone } from '@lucide/svelte';
	import { salesSummary, salesByPayment } from '$lib/api/reports';
	import { listBranches } from '$lib/api/branches';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtMoney, fmtLongDate } from '$lib/format';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';

	const date = $derived(page.params.date ?? '');
	// The API filters created_at < to, so `to` is the following day.
	const nextDay = $derived.by(() => {
		const d = new Date(`${date}T00:00:00`);
		d.setDate(d.getDate() + 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	});
	const branchReady = $derived(Boolean(branch.id));

	const summary = createQuery(() => ({
		queryKey: ['dayend-summary', branch.id, date],
		queryFn: () => salesSummary(branch.id, date, nextDay),
		enabled: branchReady && Boolean(date)
	}));
	const byPayment = createQuery(() => ({
		queryKey: ['dayend-payment', branch.id, date],
		queryFn: () => salesByPayment(branch.id, date, nextDay),
		enabled: branchReady && Boolean(date)
	}));
	const branches = createQuery(() => ({ queryKey: ['branches'], queryFn: listBranches }));
	const branchInfo = $derived(branches.data?.items.find((b) => b.id === branch.id));

	const payIcon: Record<string, typeof Banknote> = { cash: Banknote, card: CreditCard, mobile: Smartphone };
</script>

<svelte:head><title>Day-end report — Saydalah</title></svelte:head>

<div class="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
	<div class="mx-auto mb-4 flex max-w-2xl items-center justify-between px-4 print:hidden">
		<a href="/reports" class="inline-flex items-center gap-1.5 rounded-full border border-surface-2 bg-surface px-4 py-2 text-sm text-fg-soft transition hover:bg-surface-2">
			<ArrowLeft size={15} /> Reports
		</a>
		<button onclick={() => window.print()} class="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:bg-accent-strong">
			<Printer size={15} /> Print / Save PDF
		</button>
	</div>

	{#if !branchReady}
		<div class="mx-auto max-w-2xl px-4"><ErrorState message="Select a branch first (open the dashboard, choose a branch, then reopen this report)." /></div>
	{:else if summary.isPending}
		<div class="py-24"><Spinner label="Loading day-end report…" /></div>
	{:else if summary.isError}
		<div class="mx-auto max-w-2xl px-4"><ErrorState message={summary.error.message} onRetry={() => summary.refetch()} /></div>
	{:else}
		{@const s = summary.data}
		<article class="mx-auto max-w-2xl bg-white px-10 py-10 text-gray-800 shadow-sm ring-1 ring-gray-200 print:max-w-none print:px-0 print:shadow-none print:ring-0 sm:rounded-2xl">
			<header class="flex items-start justify-between gap-6 border-b border-gray-200 pb-6">
				<div class="flex items-center gap-3">
					<span class="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent"><Pill size={26} /></span>
					<div>
						<h1 class="text-xl font-bold tracking-tight text-gray-900">Saydalah Pharmacy</h1>
						{#if branchInfo}<p class="text-sm text-gray-500">{branchInfo.name}</p>{/if}
					</div>
				</div>
				<div class="text-right">
					<h2 class="text-xl font-bold tracking-tight text-gray-900">DAY-END REPORT</h2>
					<p class="text-xs text-gray-400">{fmtLongDate(new Date(`${date}T00:00:00`))}</p>
				</div>
			</header>

			<!-- Totals -->
			<dl class="space-y-2 py-6 text-sm">
				<div class="flex justify-between text-gray-500"><dt>Sales count</dt><dd class="font-mono tabular-nums text-gray-800">{s.sale_count}</dd></div>
				<div class="flex justify-between text-gray-500"><dt>Gross (subtotal)</dt><dd class="font-mono tabular-nums">{fmtMoney(s.subtotal_total)}</dd></div>
				<div class="flex justify-between text-gray-500"><dt>Discounts</dt><dd class="font-mono tabular-nums">−{fmtMoney(s.discount_total)}</dd></div>
				<div class="flex justify-between text-gray-500"><dt>Tax collected</dt><dd class="font-mono tabular-nums">{fmtMoney(s.tax_total)}</dd></div>
				<div class="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900"><dt>Net takings</dt><dd class="font-mono tabular-nums">{fmtMoney(s.revenue)}</dd></div>
			</dl>

			<!-- Payment breakdown -->
			<div class="border-t border-gray-200 pt-6">
				<h3 class="mb-3 text-xs font-medium tracking-wide text-gray-400 uppercase">By payment method</h3>
				{#if byPayment.data && byPayment.data.items.length > 0}
					<table class="w-full text-sm">
						<tbody>
							{#each byPayment.data.items as p (p.payment_method)}
								{@const PI = payIcon[p.payment_method] ?? Banknote}
								<tr class="border-b border-gray-100">
									<td class="py-2"><span class="inline-flex items-center gap-2 capitalize text-gray-700"><PI size={15} class="text-gray-400" />{p.payment_method}</span></td>
									<td class="py-2 text-right text-gray-400">{p.sale_count} sale{p.sale_count === 1 ? '' : 's'}</td>
									<td class="py-2 text-right font-mono tabular-nums text-gray-900">{fmtMoney(p.revenue)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="text-sm text-gray-400">No sales on this day.</p>
				{/if}
			</div>

			<div class="mt-16 flex items-end justify-between">
				<div class="text-xs text-gray-400">Generated {fmtLongDate(new Date(`${date}T00:00:00`))}</div>
				<div class="text-center">
					<div class="h-px w-48 bg-gray-300"></div>
					<div class="mt-1 text-xs text-gray-500">Manager signature</div>
				</div>
			</div>
		</article>
	{/if}
</div>
