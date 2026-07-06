<script lang="ts">
	import { createQuery, createMutation } from '@tanstack/svelte-query';
	import { Sun, Moon, Monitor, User, KeyRound, Palette } from '@lucide/svelte';
	import { me, changePassword } from '$lib/api/auth';
	import { apiFieldErrors } from '$lib/validation';
	import { getTheme, setTheme, type Theme } from '$lib/theme';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const user = createQuery(() => ({ queryKey: ['me'], queryFn: me }));

	// --- theme ---
	let theme = $state<Theme>(getTheme());
	const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	];
	function pickTheme(t: Theme) {
		theme = t;
		setTheme(t);
	}

	// --- change password ---
	let current = $state('');
	let next = $state('');
	let confirm = $state('');
	let pwError = $state<string | null>(null);
	let pwFields = $state<Record<string, string>>({});
	let pwDone = $state(false);

	const pwMut = createMutation(() => ({
		mutationFn: () => changePassword(current, next),
		onSuccess: () => {
			pwDone = true;
			current = next = confirm = '';
		},
		onError: (e: Error) => {
			pwError = e.message;
			pwFields = apiFieldErrors(e);
		}
	}));

	function savePassword(e: SubmitEvent) {
		e.preventDefault();
		pwError = null;
		pwFields = {};
		pwDone = false;
		const fe: Record<string, string> = {};
		if (!current) fe.current = 'Enter your current password';
		if (next.length < 8) fe.next = 'Must be at least 8 characters';
		if (confirm !== next) fe.confirm = 'Passwords do not match';
		if (Object.keys(fe).length) {
			pwFields = fe;
			return;
		}
		pwMut.mutate();
	}
</script>

<svelte:head><title>Settings — Saydalah</title></svelte:head>

<PageHeader title="Settings" subtitle="Your profile, security, and appearance." />

<div class="mt-6 flex max-w-2xl flex-col gap-6">
	<!-- Profile -->
	<Card>
		<div class="mb-4 flex items-center gap-2">
			<User size={16} class="text-accent" />
			<h2 class="font-semibold text-fg">Profile</h2>
		</div>
		{#if user.data}
			<div class="flex items-center gap-4">
				<div class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface-2 text-lg font-semibold text-fg-soft">
					{(user.data.full_name || user.data.email).charAt(0).toUpperCase()}
				</div>
				<div class="min-w-0">
					<div class="truncate text-base font-medium text-fg">{user.data.full_name || '—'}</div>
					<div class="truncate text-sm text-muted">{user.data.email}</div>
					<span class="mt-1 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent capitalize">{user.data.role}</span>
				</div>
			</div>
			<p class="mt-3 text-xs text-muted">To change your name or role, contact an administrator.</p>
		{:else}
			<p class="text-sm text-muted">Loading…</p>
		{/if}
	</Card>

	<!-- Appearance -->
	<Card>
		<div class="mb-4 flex items-center gap-2">
			<Palette size={16} class="text-accent" />
			<h2 class="font-semibold text-fg">Appearance</h2>
		</div>
		<div class="grid grid-cols-3 gap-2">
			{#each themeOptions as opt (opt.value)}
				{@const Icon = opt.icon}
				<button
					type="button"
					onclick={() => pickTheme(opt.value)}
					class="flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition {theme ===
					opt.value
						? 'border-accent bg-accent/5 text-accent'
						: 'border-surface-2 text-fg-soft hover:bg-surface-2/50'}"
				>
					<Icon size={20} />
					{opt.label}
				</button>
			{/each}
		</div>
	</Card>

	<!-- Security -->
	<Card>
		<div class="mb-4 flex items-center gap-2">
			<KeyRound size={16} class="text-accent" />
			<h2 class="font-semibold text-fg">Change password</h2>
		</div>
		<form onsubmit={savePassword} class="flex flex-col gap-3">
			<TextInput label="Current password" type="password" bind:value={current} error={pwFields.current || pwFields.current_password} />
			<TextInput label="New password" type="password" placeholder="At least 8 characters" bind:value={next} error={pwFields.next || pwFields.new_password} />
			<TextInput label="Confirm new password" type="password" bind:value={confirm} error={pwFields.confirm} />
			{#if pwError}<p class="text-sm text-red-500">{pwError}</p>{/if}
			{#if pwDone}<p class="text-sm text-emerald-600">Your password has been updated.</p>{/if}
			<div class="flex justify-end">
				<Button type="submit" disabled={pwMut.isPending}>{pwMut.isPending ? 'Saving…' : 'Update password'}</Button>
			</div>
		</form>
	</Card>
</div>
