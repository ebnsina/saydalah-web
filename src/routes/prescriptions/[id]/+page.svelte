<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { ArrowLeft, CircleCheck, Clock, User, Stethoscope, PillBottle, Printer } from '@lucide/svelte';
	import { getPrescription, dispensePrescription } from '$lib/api/prescriptions';
	import { getCustomer } from '$lib/api/customers';
	import { listProducts } from '$lib/api/products';
	import { getMeta } from '$lib/api/meta';
	import { productIcon } from '$lib/productIcon';
	import { fmtDate, fmtLongDate } from '$lib/format';
	import type { PaymentMethod } from '$lib/types';
	import { Banknote, CreditCard, Smartphone } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Combobox from '$lib/components/ui/Combobox.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';

	const qc = useQueryClient();
	const id = $derived(page.params.id ?? '');

	const rx = createQuery(() => ({ queryKey: ['prescription', id], queryFn: () => getPrescription(id) }));
	const customerId = $derived(rx.data?.customer_id ?? '');
	const customer = createQuery(() => ({
		queryKey: ['customer', customerId],
		queryFn: () => getCustomer(customerId),
		enabled: Boolean(customerId)
	}));
	const products = createQuery(() => ({ queryKey: ['products-all'], queryFn: () => listProducts({ page: 1 }) }));
	const meta = createQuery(() => ({ queryKey: ['meta'], queryFn: getMeta, staleTime: 300_000 }));

	function product(pid: string) {
		return products.data?.items.find((p) => p.id === pid);
	}

	const paymentOptions = [
		{ value: 'cash', label: 'Cash', icon: Banknote, tint: 'text-emerald-500' },
		{ value: 'card', label: 'Card', icon: CreditCard, tint: 'text-indigo-500' },
		{ value: 'mobile', label: 'Mobile', icon: Smartphone, tint: 'text-sky-500' }
	];
	let paymentMethod = $state('cash');
	let dispenseError = $state<string | null>(null);
	const dispense = createMutation(() => ({
		mutationFn: () => dispensePrescription(id, { payment_method: paymentMethod as PaymentMethod }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['prescription', id] });
			qc.invalidateQueries({ queryKey: ['prescriptions'] });
			qc.invalidateQueries({ queryKey: ['batches'] });
		},
		onError: (e: Error) => (dispenseError = e.message)
	}));
</script>

<svelte:head><title>Prescription — Saydalah</title></svelte:head>

<a href="/prescriptions" class="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg">
	<ArrowLeft size={15} /> Prescriptions
</a>

{#if rx.isPending}
	<div class="mt-6"><Spinner label="Loading prescription…" /></div>
{:else if rx.isError}
	<div class="mt-6"><ErrorState message={rx.error.message} onRetry={() => rx.refetch()} /></div>
{:else}
	{@const p = rx.data}
	<div class="mt-4 flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-semibold tracking-tight text-fg">Prescription</h1>
				{#if p.dispensed_at}
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500"><CircleCheck size={12} />Dispensed</span>
				{:else}
					<span class="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"><Clock size={12} />Pending</span>
				{/if}
			</div>
			<p class="mt-1 font-mono text-xs text-muted">#{p.id.slice(0, 8).toUpperCase()} · {fmtLongDate(new Date(p.created_at))}</p>
		</div>
		<a
			href="/prescription-print/{p.id}"
			class="inline-flex items-center gap-1.5 rounded-full border border-surface-2 px-4 py-2 text-sm font-medium text-fg-soft transition hover:bg-surface-2"
		>
			<Printer size={15} /> Print
		</a>
	</div>

	<div class="mt-6 grid gap-4 sm:grid-cols-2">
		<Card>
			<div class="flex items-center gap-2 text-sm text-muted"><User size={14} /> Customer</div>
			<a href="/customers/{p.customer_id}" class="mt-1 block font-medium text-fg hover:text-accent hover:underline">{customer.data?.name ?? '—'}</a>
			{#if customer.data?.phone}<p class="text-sm text-muted">{customer.data.phone}</p>{/if}
		</Card>
		<Card>
			<div class="flex items-center gap-2 text-sm text-muted"><Stethoscope size={14} /> Prescribing doctor</div>
			<p class="mt-1 font-medium text-fg">{p.doctor_name || '—'}</p>
			{#if p.dispensed_at}<p class="text-sm text-muted">Dispensed {fmtDate(p.dispensed_at)}</p>{/if}
		</Card>
	</div>

	<div class="mt-6">
		<Card>
			<h2 class="mb-4 font-semibold text-fg">Prescribed items</h2>
			<table class="w-full text-sm [&_:where(th,td)]:pr-6 [&_:where(th,td):last-child]:pr-0">
				<thead class="text-left text-xs tracking-wide text-muted uppercase">
					<tr><th class="py-1.5 font-medium">Product</th><th class="py-1.5 font-medium">Dosage</th><th class="py-1.5 text-right font-medium">Qty</th></tr>
				</thead>
				<tbody class="divide-y divide-surface-2">
					{#each p.items ?? [] as it (it.product_id)}
						{@const pr = product(it.product_id)}
						{@const fi = productIcon(pr?.form)}
						{@const Icon = fi.icon}
						<tr>
							<td class="py-2">
								<span class="flex items-center gap-2.5">
									<span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 {fi.tint}"><Icon size={15} /></span>
									<a href="/products/{it.product_id}" class="text-fg hover:text-accent hover:underline">{pr?.name ?? it.product_id.slice(0, 8)}</a>
								</span>
							</td>
							<td class="py-2 text-fg-soft">{it.dosage || '—'}</td>
							<td class="py-2 text-right tabular-nums text-fg-soft">{it.qty}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			{#if !p.dispensed_at}
				<div class="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-surface-2 pt-4">
					{#if dispenseError}<p class="mr-auto text-sm text-red-500">{dispenseError}</p>{/if}
					{#if (meta.data?.tax_rate ?? 0) > 0}<span class="text-xs text-muted">+ {((meta.data?.tax_rate ?? 0) * 100).toFixed(0)}% VAT</span>{/if}
					<div class="w-36"><Combobox bind:value={paymentMethod} search={false} options={paymentOptions} /></div>
					<Button onclick={() => dispense.mutate()} disabled={dispense.isPending}>
						<PillBottle size={15} /> {dispense.isPending ? 'Dispensing…' : 'Dispense (FEFO)'}
					</Button>
				</div>
			{/if}
		</Card>
	</div>
{/if}
