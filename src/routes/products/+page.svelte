<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Plus, X, Pencil } from '@lucide/svelte';
	import {
		listProducts,
		listCategories,
		createProduct,
		updateProduct,
		type ProductInput
	} from '$lib/api/products';
	import type { Product } from '$lib/types';
	import { validate, productSchema } from '$lib/validation';
	import { productIcon } from '$lib/productIcon';
	import { urlParam, setParams } from '$lib/url';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Combobox from '$lib/components/ui/Combobox.svelte';

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

	// --- create / edit form ---
	const blank = () => ({
		name: '',
		generic_name: '',
		form: '',
		strength: '',
		barcode: '',
		category: '',
		unit: 'unit',
		reorder_level: 0,
		active: true
	});
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let form = $state(blank());
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state<string | null>(null);

	function openCreate() {
		editingId = null;
		form = blank();
		fieldErrors = {};
		formError = null;
		showForm = true;
	}
	function openEdit(p: Product) {
		editingId = p.id;
		form = {
			name: p.name,
			generic_name: p.generic_name,
			form: p.form,
			strength: p.strength,
			barcode: p.barcode ?? '',
			category: p.category,
			unit: p.unit,
			reorder_level: p.reorder_level,
			active: p.active
		};
		fieldErrors = {};
		formError = null;
		showForm = true;
	}

	const save = createMutation(() => ({
		mutationFn: (v: { id: string | null; input: ProductInput & { active: boolean } }) =>
			v.id ? updateProduct(v.id, v.input) : createProduct(v.input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			queryClient.invalidateQueries({ queryKey: ['categories'] });
			showForm = false;
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
		save.mutate({ id: editingId, input: { ...form, barcode: form.barcode || null } });
	}

	function clearFilters() {
		searchInput = '';
		setParams({ q: null, category: null, active: null, page: null });
	}

	const categoryOptions = $derived([
		{ value: '', label: 'All categories' },
		...(categories.data?.items ?? []).map((c) => ({ value: c, label: c }))
	]);
	const statusOptions = [
		{ value: '', label: 'Any status' },
		{ value: 'true', label: 'Active' },
		{ value: 'false', label: 'Inactive' }
	];
</script>

<svelte:head><title>Products — Saydalah</title></svelte:head>

<PageHeader title="Products" subtitle="Shared drug catalog across all branches.">
	{#snippet actions()}
		<Button onclick={openCreate}>
			<Plus size={16} /> New product
		</Button>
	{/snippet}
</PageHeader>

<Modal bind:open={showForm} title={editingId ? 'Edit product' : 'New product'}>
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

		{#if editingId}
			<label class="flex items-center gap-2 text-sm text-fg-soft sm:col-span-2">
				<input type="checkbox" bind:checked={form.active} class="h-4 w-4 accent-[var(--color-accent)]" />
				Active
			</label>
		{/if}

		{#if formError}<p class="text-sm text-red-500 sm:col-span-2">{formError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2 sm:col-span-2">
			<Button variant="secondary" onclick={() => (showForm = false)}>Cancel</Button>
			<Button type="submit" disabled={save.isPending}>
				{save.isPending ? 'Saving…' : 'Save product'}
			</Button>
		</div>
	</form>
</Modal>

<!-- Filter bar -->
<div class="mt-4 flex flex-wrap items-center gap-2">
	<div class="min-w-56 flex-1">
		<SearchInput bind:value={searchInput} placeholder="Search by name, generic, or barcode…" />
	</div>
	<div class="w-48">
		<Combobox
			value={category}
			options={categoryOptions}
			onchange={(v) => setParams({ category: v || null, page: null })}
		/>
	</div>
	<div class="w-40">
		<Combobox
			value={active}
			search={false}
			options={statusOptions}
			onchange={(v) => setParams({ active: v || null, page: null })}
		/>
	</div>
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
		<TableSkeleton cols={5} />
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
						<th class="px-4 py-2.5"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-2">
					{#each query.data.items as p (p.id)}
						{@const fi = productIcon(p.form)}
						{@const Icon = fi.icon}
						<tr class="group hover:bg-surface-2/30">
							<td class="px-4 py-2.5">
								<div class="flex items-center gap-3">
									<span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 {fi.tint}">
										<Icon size={17} />
									</span>
									<div>
										<div class="flex items-center gap-2">
											<a href="/products/{p.id}" class="font-medium text-fg transition hover:text-accent hover:underline">{p.name}</a>
											{#if !p.active}<span class="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">Inactive</span>{/if}
										</div>
										{#if p.generic_name}<div class="text-xs text-muted">{p.generic_name}</div>{/if}
									</div>
								</div>
							</td>
							<td class="px-4 py-2.5 text-fg-soft"
								>{[p.form, p.strength].filter(Boolean).join(' · ') || '—'}</td
							>
							<td class="px-4 py-2.5 text-fg-soft">{p.category || '—'}</td>
							<td class="px-4 py-2.5 font-mono text-xs text-muted">{p.barcode ?? '—'}</td>
							<td class="px-4 py-2.5 text-right tabular-nums text-fg-soft">{p.reorder_level}</td>
							<td class="px-4 py-2.5 text-right">
								<button
									onclick={() => openEdit(p)}
									class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:bg-surface-2 hover:text-fg"
								>
									<Pencil size={13} /> Edit
								</button>
							</td>
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
