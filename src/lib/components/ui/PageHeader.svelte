<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		title,
		subtitle = '',
		actions
	}: { title: string; subtitle?: string; actions?: Snippet } = $props();
</script>

<div class="flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
		{#if subtitle}<p class="mt-0.5 text-sm text-muted">{subtitle}</p>{/if}
	</div>
	{#if actions}<div class="flex items-center gap-2">{@render actions()}</div>{/if}
</div>
