<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	// Animates from 0 up to `value` (and between subsequent values) like a
	// rolling counter. Rendered in Geist Mono with tabular figures so digits do
	// not jitter while animating.
	let {
		value,
		format
	}: { value: number; format?: (n: number) => string } = $props();

	const tween = new Tween(0, { duration: 700, easing: cubicOut });
	$effect(() => {
		tween.set(value);
	});

	const shown = $derived(
		format ? format(tween.current) : Math.round(tween.current).toLocaleString()
	);
</script>

<span class="font-mono tabular-nums">{shown}</span>
