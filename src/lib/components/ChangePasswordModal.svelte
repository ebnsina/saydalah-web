<script lang="ts">
	import { createMutation } from '@tanstack/svelte-query';
	import { changePassword } from '$lib/api/auth';
	import { apiFieldErrors } from '$lib/validation';
	import Modal from '$lib/components/ui/Modal.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let current = $state('');
	let next = $state('');
	let confirm = $state('');
	let error = $state<string | null>(null);
	let fieldErrors = $state<Record<string, string>>({});
	let done = $state(false);

	function reset() {
		current = '';
		next = '';
		confirm = '';
		error = null;
		fieldErrors = {};
		done = false;
	}

	// Clear the form each time the dialog opens.
	$effect(() => {
		if (open) reset();
	});

	const mut = createMutation(() => ({
		mutationFn: () => changePassword(current, next),
		onSuccess: () => {
			done = true;
		},
		onError: (e: Error) => {
			error = e.message;
			fieldErrors = apiFieldErrors(e);
		}
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		fieldErrors = {};
		const fe: Record<string, string> = {};
		if (!current) fe.current = 'Enter your current password';
		if (next.length < 8) fe.next = 'Must be at least 8 characters';
		if (confirm !== next) fe.confirm = 'Passwords do not match';
		if (Object.keys(fe).length) {
			fieldErrors = fe;
			return;
		}
		mut.mutate();
	}
</script>

<Modal bind:open title="Change password">
	{#if done}
		<div class="flex flex-col items-center gap-2 py-4 text-center">
			<p class="text-sm text-fg">Your password has been updated.</p>
			<Button onclick={() => (open = false)}>Done</Button>
		</div>
	{:else}
		<form onsubmit={submit} class="flex flex-col gap-3">
			<TextInput
				label="Current password"
				type="password"
				bind:value={current}
				error={fieldErrors.current || fieldErrors.current_password}
			/>
			<TextInput
				label="New password"
				type="password"
				placeholder="At least 8 characters"
				bind:value={next}
				error={fieldErrors.next || fieldErrors.new_password}
			/>
			<TextInput label="Confirm new password" type="password" bind:value={confirm} error={fieldErrors.confirm} />
			{#if error}<p class="text-sm text-red-500">{error}</p>{/if}
			<div class="mt-1 flex justify-end gap-2">
				<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Update password'}</Button>
			</div>
		</form>
	{/if}
</Modal>
