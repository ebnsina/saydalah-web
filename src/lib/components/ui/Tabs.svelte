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

	// Badge colour for an inactive tab (the active tab sits on accent → white badge).
	const badgeTone: Record<Tone, string> = {
		default: 'bg-surface-2 text-muted',
		accent: 'bg-accent/15 text-accent',
		warn: 'bg-amber-500/15 text-amber-600',
		danger: 'bg-red-500/15 text-red-500',
		success: 'bg-emerald-500/15 text-emerald-600'
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
				<span class="rounded-full px-1.5 text-xs font-medium tabular-nums {active === t.id
					? 'bg-white/25 text-accent-contrast'
					: badgeTone[t.tone ?? 'default']}">{t.count}</span>
			{/if}
		</button>
	{/each}
</div>
