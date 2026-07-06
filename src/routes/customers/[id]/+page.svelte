<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { ArrowLeft, Phone, MapPin, ShoppingCart, ClipboardList, Printer, CircleCheck, Clock, Wallet } from '@lucide/svelte';
	import { getCustomer } from '$lib/api/customers';
	import { listSales, recordPayment } from '$lib/api/sales';
	import { listPrescriptions } from '$lib/api/prescriptions';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtDate, fmtMoney } from '$lib/format';
	import type { Sale } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';

	const qc = useQueryClient();
	const id = $derived(page.params.id ?? '');
	const branchReady = $derived(Boolean(branch.id));

	const customer = createQuery(() => ({ queryKey: ['customer', id], queryFn: () => getCustomer(id) }));
	const sales = createQuery(() => ({
		queryKey: ['customer-sales', id, branch.id],
		queryFn: () => listSales(branch.id, { customerId: id }),
		enabled: branchReady
	}));
	const prescriptions = createQuery(() => ({
		queryKey: ['customer-prescriptions', id, branch.id],
		queryFn: () => listPrescriptions(branch.id, { customerId: id }),
		enabled: branchReady
	}));

	const activeSales = $derived((sales.data?.items ?? []).filter((s) => !s.voided_at));
	const totalSpent = $derived(activeSales.reduce((t, s) => t + Number(s.total), 0));
	const outstanding = $derived(activeSales.reduce((t, s) => t + (Number(s.total) - Number(s.paid)), 0));

	// --- take payment on a due sale ---
	let payOpen = $state(false);
	let paying = $state<Sale | null>(null);
	let payAmount = $state(0);
	let payError = $state<string | null>(null);
	function due(s: Sale) {
		return Number(s.total) - Number(s.paid);
	}
	function openPay(s: Sale) {
		paying = s;
		payAmount = due(s);
		payError = null;
		payOpen = true;
	}
	const pay = createMutation(() => ({
		mutationFn: (v: { id: string; amount: number }) => recordPayment(v.id, v.amount),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['customer-sales'] });
			payOpen = false;
		},
		onError: (e: Error) => (payError = e.message)
	}));
	function submitPay() {
		payError = null;
		if (!paying) return;
		if (payAmount <= 0) return (payError = 'Enter an amount greater than zero');
		if (payAmount > due(paying)) return (payError = 'Amount is more than what they owe');
		pay.mutate({ id: paying.id, amount: payAmount });
	}
</script>

<svelte:head><title>{customer.data?.name ?? 'Customer'} — Saydalah</title></svelte:head>

<a href="/customers" class="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg">
	<ArrowLeft size={15} /> Customers
</a>

{#if customer.isPending}
	<div class="mt-6"><Spinner label="Loading customer…" /></div>
{:else if customer.isError}
	<div class="mt-6"><ErrorState message={customer.error.message} onRetry={() => customer.refetch()} /></div>
{:else}
	{@const c = customer.data}
	<div class="mt-4 flex flex-wrap items-start justify-between gap-4">
		<div class="flex items-center gap-4">
			<span class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface-2 text-xl font-semibold text-fg-soft">
				{c.name.charAt(0).toUpperCase()}
			</span>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-fg">{c.name}</h1>
				<div class="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
					{#if c.phone}<span class="inline-flex items-center gap-1"><Phone size={13} />{c.phone}</span>{/if}
					{#if c.address}<span class="inline-flex items-center gap-1"><MapPin size={13} />{c.address}</span>{/if}
					<span>Since {fmtDate(c.created_at)}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Summary (current branch) -->
	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<StatCard label="Purchases" value={sales.data?.total ?? 0} loading={sales.isPending}>
			{#snippet icon()}<ShoppingCart size={16} />{/snippet}
		</StatCard>
		<StatCard label="Total spent" value={totalSpent} format={fmtMoney} loading={sales.isPending} tone="accent">
			{#snippet icon()}<ShoppingCart size={16} />{/snippet}
		</StatCard>
		<StatCard
			label="Outstanding"
			value={outstanding}
			format={fmtMoney}
			loading={sales.isPending}
			tone={outstanding > 0 ? 'danger' : 'success'}
			hint={outstanding > 0 ? 'owed on account' : 'settled'}
		>
			{#snippet icon()}<Wallet size={16} />{/snippet}
		</StatCard>
		<StatCard label="Prescriptions" value={prescriptions.data?.total ?? 0} loading={prescriptions.isPending}>
			{#snippet icon()}<ClipboardList size={16} />{/snippet}
		</StatCard>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Purchases -->
		<Card>
			<h2 class="mb-4 font-semibold text-fg">Purchase history <span class="text-sm font-normal text-muted">· this branch</span></h2>
			{#if !branchReady || sales.isPending}
				<Spinner />
			{:else if sales.isError}
				<ErrorState message={sales.error.message} onRetry={() => sales.refetch()} />
			{:else if sales.data.items.length === 0}
				<EmptyState title="No purchases" description="No sales for this customer at this branch." />
			{:else}
				<table class="w-full text-sm [&_:where(th,td)]:pr-6 [&_:where(th,td):last-child]:pr-0">
					<thead class="text-left text-xs tracking-wide text-muted uppercase">
						<tr><th class="py-1.5 font-medium">Date</th><th class="py-1.5 text-right font-medium">Total</th><th class="py-1.5 font-medium">Status</th><th class="py-1.5"></th></tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each sales.data.items as s (s.id)}
							<tr class="group">
								<td class="py-2 text-muted">{fmtDate(s.created_at)}</td>
								<td class="py-2 text-right font-mono tabular-nums text-fg">{fmtMoney(s.total)}</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										{#if s.voided_at}
											<span class="text-xs text-red-500">Cancelled</span>
										{:else if due(s) > 0}
											<span class="text-xs font-medium text-amber-500">Owes {fmtMoney(due(s))}</span>
											<button onclick={() => openPay(s)} class="inline-flex items-center gap-1 rounded-full border border-surface-2 px-2.5 py-0.5 text-xs text-fg-soft transition hover:bg-surface-2"><Wallet size={12} /> Take payment</button>
										{:else}
											<span class="text-xs text-emerald-600">Paid</span>
										{/if}
									</div>
								</td>
								<td class="py-2 text-right">
									<a href="/invoice/{s.id}" class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:bg-surface-2 hover:text-fg"><Printer size={12} /> Receipt</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</Card>

		<!-- Prescriptions -->
		<Card>
			<h2 class="mb-4 font-semibold text-fg">Prescription history <span class="text-sm font-normal text-muted">· this branch</span></h2>
			{#if !branchReady || prescriptions.isPending}
				<Spinner />
			{:else if prescriptions.isError}
				<ErrorState message={prescriptions.error.message} onRetry={() => prescriptions.refetch()} />
			{:else if prescriptions.data.items.length === 0}
				<EmptyState title="No prescriptions" description="No prescriptions for this customer here." />
			{:else}
				<table class="w-full text-sm [&_:where(th,td)]:pr-6 [&_:where(th,td):last-child]:pr-0">
					<thead class="text-left text-xs tracking-wide text-muted uppercase">
						<tr><th class="py-1.5 font-medium">Date</th><th class="py-1.5 font-medium">Doctor</th><th class="py-1.5 text-right font-medium">Items</th><th class="py-1.5 font-medium">Status</th></tr>
					</thead>
					<tbody class="divide-y divide-surface-2">
						{#each prescriptions.data.items as p (p.id)}
							<tr>
								<td class="py-2 text-muted">{fmtDate(p.created_at)}</td>
								<td class="py-2 text-fg-soft">{p.doctor_name || '—'}</td>
								<td class="py-2 text-right tabular-nums text-fg-soft">{p.items?.length ?? 0}</td>
								<td class="py-2">
									{#if p.dispensed_at}
										<span class="inline-flex items-center gap-1 text-xs text-emerald-600"><CircleCheck size={12} />Dispensed</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-xs text-accent"><Clock size={12} />Pending</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</Card>
	</div>

	<Modal bind:open={payOpen} title="Take payment">
		{#if paying}
			<form onsubmit={(e) => { e.preventDefault(); submitPay(); }} class="flex flex-col gap-3">
				<p class="text-sm text-muted">This customer owes <span class="font-medium text-amber-500">{fmtMoney(due(paying))}</span> on this sale. Enter how much they're paying now.</p>
				<TextInput label="Amount" type="number" min={0} bind:value={payAmount} />
				{#if payError}<p class="text-sm text-red-500">{payError}</p>{/if}
				<div class="mt-1 flex justify-end gap-2">
					<Button variant="secondary" onclick={() => (payOpen = false)}>Cancel</Button>
					<Button type="submit" disabled={pay.isPending}>{pay.isPending ? 'Saving…' : 'Record payment'}</Button>
				</div>
			</form>
		{/if}
	</Modal>
{/if}
