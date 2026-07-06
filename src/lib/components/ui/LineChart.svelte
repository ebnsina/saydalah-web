<script lang="ts">
	/**
	 * Minimal responsive line/area chart. The line & area are vector SVG (crisp at
	 * any DPR, with a non-scaling stroke); all text is HTML so it never rasterizes.
	 */
	import { fmtMoney, fmtDate } from '$lib/format';

	let {
		data,
		money = false
	}: { data: { label: string; value: number }[]; money?: boolean } = $props();

	const W = 600;
	const H = 180;
	const PAD = 6;

	const max = $derived(Math.max(1, ...data.map((d) => d.value)));
	const points = $derived(
		data.map((d, i) => {
			const x = data.length <= 1 ? W / 2 : (i / (data.length - 1)) * W;
			const y = H - PAD - (d.value / max) * (H - PAD * 2);
			return [x, y] as const;
		})
	);
	const linePath = $derived(
		points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
	);
	const areaPath = $derived(points.length ? `${linePath} L${W},${H} L0,${H} Z` : '');

	const fmt = (v: number) => (money ? fmtMoney(v) : v.toLocaleString());
	const total = $derived(data.reduce((s, d) => s + d.value, 0));
</script>

{#if data.length === 0}
	<p class="py-10 text-center text-sm text-muted">No data in this range.</p>
{:else}
	<div class="flex items-baseline justify-between text-xs text-muted">
		<span>peak <span class="font-mono text-fg-soft">{fmt(max)}</span></span>
		<span>total <span class="font-mono text-fg-soft">{fmt(total)}</span></span>
	</div>
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="mt-1 h-44 w-full overflow-visible">
		<defs>
			<linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.22" />
				<stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
			</linearGradient>
		</defs>
		<path d={areaPath} fill="url(#lc-fill)" />
		<path
			d={linePath}
			fill="none"
			stroke="var(--color-accent)"
			stroke-width="2"
			stroke-linejoin="round"
			stroke-linecap="round"
			vector-effect="non-scaling-stroke"
		/>
	</svg>
	<div class="mt-1 flex justify-between text-xs text-muted">
		<span>{fmtDate(data[0].label)}</span>
		{#if data.length > 2}<span>{fmtDate(data[Math.floor(data.length / 2)].label)}</span>{/if}
		<span>{fmtDate(data[data.length - 1].label)}</span>
	</div>
{/if}
