<script lang="ts">
	import { TriangleAlert } from '@lucide/svelte';

	// `message` is passed straight from the API/query error — the API is the
	// source of truth for what went wrong.
	let {
		message,
		onRetry
	}: { message: string; onRetry?: () => void } = $props();
</script>

<div
	class="flex flex-col items-center gap-3 rounded-2xl border border-surface-2 bg-surface p-8 text-center"
>
	<span class="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 text-red-500">
		<TriangleAlert size={20} />
	</span>
	<p class="text-sm text-fg-soft">{message}</p>
	{#if onRetry}
		<button
			type="button"
			onclick={onRetry}
			class="rounded-lg border border-surface-2 px-3 py-1.5 text-sm text-fg-soft transition hover:bg-surface-2"
		>
			Try again
		</button>
	{/if}
</div>
