<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { Printer, ArrowLeft, Pill } from '@lucide/svelte';
	import { getPrescription } from '$lib/api/prescriptions';
	import { getCustomer } from '$lib/api/customers';
	import { listBranches } from '$lib/api/branches';
	import { listProducts } from '$lib/api/products';
	import { fmtLongDate, fmtDate } from '$lib/format';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';

	const id = $derived(page.params.id ?? '');

	const rx = createQuery(() => ({ queryKey: ['prescription', id], queryFn: () => getPrescription(id) }));
	const customerId = $derived(rx.data?.customer_id ?? '');
	const customer = createQuery(() => ({
		queryKey: ['customer', customerId],
		queryFn: () => getCustomer(customerId),
		enabled: Boolean(customerId)
	}));
	const branches = createQuery(() => ({ queryKey: ['branches'], queryFn: listBranches }));
	const products = createQuery(() => ({ queryKey: ['products-all'], queryFn: () => listProducts({ page: 1 }) }));

	const branch = $derived(branches.data?.items.find((b) => b.id === rx.data?.branch_id));
	function product(pid: string) {
		return products.data?.items.find((p) => p.id === pid);
	}
</script>

<svelte:head><title>Prescription — Saydalah</title></svelte:head>

<div class="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
	<div class="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
		<a
			href="/prescriptions/{id}"
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

	{#if rx.isPending}
		<div class="py-24"><Spinner label="Loading prescription…" /></div>
	{:else if rx.isError}
		<div class="mx-auto max-w-3xl px-4"><ErrorState message={rx.error.message} onRetry={() => rx.refetch()} /></div>
	{:else}
		{@const p = rx.data}
		<article
			class="mx-auto max-w-3xl bg-white px-10 py-10 text-gray-800 shadow-sm ring-1 ring-gray-200 print:max-w-none print:px-0 print:shadow-none print:ring-0 sm:rounded-2xl"
		>
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
					<h2 class="text-xl font-bold tracking-tight text-gray-900">PRESCRIPTION</h2>
					<p class="mt-1 font-mono text-xs text-gray-500">#{p.id.slice(0, 8).toUpperCase()}</p>
					<p class="text-xs text-gray-400">{fmtLongDate(new Date(p.created_at))}</p>
				</div>
			</header>

			<div class="grid grid-cols-2 gap-6 py-6 text-sm">
				<div>
					<div class="text-xs tracking-wide text-gray-400 uppercase">Patient</div>
					<div class="mt-0.5 font-medium text-gray-800">{customer.data?.name ?? '—'}</div>
					{#if customer.data?.phone}<div class="text-gray-500">{customer.data.phone}</div>{/if}
				</div>
				<div>
					<div class="text-xs tracking-wide text-gray-400 uppercase">Prescribed by</div>
					<div class="mt-0.5 font-medium text-gray-800">{p.doctor_name || '—'}</div>
					<div class="text-gray-500">{p.dispensed_at ? `Dispensed ${fmtDate(p.dispensed_at)}` : 'Not yet dispensed'}</div>
				</div>
			</div>

			<table class="w-full text-sm">
				<thead>
					<tr class="border-b-2 border-gray-200 text-left text-xs tracking-wide text-gray-400 uppercase">
						<th class="py-2 font-medium">℞ Medication</th>
						<th class="py-2 font-medium">Dosage / Sig</th>
						<th class="py-2 text-right font-medium">Qty</th>
					</tr>
				</thead>
				<tbody>
					{#each p.items ?? [] as it (it.product_id)}
						{@const pr = product(it.product_id)}
						<tr class="border-b border-gray-100">
							<td class="py-3">
								<div class="font-medium text-gray-900">{pr?.name ?? it.product_id.slice(0, 8)}</div>
								{#if pr?.strength}<div class="text-xs text-gray-400">{pr.form} · {pr.strength}</div>{/if}
							</td>
							<td class="py-3 text-gray-700">{it.dosage || '—'}</td>
							<td class="py-3 text-right tabular-nums">{it.qty}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			{#if p.notes}
				<div class="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
					<span class="font-medium text-gray-700">Notes:</span> {p.notes}
				</div>
			{/if}

			<div class="mt-16 flex items-end justify-between">
				<div class="text-xs text-gray-400">Dispensed earliest-expiry first · computer-generated slip</div>
				<div class="text-center">
					<div class="h-px w-48 bg-gray-300"></div>
					<div class="mt-1 text-xs text-gray-500">Pharmacist signature</div>
				</div>
			</div>
		</article>
	{/if}
</div>
