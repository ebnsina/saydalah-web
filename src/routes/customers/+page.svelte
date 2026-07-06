<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Plus, Pencil } from '@lucide/svelte';
	import { listCustomers, createCustomer, updateCustomer } from '$lib/api/customers';
	import type { Customer } from '$lib/types';
	import { urlParam, setParams } from '$lib/url';
	import { validate, customerSchema } from '$lib/validation';
	import { fmtDate } from '$lib/format';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import EmptyState from '$lib/components/states/EmptyState.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';

	const qc = useQueryClient();

	const q = $derived(urlParam('q'));
	const page = $derived(Number(urlParam('page')) || 1);

	let searchInput = $state(urlParam('q'));
	$effect(() => {
		const term = searchInput;
		const t = setTimeout(() => {
			if (term !== urlParam('q')) setParams({ q: term || null, page: null });
		}, 300);
		return () => clearTimeout(t);
	});

	const query = createQuery(() => ({
		queryKey: ['customers', q, page],
		queryFn: () => listCustomers({ search: q, page })
	}));

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let form = $state({ name: '', phone: '', address: '' });
	let formError = $state<string | null>(null);
	let fieldErrors = $state<Record<string, string>>({});

	function openCreate() {
		editingId = null;
		form = { name: '', phone: '', address: '' };
		formError = null;
		fieldErrors = {};
		showForm = true;
	}
	function openEdit(c: Customer) {
		editingId = c.id;
		form = { name: c.name, phone: c.phone, address: c.address };
		formError = null;
		fieldErrors = {};
		showForm = true;
	}

	const save = createMutation(() => ({
		mutationFn: (v: { id: string | null; input: typeof form }) =>
			v.id ? updateCustomer(v.id, v.input) : createCustomer(v.input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['customers'] });
			showForm = false;
		},
		onError: (e: Error) => (formError = e.message)
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		formError = null;
		const result = validate(customerSchema, form);
		if (result.errors) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};
		save.mutate({ id: editingId, input: form });
	}
</script>

<svelte:head><title>Customers — Saydalah</title></svelte:head>

<PageHeader title="Customers" subtitle="Customer records for prescriptions and sales.">
	{#snippet actions()}
		<Button onclick={openCreate}><Plus size={16} /> New customer</Button>
	{/snippet}
</PageHeader>

<Modal bind:open={showForm} title={editingId ? 'Edit customer' : 'New customer'}>
	<form onsubmit={submit} class="flex flex-col gap-3">
		<TextInput label="Name" placeholder="Customer name" bind:value={form.name} error={fieldErrors.name} />
		<TextInput label="Phone" placeholder="+880…" bind:value={form.phone} error={fieldErrors.phone} />
		<TextInput label="Address" placeholder="Street, city" bind:value={form.address} error={fieldErrors.address} />
		{#if formError}<p class="text-sm text-red-500">{formError}</p>{/if}
		<div class="mt-1 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (showForm = false)}>Cancel</Button>
			<Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
		</div>
	</form>
</Modal>

<div class="mt-4">
	<SearchInput bind:value={searchInput} placeholder="Search by name or phone…" />
</div>

<div class="mt-4">
	{#if query.isPending}
		<TableSkeleton cols={4} />
	{:else if query.isError}
		<ErrorState message={query.error.message} onRetry={() => query.refetch()} />
	{:else if query.data.items.length === 0}
		<EmptyState title="No customers found" description={q ? 'Try a different search.' : 'Add your first customer.'} />
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-surface-2">
			<table class="w-full text-sm">
				<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
					<tr>
						<th class="px-4 py-2.5 font-medium">Name</th>
						<th class="px-4 py-2.5 font-medium">Phone</th>
						<th class="px-4 py-2.5 font-medium">Address</th>
						<th class="px-4 py-2.5 font-medium">Since</th>
						<th class="px-4 py-2.5"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-2">
					{#each query.data.items as c (c.id)}
						<tr class="group hover:bg-surface-2/30">
							<td class="px-4 py-2.5 font-medium text-fg">{c.name}</td>
							<td class="px-4 py-2.5 font-mono text-xs text-fg-soft">{c.phone || '—'}</td>
							<td class="px-4 py-2.5 text-fg-soft">{c.address || '—'}</td>
							<td class="px-4 py-2.5 text-muted">{fmtDate(c.created_at)}</td>
							<td class="px-4 py-2.5 text-right">
								<button
									onclick={() => openEdit(c)}
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
			<span>{query.data.total} customers</span>
			<div class="flex items-center gap-2">
				<button onclick={() => setParams({ page: Math.max(1, page - 1) })} disabled={page <= 1} class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40">Prev</button>
				<span>Page {query.data.page}</span>
				<button onclick={() => setParams({ page: page + 1 })} disabled={query.data.page * query.data.page_size >= query.data.total} class="rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40">Next</button>
			</div>
		</div>
	{/if}
</div>
