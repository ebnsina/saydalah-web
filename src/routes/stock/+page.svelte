<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { SlidersHorizontal, ArrowLeftRight } from '@lucide/svelte';
	import { listMovements, adjustStock, transferStock } from '$lib/api/stock';
	import { listBatches } from '$lib/api/inventory';
	import { listBranches } from '$lib/api/branches';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtDate } from '$lib/format';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';

	const qc = useQueryClient();
	const branchReady = $derived(Boolean(branch.id));

	const movements = createQuery(() => ({
		queryKey: ['movements', branch.id],
		queryFn: () => listMovements(branch.id),
		enabled: branchReady
	}));
	const batches = createQuery(() => ({
		queryKey: ['batches', branch.id, 1],
		queryFn: () => listBatches(branch.id, 1),
		enabled: branchReady
	}));
	const branches = createQuery(() => ({ queryKey: ['branches'], queryFn: listBranches }));

	function invalidate() {
		qc.invalidateQueries({ queryKey: ['movements'] });
		qc.invalidateQueries({ queryKey: ['batches'] });
		qc.invalidateQueries({ queryKey: ['low-stock'] });
	}

	const typeTone: Record<string, string> = {
		purchase: 'text-emerald-500',
		sale: 'text-red-500',
		adjustment: 'text-amber-500',
		return: 'text-emerald-500',
		transfer_in: 'text-emerald-500',
		transfer_out: 'text-red-500'
	};

	const field =
		'rounded-full border border-surface-2 bg-surface px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none';

	// --- adjust ---
	let adjustOpen = $state(false);
	let aBatch = $state('');
	let aDelta = $state(0);
	let aNote = $state('');
	let aError = $state<string | null>(null);
	const adjust = createMutation(() => ({
		mutationFn: adjustStock,
		onSuccess: () => {
			invalidate();
			adjustOpen = false;
			aBatch = '';
			aDelta = 0;
			aNote = '';
		},
		onError: (e: Error) => (aError = e.message)
	}));
	function submitAdjust() {
		aError = null;
		if (!aBatch) return (aError = 'Select a batch');
		if (!aDelta) return (aError = 'Enter a non-zero delta');
		adjust.mutate({ batch_id: aBatch, delta: aDelta, note: aNote });
	}

	// --- transfer ---
	let transferOpen = $state(false);
	let tBatch = $state('');
	let tBranch = $state('');
	let tQty = $state(1);
	let tError = $state<string | null>(null);
	const transfer = createMutation(() => ({
		mutationFn: transferStock,
		onSuccess: () => {
			invalidate();
			transferOpen = false;
			tBatch = '';
			tBranch = '';
			tQty = 1;
		},
		onError: (e: Error) => (tError = e.message)
	}));
	function submitTransfer() {
		tError = null;
		if (!tBatch) return (tError = 'Select a batch');
		if (!tBranch) return (tError = 'Select a destination branch');
		if (tQty < 1) return (tError = 'Quantity must be at least 1');
		transfer.mutate({ batch_id: tBatch, to_branch_id: tBranch, qty: tQty });
	}

	const otherBranches = $derived((branches.data?.items ?? []).filter((b) => b.id !== branch.id));
</script>

<svelte:head><title>Stock ops — Saydalah</title></svelte:head>

<PageHeader title="Stock operations" subtitle="Adjustments, transfers, and the movement ledger.">
	{#snippet actions()}
		<BranchSelect />
		<Button variant="secondary" onclick={() => (adjustOpen = true)}><SlidersHorizontal size={16} /> Adjust</Button>
		<Button onclick={() => (transferOpen = true)}><ArrowLeftRight size={16} /> Transfer</Button>
	{/snippet}
</PageHeader>

<div class="mt-6">
	<h2 class="mb-3 font-semibold text-fg">Movement ledger</h2>
	{#if !branchReady}
		<Spinner label="Selecting branch…" />
	{:else if movements.isPending}
		<Spinner label="Loading movements…" />
	{:else if movements.isError}
		<ErrorState message={movements.error.message} onRetry={() => movements.refetch()} />
	{:else if movements.data.items.length === 0}
		<EmptyState title="No movements yet" />
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-surface-2">
			<table class="w-full text-sm">
				<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
					<tr>
						<th class="px-4 py-2.5 font-medium">When</th>
						<th class="px-4 py-2.5 font-medium">Product</th>
						<th class="px-4 py-2.5 font-medium">Type</th>
						<th class="px-4 py-2.5 text-right font-medium">Qty</th>
						<th class="px-4 py-2.5 font-medium">By</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-2">
					{#each movements.data.items as m (m.id)}
						<tr class="hover:bg-surface-2/30">
							<td class="px-4 py-2.5 text-muted">{fmtDate(m.created_at)}</td>
							<td class="px-4 py-2.5 text-fg">{m.product_name}</td>
							<td class="px-4 py-2.5 capitalize {typeTone[m.type] ?? 'text-fg-soft'}">{m.type.replace('_', ' ')}</td>
							<td class="px-4 py-2.5 text-right font-mono tabular-nums {m.qty < 0 ? 'text-red-500' : 'text-emerald-500'}">{m.qty > 0 ? '+' : ''}{m.qty}</td>
							<td class="px-4 py-2.5 text-muted">{m.created_by_name ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Adjust modal -->
<Modal bind:open={adjustOpen} title="Adjust stock">
	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Batch</span>
			<select bind:value={aBatch} class={field}>
				<option value="" disabled>Select a batch…</option>
				{#each batches.data?.items ?? [] as b (b.id)}<option value={b.id}>{b.product_name} · {b.batch_no || 'batch'} ({b.quantity})</option>{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Delta (negative to reduce)</span>
			<input type="number" bind:value={aDelta} class={field} />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Note</span>
			<input bind:value={aNote} placeholder="damaged, recount…" class={field} />
		</label>
		{#if aError}<p class="text-sm text-red-500">{aError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (adjustOpen = false)}>Cancel</Button>
			<Button onclick={submitAdjust} disabled={adjust.isPending}>{adjust.isPending ? 'Saving…' : 'Apply'}</Button>
		</div>
	</div>
</Modal>

<!-- Transfer modal -->
<Modal bind:open={transferOpen} title="Transfer stock">
	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Batch</span>
			<select bind:value={tBatch} class={field}>
				<option value="" disabled>Select a batch…</option>
				{#each batches.data?.items ?? [] as b (b.id)}<option value={b.id}>{b.product_name} · {b.batch_no || 'batch'} ({b.quantity})</option>{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Destination branch</span>
			<select bind:value={tBranch} class={field}>
				<option value="" disabled>Select a branch…</option>
				{#each otherBranches as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Quantity</span>
			<input type="number" min="1" bind:value={tQty} class={field} />
		</label>
		{#if tError}<p class="text-sm text-red-500">{tError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (transferOpen = false)}>Cancel</Button>
			<Button onclick={submitTransfer} disabled={transfer.isPending}>{transfer.isPending ? 'Transferring…' : 'Transfer'}</Button>
		</div>
	</div>
</Modal>
