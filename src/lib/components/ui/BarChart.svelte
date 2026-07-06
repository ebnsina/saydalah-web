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

<!-- --color-primary drives the bar fill (LayerChart default). -->
<div class="h-72 w-full [--color-primary:var(--color-accent)]">
	<BarChart
		{data}
		x="value"
		y="label"
		orientation="horizontal"
		padding={{ left: 128, bottom: 24 }}
		props={{
			bars: { radius: 4, rounded: 'edge' },
			xAxis: { format: valueFmt },
			yAxis: { tickLength: 0 }
		}}
	/>
</div>
