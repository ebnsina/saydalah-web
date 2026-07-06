<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '$lib/api/auth';
	import { validate, loginSchema } from '$lib/validation';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	// Server error text is whatever the API returned — the API is the source of truth.
	let error = $state<string | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;

		// zod validates input shape before we hit the network.
		const result = validate(loginSchema, { email, password });
		if (result.errors) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};

		submitting = true;
		try {
			await login(email, password);
			await goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in — Saydalah</title>
</svelte:head>

<div class="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
	<div class="text-center">
		<h1 class="text-2xl font-semibold text-fg">Sign in</h1>
		<p class="mt-1 text-sm text-muted">Access your pharmacy branch dashboard.</p>
	</div>

	<form class="flex flex-col gap-4 rounded-2xl border border-surface-2 bg-surface p-6" onsubmit={handleSubmit}>
		<TextInput
			label="Email"
			type="email"
			bind:value={email}
			placeholder="you@pharmacy.com"
			error={fieldErrors.email}
		/>
		<TextInput
			label="Password"
			type="password"
			bind:value={password}
			placeholder="••••••••"
			error={fieldErrors.password}
		/>

		{#if error}
			<p class="text-sm text-red-500">{error}</p>
		{/if}

		<Button type="submit" disabled={submitting} class="mt-2 w-full">
			{submitting ? 'Signing in…' : 'Sign in'}
		</Button>
	</form>
</div>
