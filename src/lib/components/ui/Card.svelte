<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		class: cls = '',
		padded = true,
		children
	}: { class?: string; padded?: boolean; children: Snippet } = $props();
</script>

<div class="rounded-2xl border border-surface-2 bg-surface-2/40 {padded ? 'p-5' : ''} {cls}">
	{@render children()}
</div>
