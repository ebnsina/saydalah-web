<script lang="ts">
	import { Inbox } from '@lucide/svelte';
	let {
		title = 'Nothing here yet',
		description = ''
	}: { title?: string; description?: string } = $props();
</script>

<div
	class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-surface-3 bg-surface/50 p-10 text-center"
>
	<span class="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-muted">
		<Inbox size={20} />
	</span>
	<p class="text-sm font-medium text-fg-soft">{title}</p>
	{#if description}<p class="text-sm text-muted">{description}</p>{/if}
</div>
