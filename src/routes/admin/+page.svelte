<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Plus, Pencil } from '@lucide/svelte';
	import { listBranches, createBranch, updateBranch } from '$lib/api/branches';
	import { listSuppliers, createSupplier, updateSupplier } from '$lib/api/suppliers';
	import { listUsers, createUser, updateUser } from '$lib/api/users';
	import type { Branch, Supplier, User, Role } from '$lib/types';
	import { urlParam, setParams } from '$lib/url';
	import {
		validate,
		branchSchema,
		supplierSchema,
		userCreateSchema,
		userEditSchema
	} from '$lib/validation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Combobox from '$lib/components/ui/Combobox.svelte';
	import Spinner from '$lib/components/states/Spinner.svelte';
	import ErrorState from '$lib/components/states/ErrorState.svelte';
	import TableSkeleton from '$lib/components/states/TableSkeleton.svelte';

	const qc = useQueryClient();
	const tab = $derived(urlParam('tab', 'branches'));
	const tabs = [
		{ id: 'branches', label: 'Branches' },
		{ id: 'suppliers', label: 'Suppliers' },
		{ id: 'users', label: 'Users' }
	];

	const branches = createQuery(() => ({ queryKey: ['branches'], queryFn: listBranches }));
	const suppliers = createQuery(() => ({ queryKey: ['suppliers'], queryFn: listSuppliers }));
	const users = createQuery(() => ({ queryKey: ['users'], queryFn: () => listUsers(1) }));

	let open = $state(false);
	let editingId = $state<string | null>(null);
	let error = $state<string | null>(null);
	let fieldErrors = $state<Record<string, string>>({});

	const roleOptions = [
		{ value: 'cashier', label: 'Cashier' },
		{ value: 'pharmacist', label: 'Pharmacist' },
		{ value: 'manager', label: 'Manager' },
		{ value: 'admin', label: 'Admin' }
	];
	const branchOptions = $derived(
		(branches.data?.items ?? []).map((b) => ({ value: b.id, label: b.name }))
	);

	let bForm = $state({ name: '', address: '', phone: '', active: true });
	let sForm = $state({ name: '', contact: '', phone: '', email: '', active: true });
	let uForm = $state<{ email: string; password: string; full_name: string; role: Role; branch_id: string; active: boolean }>({
		email: '', password: '', full_name: '', role: 'cashier', branch_id: '', active: true
	});

	function branchName(id: string | null): string {
		if (!id) return '— (chain-wide)';
		return branches.data?.items.find((b) => b.id === id)?.name ?? '—';
	}

	function openCreate() {
		editingId = null;
		error = null;
		fieldErrors = {};
		bForm = { name: '', address: '', phone: '', active: true };
		sForm = { name: '', contact: '', phone: '', email: '', active: true };
		uForm = { email: '', password: '', full_name: '', role: 'cashier', branch_id: '', active: true };
		open = true;
	}
	function editBranch(b: Branch) {
		editingId = b.id;
		error = null;
		fieldErrors = {};
		bForm = { name: b.name, address: b.address, phone: b.phone, active: b.active };
		open = true;
	}
	function editSupplier(s: Supplier) {
		editingId = s.id;
		error = null;
		fieldErrors = {};
		sForm = { name: s.name, contact: s.contact, phone: s.phone, email: s.email, active: s.active };
		open = true;
	}
	function editUser(u: User) {
		editingId = u.id;
		error = null;
		fieldErrors = {};
		uForm = { email: u.email, password: '', full_name: u.full_name, role: u.role, branch_id: u.branch_id ?? '', active: u.active ?? true };
		open = true;
	}

	const bMut = createMutation(() => ({
		mutationFn: (v: { id: string | null }) =>
			v.id ? updateBranch(v.id, bForm) : createBranch(bForm),
		onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); open = false; },
		onError: (e: Error) => (error = e.message)
	}));
	const sMut = createMutation(() => ({
		mutationFn: (v: { id: string | null }) =>
			v.id ? updateSupplier(v.id, sForm) : createSupplier(sForm),
		onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); open = false; },
		onError: (e: Error) => (error = e.message)
	}));
	const uMut = createMutation(() => ({
		mutationFn: (v: { id: string | null }) => {
			const branch_id = uForm.role === 'admin' ? null : uForm.branch_id || null;
			return v.id
				? updateUser(v.id, { full_name: uForm.full_name, role: uForm.role, branch_id, active: uForm.active })
				: createUser({ email: uForm.email, password: uForm.password, full_name: uForm.full_name, role: uForm.role, branch_id });
		},
		onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); open = false; },
		onError: (e: Error) => (error = e.message)
	}));

	function submit() {
		error = null;
		fieldErrors = {};
		let result;
		if (tab === 'branches') result = validate(branchSchema, bForm);
		else if (tab === 'suppliers') result = validate(supplierSchema, sForm);
		else result = validate(editingId ? userEditSchema : userCreateSchema, uForm);

		if (result.errors) {
			fieldErrors = result.errors;
			return;
		}
		if (tab === 'branches') bMut.mutate({ id: editingId });
		else if (tab === 'suppliers') sMut.mutate({ id: editingId });
		else uMut.mutate({ id: editingId });
	}

	const pending = $derived(bMut.isPending || sMut.isPending || uMut.isPending);

	const editBtn = 'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:bg-surface-2 hover:text-fg';
</script>

<svelte:head><title>Admin — Saydalah</title></svelte:head>

<PageHeader title="Administration" subtitle="Branches, suppliers, and staff accounts.">
	{#snippet actions()}
		<Button onclick={openCreate}><Plus size={16} /> New {tab.slice(0, -1)}</Button>
	{/snippet}
</PageHeader>

<div class="mt-4 flex gap-1 border-b border-surface-2">
	{#each tabs as t (t.id)}
		<button
			onclick={() => setParams({ tab: t.id })}
			class="border-b-2 px-4 py-2 text-sm font-medium transition {tab === t.id
				? 'border-accent text-accent'
				: 'border-transparent text-muted hover:text-fg'}"
		>{t.label}</button>
	{/each}
</div>

<div class="mt-4">
	{#if tab === 'branches'}
		{#if branches.isPending}<TableSkeleton cols={3} />{:else if branches.isError}<ErrorState message={branches.error.message} onRetry={() => branches.refetch()} />{:else}
			<div class="overflow-x-auto rounded-2xl border border-surface-2">
				<table class="w-full text-sm">
					<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase"><tr><th class="px-4 py-2.5 font-medium">Name</th><th class="px-4 py-2.5 font-medium">Address</th><th class="px-4 py-2.5 font-medium">Phone</th><th class="px-4 py-2.5 font-medium">Status</th><th class="px-4 py-2.5"></th></tr></thead>
					<tbody class="divide-y divide-surface-2">
						{#each branches.data.items as b (b.id)}<tr class="group hover:bg-surface-2/30"><td class="px-4 py-2.5 font-medium text-fg">{b.name}</td><td class="px-4 py-2.5 text-fg-soft">{b.address || '—'}</td><td class="px-4 py-2.5 font-mono text-xs text-fg-soft">{b.phone || '—'}</td><td class="px-4 py-2.5">{#if b.active}<span class="text-emerald-500">Active</span>{:else}<span class="text-muted">Inactive</span>{/if}</td><td class="px-4 py-2.5 text-right"><button onclick={() => editBranch(b)} class={editBtn}><Pencil size={13} /> Edit</button></td></tr>{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else if tab === 'suppliers'}
		{#if suppliers.isPending}<TableSkeleton cols={4} />{:else if suppliers.isError}<ErrorState message={suppliers.error.message} onRetry={() => suppliers.refetch()} />{:else}
			<div class="overflow-x-auto rounded-2xl border border-surface-2">
				<table class="w-full text-sm">
					<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase"><tr><th class="px-4 py-2.5 font-medium">Name</th><th class="px-4 py-2.5 font-medium">Contact</th><th class="px-4 py-2.5 font-medium">Phone</th><th class="px-4 py-2.5 font-medium">Email</th><th class="px-4 py-2.5"></th></tr></thead>
					<tbody class="divide-y divide-surface-2">
						{#each suppliers.data.items as s (s.id)}<tr class="group hover:bg-surface-2/30"><td class="px-4 py-2.5 font-medium text-fg">{s.name}</td><td class="px-4 py-2.5 text-fg-soft">{s.contact || '—'}</td><td class="px-4 py-2.5 font-mono text-xs text-fg-soft">{s.phone || '—'}</td><td class="px-4 py-2.5 text-fg-soft">{s.email || '—'}</td><td class="px-4 py-2.5 text-right"><button onclick={() => editSupplier(s)} class={editBtn}><Pencil size={13} /> Edit</button></td></tr>{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else}
		{#if users.isPending}<TableSkeleton cols={4} />{:else if users.isError}<ErrorState message={users.error.message} onRetry={() => users.refetch()} />{:else}
			<div class="overflow-x-auto rounded-2xl border border-surface-2">
				<table class="w-full text-sm">
					<thead class="bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase"><tr><th class="px-4 py-2.5 font-medium">Name</th><th class="px-4 py-2.5 font-medium">Email</th><th class="px-4 py-2.5 font-medium">Role</th><th class="px-4 py-2.5 font-medium">Branch</th><th class="px-4 py-2.5 font-medium">Status</th><th class="px-4 py-2.5"></th></tr></thead>
					<tbody class="divide-y divide-surface-2">
						{#each users.data.items as u (u.id)}<tr class="group hover:bg-surface-2/30"><td class="px-4 py-2.5 font-medium text-fg">{u.full_name || '—'}</td><td class="px-4 py-2.5 text-fg-soft">{u.email}</td><td class="px-4 py-2.5 capitalize text-fg-soft">{u.role}</td><td class="px-4 py-2.5 text-fg-soft">{branchName(u.branch_id)}</td><td class="px-4 py-2.5">{#if u.active}<span class="text-emerald-500">Active</span>{:else}<span class="text-muted">Inactive</span>{/if}</td><td class="px-4 py-2.5 text-right"><button onclick={() => editUser(u)} class={editBtn}><Pencil size={13} /> Edit</button></td></tr>{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>

<Modal bind:open title={(editingId ? 'Edit ' : 'New ') + tab.slice(0, -1)}>
	<form onsubmit={(e) => { e.preventDefault(); submit(); }} class="flex flex-col gap-3">
		{#if tab === 'branches'}
			<TextInput label="Name" placeholder="Saydalah Downtown" bind:value={bForm.name} error={fieldErrors.name} />
			<TextInput label="Address" placeholder="Street, city" bind:value={bForm.address} error={fieldErrors.address} />
			<TextInput label="Phone" placeholder="+880…" bind:value={bForm.phone} error={fieldErrors.phone} />
			{#if editingId}<label class="flex items-center gap-2 text-sm text-fg-soft"><input type="checkbox" bind:checked={bForm.active} class="h-4 w-4 accent-[var(--color-accent)]" /> Active</label>{/if}
		{:else if tab === 'suppliers'}
			<TextInput label="Name" placeholder="Acme Pharma Ltd." bind:value={sForm.name} error={fieldErrors.name} />
			<TextInput label="Contact" placeholder="Contact person" bind:value={sForm.contact} error={fieldErrors.contact} />
			<TextInput label="Phone" placeholder="+880…" bind:value={sForm.phone} error={fieldErrors.phone} />
			<TextInput label="Email" type="email" placeholder="orders@supplier.com" bind:value={sForm.email} error={fieldErrors.email} />
			{#if editingId}<label class="flex items-center gap-2 text-sm text-fg-soft"><input type="checkbox" bind:checked={sForm.active} class="h-4 w-4 accent-[var(--color-accent)]" /> Active</label>{/if}
		{:else}
			<TextInput label="Full name" placeholder="Jane Doe" bind:value={uForm.full_name} error={fieldErrors.full_name} />
			{#if !editingId}
				<TextInput label="Email" type="email" placeholder="jane@saydalah.test" bind:value={uForm.email} error={fieldErrors.email} />
				<TextInput label="Password" type="password" placeholder="At least 8 characters" bind:value={uForm.password} error={fieldErrors.password} />
			{/if}
			<div class="flex flex-col gap-1 text-sm">
				<span class="font-medium text-fg-soft">Role</span>
				<Combobox value={uForm.role} search={false} options={roleOptions} onchange={(v) => (uForm.role = v as Role)} />
			</div>
			{#if uForm.role !== 'admin'}
				<div class="flex flex-col gap-1 text-sm">
					<span class="font-medium text-fg-soft">Branch</span>
					<Combobox bind:value={uForm.branch_id} options={branchOptions} placeholder="Choose a branch…" />
					{#if fieldErrors.branch_id}<span class="text-xs text-red-500">{fieldErrors.branch_id}</span>{/if}
				</div>
			{/if}
			{#if editingId}<label class="flex items-center gap-2 text-sm text-fg-soft"><input type="checkbox" bind:checked={uForm.active} class="h-4 w-4 accent-[var(--color-accent)]" /> Active</label>{/if}
		{/if}
		{#if error}<p class="text-sm text-red-500">{error}</p>{/if}
		<div class="mt-1 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
		</div>
	</form>
</Modal>
