<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { SlidersHorizontal, ArrowLeftRight, Undo2, ClipboardCheck, Trash2, PackageX, ChevronDown } from '@lucide/svelte';
	import { listMovements, adjustStock, transferStock, returnStock, stockTake, purchaseReturn } from '$lib/api/stock';
	import { listBatches } from '$lib/api/inventory';
	import { listBranches } from '$lib/api/branches';
	import { branch } from '$lib/stores/branch.svelte';
	import { fmtDate } from '$lib/format';
	import { movementIcon } from '$lib/movementIcon';
	import { productIcon } from '$lib/productIcon';
	import BranchSelect from '$lib/components/BranchSelect.svelte';
	import Combobox from '$lib/components/ui/Combobox.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';

	const qc = useQueryClient();
	const branchReady = $derived(Boolean(branch.id));

	let page = $state(1);
	const movements = createQuery(() => ({
		queryKey: ['movements', branch.id, page],
		queryFn: () => listMovements(branch.id, { page }),
		enabled: Boolean(branch.id)
	}));
	const batches = createQuery(() => ({
		queryKey: ['batches', branch.id, 1],
		queryFn: () => listBatches(branch.id, 1),
		enabled: Boolean(branch.id)
	}));
	const branches = createQuery(() => ({ queryKey: ['branches'], queryFn: listBranches }));

	function invalidate() {
		qc.invalidateQueries({ queryKey: ['movements'] });
		qc.invalidateQueries({ queryKey: ['batches'] });
		qc.invalidateQueries({ queryKey: ['low-stock'] });
	}


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

	const batchOptions = $derived(
		(batches.data?.items ?? []).map((b) => {
			const fi = productIcon(b.product_form);
			return {
				value: b.id,
				label: b.product_name,
				sublabel: `${b.batch_no || 'batch'} · ${b.quantity}`,
				icon: fi.icon,
				tint: fi.tint
			};
		})
	);
	const branchOptions = $derived(otherBranches.map((b) => ({ value: b.id, label: b.name })));

	// --- return ---
	let returnOpen = $state(false);
	let rBatch = $state('');
	let rQty = $state(1);
	let rNote = $state('');
	let rError = $state<string | null>(null);
	const returnMut = createMutation(() => ({
		mutationFn: returnStock,
		onSuccess: () => {
			invalidate();
			returnOpen = false;
			rBatch = '';
			rQty = 1;
			rNote = '';
		},
		onError: (e: Error) => (rError = e.message)
	}));
	function submitReturn() {
		rError = null;
		if (!rBatch) return (rError = 'Select a batch');
		if (rQty < 1) return (rError = 'Quantity must be at least 1');
		returnMut.mutate({ batch_id: rBatch, qty: rQty, note: rNote });
	}

	// --- stock-take ---
	let takeOpen = $state(false);
	let takeLines = $state<{ batch_id: string; counted_qty: number }[]>([{ batch_id: '', counted_qty: 0 }]);
	let takeError = $state<string | null>(null);
	const take = createMutation(() => ({
		mutationFn: stockTake,
		onSuccess: () => {
			invalidate();
			takeOpen = false;
			takeLines = [{ batch_id: '', counted_qty: 0 }];
		},
		onError: (e: Error) => (takeError = e.message)
	}));
	function submitTake() {
		takeError = null;
		const valid = takeLines.filter((l) => l.batch_id);
		if (valid.length === 0) return (takeError = 'Add at least one counted batch');
		take.mutate({ branch_id: branch.id, lines: valid });
	}

	// --- purchase return (to supplier) ---
	let prOpen = $state(false);
	let prBatch = $state('');
	let prQty = $state(1);
	let prNote = $state('');
	let prError = $state<string | null>(null);
	const prMut = createMutation(() => ({
		mutationFn: purchaseReturn,
		onSuccess: () => {
			invalidate();
			prOpen = false;
			prBatch = '';
			prQty = 1;
			prNote = '';
		},
		onError: (e: Error) => (prError = e.message)
	}));
	function submitPurchaseReturn() {
		prError = null;
		if (!prBatch) return (prError = 'Select a batch');
		if (prQty < 1) return (prError = 'Quantity must be at least 1');
		prMut.mutate({ batch_id: prBatch, qty: prQty, note: prNote });
	}

	// --- actions menu ---
	let menuOpen = $state(false);
	let menuRoot = $state<HTMLDivElement>();
	const actionItems = [
		{ label: 'Adjust stock', desc: 'Correct a batch quantity (±)', icon: SlidersHorizontal, open: () => (adjustOpen = true) },
		{ label: 'Transfer', desc: 'Move stock to another branch', icon: ArrowLeftRight, open: () => (transferOpen = true) },
		{ label: 'Customer return', desc: 'Return sold stock back into inventory', icon: Undo2, open: () => (returnOpen = true) },
		{ label: 'Return to supplier', desc: 'Send damaged or recalled stock back', icon: PackageX, open: () => (prOpen = true) },
		{ label: 'Stock-take', desc: 'Reconcile physically counted quantities', icon: ClipboardCheck, open: () => (takeOpen = true) }
	];
	$effect(() => {
		if (!menuOpen) return;
		function onClick(e: MouseEvent) {
			if (menuRoot && !menuRoot.contains(e.target as Node)) menuOpen = false;
		}
		document.addEventListener('click', onClick, true);
		return () => document.removeEventListener('click', onClick, true);
	});
</script>

<svelte:head><title>Stock ops — Saydalah</title></svelte:head>

<PageHeader title="Stock operations" subtitle="Adjustments, transfers, and the movement ledger.">
	{#snippet actions()}
		<div class="relative" bind:this={menuRoot}>
			<Button onclick={() => (menuOpen = !menuOpen)}>
				Actions <ChevronDown size={15} class="transition {menuOpen ? 'rotate-180' : ''}" />
			</Button>
			{#if menuOpen}
				<div class="absolute right-0 z-20 mt-1.5 w-72 overflow-hidden rounded-2xl border border-surface-2 bg-surface p-1.5 shadow-lg">
					{#each actionItems as a (a.label)}
						{@const AIcon = a.icon}
						<button
							type="button"
							onclick={() => {
								a.open();
								menuOpen = false;
							}}
							class="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-surface-2/60"
						>
							<span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-accent"><AIcon size={16} /></span>
							<span class="min-w-0">
								<span class="block text-sm font-medium text-fg">{a.label}</span>
								<span class="block text-xs text-muted">{a.desc}</span>
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<BranchSelect />
	{/snippet}
</PageHeader>

<div class="mt-6">
	<h2 class="mb-3 font-semibold text-fg">Movement ledger</h2>
	{#if !branchReady}
		<Spinner label="Selecting branch…" />
	{:else if movements.isPending}
		<TableSkeleton cols={5} />
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
						{@const mi = movementIcon(m.type)}
						{@const Icon = mi.icon}
						<tr class="hover:bg-surface-2/30">
							<td class="px-4 py-2.5 text-muted">{fmtDate(m.created_at)}</td>
							<td class="px-4 py-2.5 text-fg">{m.product_name}</td>
							<td class="px-4 py-2.5">
								<span class="inline-flex items-center gap-1.5 capitalize {mi.tint}">
									<Icon size={15} />{m.type.replace('_', ' ')}
								</span>
							</td>
							<td class="px-4 py-2.5 text-right font-mono tabular-nums {m.qty < 0 ? 'text-red-500' : 'text-emerald-500'}">{m.qty > 0 ? '+' : ''}{m.qty}</td>
							<td class="px-4 py-2.5 text-muted">{m.created_by_name ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<Pagination bind:page total={movements.data.total} noun="movements" />
	{/if}
</div>

<!-- Adjust modal -->
<Modal bind:open={adjustOpen} title="Adjust stock">
	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Batch</span>
			<Combobox bind:value={aBatch} options={batchOptions} placeholder="Select a batch…" />
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
			<Combobox bind:value={tBatch} options={batchOptions} placeholder="Select a batch…" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Destination branch</span>
			<Combobox bind:value={tBranch} options={branchOptions} placeholder="Select a destination branch…" />
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

<!-- Return modal -->
<Modal bind:open={returnOpen} title="Return stock">
	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Batch</span>
			<Combobox bind:value={rBatch} options={batchOptions} placeholder="Select a batch…" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Quantity returned</span>
			<input type="number" min="1" bind:value={rQty} class={field} />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Note</span>
			<input bind:value={rNote} placeholder="customer return…" class={field} />
		</label>
		{#if rError}<p class="text-sm text-red-500">{rError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (returnOpen = false)}>Cancel</Button>
			<Button onclick={submitReturn} disabled={returnMut.isPending}>{returnMut.isPending ? 'Saving…' : 'Return'}</Button>
		</div>
	</div>
</Modal>

<!-- Return to supplier modal -->
<Modal bind:open={prOpen} title="Return to supplier">
	<div class="flex flex-col gap-3">
		<p class="text-sm text-muted">Removes stock from a batch (e.g. damaged or recalled goods) and records a purchase-return in the ledger.</p>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Batch</span>
			<Combobox bind:value={prBatch} options={batchOptions} placeholder="Select a batch…" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Quantity returned</span>
			<input type="number" min="1" bind:value={prQty} class={field} />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			<span class="font-medium text-fg-soft">Note</span>
			<input bind:value={prNote} placeholder="damaged, recall…" class={field} />
		</label>
		{#if prError}<p class="text-sm text-red-500">{prError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (prOpen = false)}>Cancel</Button>
			<Button onclick={submitPurchaseReturn} disabled={prMut.isPending}>{prMut.isPending ? 'Saving…' : 'Return to supplier'}</Button>
		</div>
	</div>
</Modal>

<!-- Stock-take modal -->
<Modal bind:open={takeOpen} title="Physical stock-take">
	<div class="flex flex-col gap-3">
		<p class="text-sm text-muted">Record counted quantities; differences are logged as adjustments.</p>
		{#each takeLines as line, i (i)}
			<div class="flex items-center gap-2">
				<div class="min-w-0 flex-1"><Combobox bind:value={line.batch_id} options={batchOptions} placeholder="Select a batch…" /></div>
				<input type="number" min="0" bind:value={line.counted_qty} class="{field} w-24 text-right" title="Counted" />
				<button onclick={() => (takeLines = takeLines.filter((_, j) => j !== i))} class="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-red-500"><Trash2 size={14} /></button>
			</div>
		{/each}
		<button onclick={() => (takeLines = [...takeLines, { batch_id: '', counted_qty: 0 }])} class="self-start text-xs text-accent hover:underline">+ Add line</button>
		{#if takeError}<p class="text-sm text-red-500">{takeError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (takeOpen = false)}>Cancel</Button>
			<Button onclick={submitTake} disabled={take.isPending}>{take.isPending ? 'Reconciling…' : 'Reconcile'}</Button>
		</div>
	</div>
</Modal>
