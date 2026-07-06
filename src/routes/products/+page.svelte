<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Plus } from '@lucide/svelte';
	import { listProducts, createProduct, type ProductInput } from '$lib/api/products';
	import { validate, productSchema } from '$lib/validation';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	const queryClient = useQueryClient();

	let search = $state('');
	let debounced = $state('');
	let page = $state(1);

	// Debounce search input; reset to page 1 on a new term.
	$effect(() => {
		const term = search;
		const t = setTimeout(() => {
			debounced = term;
			page = 1;
		}, 250);
		return () => clearTimeout(t);
	});

	const query = createQuery(() => ({
		queryKey: ['products', debounced, page],
		queryFn: () => listProducts({ search: debounced, page })
	}));

	// --- create form ---
	const blank = () => ({
		name: '',
		generic_name: '',
		form: '',
		strength: '',
		barcode: '',
		category: '',
		unit: 'unit',
		reorder_level: 0
	});
	let showForm = $state(false);
	let form = $state(blank());
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state<string | null>(null);

	const create = createMutation(() => ({
		mutationFn: (input: ProductInput) => createProduct(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			showForm = false;
			form = blank();
			formError = null;
		},
		onError: (err: Error) => {
			formError = err.message; // API's message, verbatim
		}
	}));

	function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = null;

		const result = validate(productSchema, form);
		if (result.errors) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};
		create.mutate({ ...form, barcode: form.barcode || null });
	}
</script>

<svelte:head><title>Products — Saydalah</title></svelte:head>

<PageHeader title="Products" subtitle="Shared drug catalog across all branches.">
	{#snippet actions()}
		<Button onclick={() => (showForm = true)}>
			<Plus size={16} /> New product
		</Button>
	{/snippet}
</PageHeader>

<Modal bind:open={showForm} title="New product">
	<form onsubmit={submit} class="grid gap-3 sm:grid-cols-2">
		<div class="sm:col-span-2">
			<TextInput label="Name" bind:value={form.name} error={fieldErrors.name} />
		</div>
		<TextInput label="Generic name" bind:value={form.generic_name} />
		<TextInput label="Category" bind:value={form.category} />
		<TextInput label="Form" bind:value={form.form} placeholder="tablet, syrup…" />
		<TextInput label="Strength" bind:value={form.strength} placeholder="500mg" />
		<TextInput label="Barcode" bind:value={form.barcode} mono />
		<TextInput
			label="Reorder level"
			type="number"
			min={0}
			bind:value={form.reorder_level}
			error={fieldErrors.reorder_level}
		/>

		{#if formError}<p class="text-sm text-red-500 sm:col-span-2">{formError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2 sm:col-span-2">
			<Button type="submit" disabled={create.isPending}>
				{create.isPending ? 'Saving…' : 'Save product'}
			</Button>
			<Button variant="secondary" onclick={() => (showForm = false)}>Cancel</Button>
		</div>
	</form>
</Modal>

<div class="mt-4">
	<SearchInput bind:value={search} placeholder="Search by name, generic, or barcode…" />
</div>

<div class="mt-4">
	{#if query.isPending}
		<Spinner label="Loading products…" />
	{:else if query.isError}
		<ErrorState message={query.error.message} onRetry={() => query.refetch()} />
	{:else if query.data.items.length === 0}
		<EmptyState
			title="No products found"
			description={debounced ? 'Try a different search.' : 'Add your first product.'}
		/>
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-surface-2">
			<table class="w-full text-sm">
				<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
					<tr>
						<th class="px-4 py-2.5 font-medium">Name</th>
						<th class="px-4 py-2.5 font-medium">Form / Strength</th>
						<th class="px-4 py-2.5 font-medium">Category</th>
						<th class="px-4 py-2.5 font-medium">Barcode</th>
						<th class="px-4 py-2.5 text-right font-medium">Reorder</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-2">
					{#each query.data.items as p (p.id)}
						<tr class="hover:bg-surface-2/30">
							<td class="px-4 py-2.5">
								<div class="font-medium text-fg">{p.name}</div>
								{#if p.generic_name}<div class="text-xs text-muted">{p.generic_name}</div>{/if}
							</td>
							<td class="px-4 py-2.5 text-fg-soft"
								>{[p.form, p.strength].filter(Boolean).join(' · ') || '—'}</td
							>
							<td class="px-4 py-2.5 text-fg-soft">{p.category || '—'}</td>
							<td class="px-4 py-2.5 font-mono text-xs text-muted">{p.barcode ?? '—'}</td>
							<td class="px-4 py-2.5 text-right text-fg-soft">{p.reorder_level}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-3 flex items-center justify-between text-sm text-muted">
			<span>{query.data.total} products</span>
			<div class="flex items-center gap-2">
				<button
					onclick={() => (page = Math.max(1, page - 1))}
					disabled={page <= 1}
					class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40"
				>Prev</button>
				<span>Page {query.data.page}</span>
				<button
					onclick={() => (page = page + 1)}
					disabled={query.data.page * query.data.page_size >= query.data.total}
					class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40"
				>Next</button>
			</div>
		</div>
	{/if}
</div>
