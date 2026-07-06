<script lang="ts">
	import { page } from '$app/state';
	import { House, RotateCcw } from '@lucide/svelte';

	// Titles are UI chrome keyed off the HTTP status; the detail message comes
	// from whatever raised the error (the API, when it's a data error).
	const titles: Record<number, string> = {
		404: 'Page not found',
		403: 'Access denied',
		401: 'Please sign in',
		500: 'Something went wrong',
		503: 'Service unavailable'
	};

	const status = $derived(page.status);
	const title = $derived(titles[status] ?? 'Something went wrong');
	const detail = $derived(page.error?.message ?? '');
</script>

<svelte:head><title>{status} — Saydalah</title></svelte:head>

<div class="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
	<span class="font-mono text-5xl font-semibold text-surface-3">{status}</span>
	<h1 class="text-xl font-semibold text-fg">{title}</h1>
	{#if detail}<p class="text-sm text-muted">{detail}</p>{/if}

	<div class="mt-2 flex items-center gap-3">
		<a
			href="/"
			class="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
		>
			<House size={16} /> Home
		</a>
		{#if status >= 500}
			<button
				type="button"
				onclick={() => location.reload()}
				class="inline-flex items-center gap-1.5 rounded-lg border border-surface-2 px-4 py-2 text-sm text-fg-soft transition hover:bg-surface-2"
			>
				<RotateCcw size={16} /> Retry
			</button>
		{/if}
	</div>
</div>
