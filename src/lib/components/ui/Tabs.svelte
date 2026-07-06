<script lang="ts">
	/** Segmented pill tab control (filled accent for the active tab). */
	import type { Icon as IconType } from '@lucide/svelte';

	type Tone = 'default' | 'accent' | 'warn' | 'danger' | 'success';

	let {
		tabs,
		active,
		onSelect
	}: {
		tabs: { id: string; label: string; icon?: typeof IconType; count?: number; tone?: Tone }[];
		active: string;
		onSelect: (id: string) => void;
	} = $props();

	// Tone-colored text stays visible whether the tab is active or not. On an
	// inactive tab the badge sits on a tinted background; on the active (accent)
	// pill it sits on white so the tone still reads.
	const badgeText: Record<Tone, string> = {
		default: 'text-muted',
		accent: 'text-accent',
		warn: 'text-amber-600',
		danger: 'text-red-500',
		success: 'text-emerald-600'
	};
	const badgeBg: Record<Tone, string> = {
		default: 'bg-surface-2',
		accent: 'bg-accent/15',
		warn: 'bg-amber-500/15',
		danger: 'bg-red-500/15',
		success: 'bg-emerald-500/15'
	};
</script>

<div class="inline-flex flex-wrap gap-0.5 rounded-full border border-surface-2 bg-surface p-0.5 text-sm">
	{#each tabs as t (t.id)}
		{@const Icon = t.icon}
		<button
			type="button"
			onclick={() => onSelect(t.id)}
			class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition {active ===
			t.id
				? 'bg-accent text-accent-contrast'
				: 'text-muted hover:text-fg'}"
		>
			{#if Icon}<Icon size={15} />{/if}{t.label}
			{#if t.count !== undefined}
				<span class="rounded-full px-1.5 text-xs font-semibold tabular-nums {badgeText[t.tone ?? 'default']} {active === t.id ? 'bg-white' : badgeBg[t.tone ?? 'default']}">{t.count}</span>
			{/if}
		</button>
	{/each}
</div>
