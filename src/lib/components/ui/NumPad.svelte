<script lang="ts">
	import { Delete } from '@lucide/svelte';

	// Touch-friendly numeric keypad. Operates on a bindable *string* so a trailing
	// decimal point survives while typing (e.g. "12." → "12.5"). The parent reads
	// Number(value) for maths.
	let { value = $bindable('') }: { value?: string } = $props();

	const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0'];

	function press(k: string) {
		if (k === '.' && value.includes('.')) return;
		// Avoid leading zeros like "00"; a lone "0" is replaced by the next digit.
		if (value === '0' && k !== '.') value = k;
		else value += k;
	}
	function backspace() {
		value = value.slice(0, -1);
	}
</script>

<div class="grid grid-cols-3 gap-2">
	{#each keys as k (k)}
		<button
			type="button"
			onclick={() => press(k)}
			class="rounded-xl border border-surface-2 bg-surface py-3 text-lg font-semibold text-fg tabular-nums transition active:scale-95 active:bg-surface-2 hover:bg-surface-2"
		>
			{k}
		</button>
	{/each}
	<button
		type="button"
		onclick={backspace}
		aria-label="Delete"
		class="flex items-center justify-center rounded-xl border border-surface-2 bg-surface py-3 text-muted transition active:scale-95 active:bg-surface-2 hover:bg-surface-2"
	>
		<Delete size={20} />
	</button>
</div>
