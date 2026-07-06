<script lang="ts">
	import { LoaderCircle } from '@lucide/svelte';
	let { label = 'Loading…' }: { label?: string } = $props();
</script>

<div class="flex items-center justify-center gap-2 py-12 text-sm text-muted">
	<LoaderCircle size={18} class="animate-spin" />
	<span>{label}</span>
</div>
