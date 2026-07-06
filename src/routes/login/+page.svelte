<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '$lib/api/auth';

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);
	// Error text is whatever the API returned — the API is the source of truth.
	let error = $state<string | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
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
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="font-medium text-fg-soft">Email</span>
			<input
				type="email"
				name="email"
				autocomplete="email"
				required
				bind:value={email}
				class="rounded-lg border border-surface-2 bg-surface-2/40 px-3 py-2 text-fg placeholder:text-muted focus:border-accent"
				placeholder="you@pharmacy.com"
			/>
		</label>

		<label class="flex flex-col gap-1.5 text-sm">
			<span class="font-medium text-fg-soft">Password</span>
			<input
				type="password"
				name="password"
				autocomplete="current-password"
				required
				bind:value={password}
				class="rounded-lg border border-surface-2 bg-surface-2/40 px-3 py-2 text-fg placeholder:text-muted focus:border-accent"
				placeholder="••••••••"
			/>
		</label>

		{#if error}
			<p class="text-sm text-red-500">{error}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="mt-2 rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
		>
			{submitting ? 'Signing in…' : 'Sign in'}
		</button>
	</form>
</div>
