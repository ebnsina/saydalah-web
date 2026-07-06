<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Plus, Trash2, PillBottle } from '@lucide/svelte';
	import {
		listPrescriptions,
		createPrescription,
		dispensePrescription
	} from '$lib/api/prescriptions';
	import { listCustomers } from '$lib/api/customers';
	import { listProducts } from '$lib/api/products';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtDate } from '$lib/format';
	import type { Prescription, PaymentMethod } from '$lib/types';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';

	const qc = useQueryClient();
	const branchReady = $derived(Boolean(branch.id));

	const list = createQuery(() => ({
		queryKey: ['prescriptions', branch.id],
		queryFn: () => listPrescriptions(branch.id),
		enabled: Boolean(branch.id)
	}));
	const customers = createQuery(() => ({ queryKey: ['customers', '', 1], queryFn: () => listCustomers({}) }));
	const products = createQuery(() => ({ queryKey: ['products', '', 1], queryFn: () => listProducts({}) }));

	function customerName(id: string): string {
		return customers.data?.items.find((c) => c.id === id)?.name ?? '—';
	}

	const field =
		'rounded-full border border-surface-2 bg-surface px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none';

	// --- create ---
	let showCreate = $state(false);
	let customerId = $state('');
	let doctorName = $state('');
	let items = $state<{ product_id: string; qty: number; dosage: string }[]>([
		{ product_id: '', qty: 1, dosage: '' }
	]);
	let createError = $state<string | null>(null);

	const create = createMutation(() => ({
		mutationFn: createPrescription,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['prescriptions'] });
			showCreate = false;
			customerId = '';
			doctorName = '';
			items = [{ product_id: '', qty: 1, dosage: '' }];
			createError = null;
		},
		onError: (e: Error) => (createError = e.message)
	}));

	function submitCreate() {
		createError = null;
		const valid = items.filter((i) => i.product_id && i.qty > 0);
		if (!customerId) return (createError = 'Choose a customer');
		if (valid.length === 0) return (createError = 'Add at least one item');
		create.mutate({ branch_id: branch.id, customer_id: customerId, doctor_name: doctorName, items: valid });
	}

	// --- dispense ---
	let dispenseOpen = $state(false);
	let dispensing = $state<Prescription | null>(null);
	let paymentMethod = $state<PaymentMethod>('cash');
	let dispenseError = $state<string | null>(null);

	function openDispense(p: Prescription) {
		dispensing = p;
		paymentMethod = 'cash';
		dispenseError = null;
		dispenseOpen = true;
	}

	const dispense = createMutation(() => ({
		mutationFn: (v: { id: string; payment_method: PaymentMethod }) =>
			dispensePrescription(v.id, { payment_method: v.payment_method }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['prescriptions'] });
			qc.invalidateQueries({ queryKey: ['batches'] });
			dispenseOpen = false;
		},
		onError: (e: Error) => (dispenseError = e.message)
	}));
</script>

<svelte:head><title>Prescriptions — Saydalah</title></svelte:head>

<PageHeader title="Prescriptions" subtitle="Record prescriptions and dispense them (FEFO).">
	{#snippet actions()}
		<BranchSelect />
		<Button onclick={() => (showCreate = true)}><Plus size={16} /> New prescription</Button>
	{/snippet}
</PageHeader>

<div class="mt-6">
	{#if !branchReady}
		<Spinner label="Selecting branch…" />
	{:else if list.isPending}
		<TableSkeleton cols={6} />
	{:else if list.isError}
		<ErrorState message={list.error.message} onRetry={() => list.refetch()} />
	{:else if list.data.items.length === 0}
		<EmptyState title="No prescriptions" description="Record one to dispense." />
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-surface-2">
			<table class="w-full text-sm">
				<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
					<tr>
						<th class="px-4 py-2.5 font-medium">Customer</th>
						<th class="px-4 py-2.5 font-medium">Doctor</th>
						<th class="px-4 py-2.5 text-right font-medium">Items</th>
						<th class="px-4 py-2.5 font-medium">Created</th>
						<th class="px-4 py-2.5 font-medium">Status</th>
						<th class="px-4 py-2.5"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-2">
					{#each list.data.items as p (p.id)}
						<tr class="hover:bg-surface-2/30">
							<td class="px-4 py-2.5 font-medium text-fg">{customerName(p.customer_id)}</td>
							<td class="px-4 py-2.5 text-fg-soft">{p.doctor_name || '—'}</td>
							<td class="px-4 py-2.5 text-right tabular-nums text-fg-soft">{p.items?.length ?? 0}</td>
							<td class="px-4 py-2.5 text-muted">{fmtDate(p.created_at)}</td>
							<td class="px-4 py-2.5">
								{#if p.dispensed_at}
									<span class="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">Dispensed</span>
								{:else}
									<span class="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">Pending</span>
								{/if}
							</td>
							<td class="px-4 py-2.5 text-right">
								{#if !p.dispensed_at}
									<button
										onclick={() => openDispense(p)}
										class="inline-flex items-center gap-1 rounded-full border border-surface-2 px-3 py-1 text-xs text-fg-soft transition hover:bg-surface-2"
									>
										<PillBottle size={13} /> Dispense
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

<!-- Create -->
<Modal bind:open={showCreate} title="New prescription">
	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Customer</span>
			<select bind:value={customerId} class={field}>
				<option value="" disabled>Choose a customer…</option>
				{#each customers.data?.items ?? [] as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Doctor</span>
			<input bind:value={doctorName} placeholder="Dr. …" class={field} />
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
					<input bind:value={item.dosage} placeholder="dosage" class="{field} w-28" title="Dosage" />
					<button onclick={() => (items = items.filter((_, j) => j !== i))} class="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-red-500"><Trash2 size={14} /></button>
				</div>
			{/each}
			<button onclick={() => (items = [...items, { product_id: '', qty: 1, dosage: '' }])} class="self-start text-xs text-accent hover:underline">+ Add item</button>
		</div>

		{#if createError}<p class="text-sm text-red-500">{createError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (showCreate = false)}>Cancel</Button>
			<Button onclick={submitCreate} disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Save'}</Button>
		</div>
	</div>
</Modal>

<!-- Dispense -->
<Modal bind:open={dispenseOpen} title="Dispense prescription">
	{#if dispensing}
		<div class="flex flex-col gap-3">
			<p class="text-sm text-muted">Fill {(dispensing.items?.length ?? 0)} item(s) for {customerName(dispensing.customer_id)}. Stock is drawn FEFO.</p>
			<label class="flex items-center justify-between text-sm">
				<span class="text-muted">Payment</span>
				<select bind:value={paymentMethod} class={field}>
					<option value="cash">Cash</option>
					<option value="card">Card</option>
					<option value="mobile">Mobile</option>
				</select>
			</label>
			{#if dispenseError}<p class="text-sm text-red-500">{dispenseError}</p>{/if}
			<div class="mt-1 flex justify-end gap-2">
				<Button variant="secondary" onclick={() => (dispenseOpen = false)}>Cancel</Button>
				<Button onclick={() => dispensing && dispense.mutate({ id: dispensing.id, payment_method: paymentMethod })} disabled={dispense.isPending}>
					{dispense.isPending ? 'Dispensing…' : 'Dispense'}
				</Button>
			</div>
		</div>
	{/if}
</Modal>
