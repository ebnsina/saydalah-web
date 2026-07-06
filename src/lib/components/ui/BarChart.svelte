<script lang="ts">
	/**
	 * Horizontal bar chart built with plain HTML/CSS — DOM text stays perfectly
	 * crisp at any DPR (no SVG/canvas rasterization), and it animates cleanly.
	 */
	import { fmtMoney } from '$lib/format';

	let {
		data,
		money = false
	}: { data: { label: string; value: number }[]; money?: boolean } = $props();

	const max = $derived(Math.max(1, ...data.map((d) => d.value)));
	const fmt = (v: number) => (money ? fmtMoney(v) : v.toLocaleString());
</script>

<div class="flex flex-col gap-3">
	{#each data as d (d.label)}
		<div class="grid grid-cols-[minmax(6rem,10rem)_1fr] items-center gap-3 sm:grid-cols-[10rem_1fr]">
			<span class="truncate text-right text-sm text-fg-soft" title={d.label}>{d.label}</span>
			<div class="flex items-center gap-2">
				<div
					class="h-6 min-w-[2px] rounded-md bg-accent/85 transition-[width] duration-500 ease-out"
					style="width: {(d.value / max) * 100}%"
				></div>
				<span class="shrink-0 font-mono text-xs tabular-nums text-muted">{fmt(d.value)}</span>
			</div>
		</div>
	{/each}
</div>
