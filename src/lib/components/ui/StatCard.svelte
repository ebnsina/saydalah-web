<script lang="ts">
	import type { Snippet } from 'svelte';
	import { TrendingUp, TrendingDown } from '@lucide/svelte';
	import RollingNumber from './RollingNumber.svelte';
	import Skeleton from './Skeleton.svelte';

	type Tone = 'default' | 'accent' | 'warn' | 'danger' | 'success';

	let {
		label,
		value,
		format,
		subtitle = '',
		hint = '',
		delta,
		tone = 'default',
		loading = false,
		icon,
		sparkline
	}: {
		label: string;
		value: number;
		format?: (n: number) => string;
		subtitle?: string;
		hint?: string;
		delta?: number;
		tone?: Tone;
		loading?: boolean;
		icon?: Snippet;
		sparkline?: number[];
	} = $props();

	// Build a tiny inline sparkline path (vector — stays crisp).
	const SW = 96;
	const SH = 28;
	const sparkMax = $derived(sparkline ? Math.max(1, ...sparkline) : 1);
	const sparkPath = $derived(
		sparkline && sparkline.length > 1
			? sparkline
					.map((v, i) => {
						const x = (i / (sparkline.length - 1)) * SW;
						const y = SH - 2 - (v / sparkMax) * (SH - 4);
						return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
					})
					.join(' ')
			: ''
	);

	const valueTone: Record<Tone, string> = {
		default: 'text-fg',
		accent: 'text-accent',
		warn: 'text-amber-500',
		danger: 'text-red-500',
		success: 'text-emerald-500'
	};
	const iconTone: Record<Tone, string> = {
		default: 'bg-surface-2 text-fg-soft',
		accent: 'bg-accent/10 text-accent',
		warn: 'bg-amber-500/10 text-amber-500',
		danger: 'bg-red-500/10 text-red-500',
		success: 'bg-emerald-500/10 text-emerald-500'
	};
</script>

<div class="rounded-2xl border border-surface-2 bg-surface-2/40 p-5">
	<div class="flex items-center gap-3">
		{#if icon}
			<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl {iconTone[tone]}">
				{@render icon()}
			</span>
		{/if}
		<div class="min-w-0">
			<div class="truncate text-sm font-medium text-fg-soft">{label}</div>
			{#if subtitle}<div class="truncate text-xs text-muted">{subtitle}</div>{/if}
		</div>
	</div>

	<div class="mt-4 flex items-end justify-between gap-2">
		{#if loading}
			<Skeleton class="h-9 w-28" />
		{:else}
			<span class="text-3xl font-semibold tracking-tight {valueTone[tone]}">
				<RollingNumber {value} {format} />
			</span>
			{#if delta !== undefined}
				<span
					class="mb-1 inline-flex items-center gap-0.5 text-xs font-medium {delta >= 0
						? 'text-emerald-500'
						: 'text-red-500'}"
				>
					{#if delta >= 0}<TrendingUp size={13} />{:else}<TrendingDown size={13} />{/if}
					{Math.abs(delta)}%
				</span>
			{/if}
		{/if}
	</div>
	<div class="mt-1.5 flex items-end justify-between gap-2">
		{#if hint}<div class="text-xs text-muted">{hint}</div>{/if}
		{#if sparkPath && !loading}
			<svg viewBox="0 0 {SW} {SH}" preserveAspectRatio="none" class="ml-auto h-7 w-24 shrink-0 {valueTone[tone]}">
				<path d={sparkPath} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity="0.7" />
			</svg>
		{/if}
	</div>
</div>
