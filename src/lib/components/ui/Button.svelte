<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

	let {
		variant = 'primary',
		type = 'button',
		disabled = false,
		onclick,
		class: cls = '',
		children
	}: {
		variant?: Variant;
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: () => void;
		class?: string;
		children: Snippet;
	} = $props();

	const styles: Record<Variant, string> = {
		primary: 'bg-accent text-white hover:bg-accent-strong',
		secondary: 'border border-surface-2 text-fg-soft hover:bg-surface-2',
		ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
		danger: 'bg-red-500 text-white hover:bg-red-600'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 {styles[
		variant
	]} {cls}"
>
	{@render children()}
</button>
