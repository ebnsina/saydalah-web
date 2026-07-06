<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Plus, X } from '@lucide/svelte';
	import {
		listProducts,
		listCategories,
		createProduct,
		type ProductInput
	} from '$lib/api/products';
	import { validate, productSchema } from '$lib/validation';
	import { urlParam, setParams } from '$lib/url';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	const queryClient = useQueryClient();

	// Filter state lives in the URL (shareable, survives refresh).
	const q = $derived(urlParam('q'));
	const category = $derived(urlParam('category'));
	const active = $derived(urlParam('active'));
	const page = $derived(Number(urlParam('page')) || 1);
	const hasFilters = $derived(Boolean(q || category || active));

	// Local search box, debounced into the URL.
	let searchInput = $state(urlParam('q'));
	$effect(() => {
		const term = searchInput;
		const t = setTimeout(() => {
			if (term !== urlParam('q')) setParams({ q: term || null, page: null });
		}, 300);
		return () => clearTimeout(t);
	});

	const categories = createQuery(() => ({ queryKey: ['categories'], queryFn: listCategories }));

	const query = createQuery(() => ({
		queryKey: ['products', q, category, active, page],
		queryFn: () => listProducts({ search: q, category, active, page })
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
			queryClient.invalidateQueries({ queryKey: ['categories'] });
			showForm = false;
			form = blank();
			formError = null;
		},
		onError: (err: Error) => {
			formError = err.message;
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

	function clearFilters() {
		searchInput = '';
		setParams({ q: null, category: null, active: null, page: null });
	}

	const filterSelect =
		'rounded-full border border-surface-2 bg-surface px-4 py-2 text-sm text-fg focus:border-accent focus:outline-none';
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
			<Button variant="secondary" onclick={() => (showForm = false)}>Cancel</Button>
			<Button type="submit" disabled={create.isPending}>
				{create.isPending ? 'Saving…' : 'Save product'}
			</Button>
		</div>
	</form>
</Modal>

<!-- Filter bar -->
<div class="mt-4 flex flex-wrap items-center gap-2">
	<div class="min-w-56 flex-1">
		<SearchInput bind:value={searchInput} placeholder="Search by name, generic, or barcode…" />
	</div>
	<select
		value={category}
		onchange={(e) => setParams({ category: e.currentTarget.value || null, page: null })}
		class={filterSelect}
	>
		<option value="">All categories</option>
		{#each categories.data?.items ?? [] as c (c)}<option value={c}>{c}</option>{/each}
	</select>
	<select
		value={active}
		onchange={(e) => setParams({ active: e.currentTarget.value || null, page: null })}
		class={filterSelect}
	>
		<option value="">Any status</option>
		<option value="true">Active</option>
		<option value="false">Inactive</option>
	</select>
	{#if hasFilters}
		<button
			onclick={clearFilters}
			class="inline-flex items-center gap-1 rounded-full border border-surface-2 px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
		>
			<X size={14} /> Clear
		</button>
	{/if}
</div>

<div class="mt-4">
	{#if query.isPending}
		<Spinner label="Loading products…" />
	{:else if query.isError}
		<ErrorState message={query.error.message} onRetry={() => query.refetch()} />
	{:else if query.data.items.length === 0}
		<EmptyState
			title="No products found"
			description={hasFilters ? 'Try adjusting your filters.' : 'Add your first product.'}
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
							<td class="px-4 py-2.5 text-right tabular-nums text-fg-soft">{p.reorder_level}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-3 flex items-center justify-between text-sm text-muted">
			<span>{query.data.total} products</span>
			<div class="flex items-center gap-2">
				<button
					onclick={() => setParams({ page: Math.max(1, page - 1) })}
					disabled={page <= 1}
					class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40"
				>Prev</button>
				<span>Page {query.data.page}</span>
				<button
					onclick={() => setParams({ page: page + 1 })}
					disabled={query.data.page * query.data.page_size >= query.data.total}
					class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40"
				>Next</button>
			</div>
		</div>
	{/if}
</div>
