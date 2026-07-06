<script lang="ts">
	import { Search } from '@lucide/svelte';
	let {
		value = $bindable(),
		placeholder = 'Search…'
	}: { value: string; placeholder?: string } = $props();
</script>

<div
	class="flex items-center gap-2 rounded-full border border-surface-2 bg-surface py-2 pr-2 pl-5 transition focus-within:border-gray-200 focus-within:ring-2 focus-within:ring-gray-200 focus-within:ring-offset-2 focus-within:ring-offset-surface"
>
	<Search size={18} class="shrink-0 text-muted" aria-hidden="true" />
	<input
		bind:value
		{placeholder}
		class="w-full bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
	/>
</div>
