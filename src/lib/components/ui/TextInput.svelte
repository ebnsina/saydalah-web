<script lang="ts">
	import type { Snippet } from 'svelte';

	// A pill-shaped labelled input. The focus ring lives on the wrapper
	// (focus-within) because the base stylesheet strips input outlines.
	let {
		label = '',
		value = $bindable(),
		type = 'text',
		placeholder = '',
		required = false,
		min,
		mono = false,
		error = '',
		icon
	}: {
		label?: string;
		value: string | number;
		type?: string;
		placeholder?: string;
		required?: boolean;
		min?: number;
		mono?: boolean;
		error?: string;
		icon?: Snippet;
	} = $props();
</script>

<label class="flex flex-col gap-1.5 text-sm">
	{#if label}<span class="font-medium text-fg-soft">{label}</span>{/if}
	<div
		class="flex items-center gap-2 rounded-full border bg-surface px-4 transition focus-within:ring-4 {error
			? 'border-red-500 focus-within:ring-red-500/15'
			: 'border-surface-2 focus-within:border-accent focus-within:ring-accent/15'}"
	>
		{#if icon}{@render icon()}{/if}
		<input
			{type}
			{placeholder}
			{required}
			{min}
			bind:value
			class="w-full bg-transparent py-2 text-fg placeholder:text-muted focus:outline-none {mono
				? 'font-mono'
				: ''}"
		/>
	</div>
	{#if error}<span class="text-xs text-red-500">{error}</span>{/if}
</label>
