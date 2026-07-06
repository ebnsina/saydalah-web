<script lang="ts">
	/** Horizontal bar chart wrapper around LayerChart. */
	import { BarChart } from 'layerchart/svg';
	import { fmtMoney } from '$lib/format';

	let {
		data,
		money = false
	}: { data: { label: string; value: number }[]; money?: boolean } = $props();

	const valueFmt = (v: number) => (money ? fmtMoney(v) : v.toLocaleString());
</script>

<!--
	--color-primary drives the bar fill (LayerChart default).
	The [&_text] rule forces geometric text rendering + a legible size so the
	SVG axis labels stay crisp instead of looking soft/pixelated.
-->
<div
	class="chart h-80 w-full [--color-primary:var(--color-accent)] [&_svg_text]:[text-rendering:geometricPrecision] [&_svg_text]:!fill-[var(--color-muted)] [&_svg_text]:![font-size:11px]"
>
	<BarChart
		{data}
		x="value"
		y="label"
		orientation="horizontal"
		padding={{ left: 132, bottom: 28, right: 12 }}
		props={{
			bars: { radius: 4, rounded: 'edge' },
			xAxis: { format: valueFmt },
			yAxis: { tickLength: 0 }
		}}
	/>
</div>

<style>
	/* Ensure the SVG never gets scaled to a fractional size (a cause of soft text). */
	.chart :global(svg) {
		shape-rendering: geometricPrecision;
	}
</style>
