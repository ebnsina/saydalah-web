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
		icon
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
	} = $props();

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
	{#if hint}<div class="mt-1.5 text-xs text-muted">{hint}</div>{/if}
</div>
