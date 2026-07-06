<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { isAuthenticated, me } from '$lib/api/auth';

	const query = createQuery(() => ({
		queryKey: ['me'],
		queryFn: me,
		enabled: isAuthenticated(),
		retry: false
	}));
</script>

<svelte:head>
	<title>Dashboard — Saydalah</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16">
	{#if !isAuthenticated()}
		<div class="rounded-2xl border border-surface-2 bg-surface p-8 text-center">
			<h1 class="text-xl font-semibold text-fg">Welcome to Saydalah</h1>
			<p class="mt-2 text-sm text-muted">Sign in to manage your pharmacy branches.</p>
			<a
				href="/login"
				class="mt-6 inline-block rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-strong"
			>
				Go to sign in
			</a>
		</div>
	{:else if query.isPending}
		<p class="text-center text-sm text-muted">Loading your dashboard…</p>
	{:else if query.isError}
		<div class="rounded-2xl border border-surface-2 bg-surface p-8 text-center">
			<p class="text-sm text-red-500">{query.error.message}</p>
			<a href="/login" class="mt-4 inline-block text-sm text-accent hover:underline">Sign in again</a>
		</div>
	{:else if query.data}
		<div class="rounded-2xl border border-surface-2 bg-surface p-8">
			<h1 class="text-xl font-semibold text-fg">Welcome back, {query.data.full_name}</h1>
			<dl class="mt-4 grid grid-cols-2 gap-y-2 text-sm">
				<dt class="text-muted">Email</dt>
				<dd class="text-fg-soft">{query.data.email}</dd>
				<dt class="text-muted">Role</dt>
				<dd class="text-fg-soft">{query.data.role}</dd>
			</dl>
		</div>
	{/if}
</div>
