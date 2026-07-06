<script lang="ts">
	import { Search, ChevronDown, Check } from '@lucide/svelte';
	import type { Icon as IconType } from '@lucide/svelte';

	export interface Option {
		value: string;
		label: string;
		sublabel?: string;
		icon?: typeof IconType;
		tint?: string;
	}

	let {
		options,
		value = $bindable(''),
		placeholder = 'Select…',
		disabled = false,
		search = true,
		onchange
	}: {
		options: Option[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		search?: boolean;
		onchange?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let query = $state('');
	let root = $state<HTMLDivElement>();

	const selected = $derived(options.find((o) => o.value === value));
	const filtered = $derived(
		query.trim()
			? options.filter((o) =>
					`${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
				)
			: options
	);

	function choose(v: string) {
		value = v;
		open = false;
		query = '';
		onchange?.(v);
	}

	function toggle() {
		if (disabled) return;
		open = !open;
		query = '';
	}

	// Close on outside click / Escape.
	$effect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (root && !root.contains(e.target as Node)) open = false;
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') open = false;
		}
		document.addEventListener('click', onClick, true);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('click', onClick, true);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

<div class="relative" bind:this={root}>
	<button
		type="button"
		onclick={toggle}
		{disabled}
		class="flex w-full items-center justify-between gap-2 rounded-full border border-surface-2 bg-surface px-3 py-1.5 text-left text-sm text-fg transition hover:border-surface-3 focus:border-accent focus:outline-none disabled:opacity-50 {open
			? 'border-accent'
			: ''}"
	>
		{#if selected}
			<span class="flex min-w-0 items-center gap-2">
				{#if selected.icon}{@const Icon = selected.icon}<Icon size={15} class={selected.tint} />{/if}
				<span class="truncate">{selected.label}</span>
				{#if selected.sublabel}<span class="truncate text-muted">· {selected.sublabel}</span>{/if}
			</span>
		{:else}
			<span class="text-muted">{placeholder}</span>
		{/if}
		<ChevronDown size={15} class="shrink-0 text-muted transition {open ? 'rotate-180' : ''}" />
	</button>

	{#if open}
		<div
			class="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-surface-2 bg-surface shadow-lg"
		>
			{#if search}
				<div class="flex items-center gap-2 border-b border-surface-2 px-3 py-2">
					<Search size={14} class="text-muted" />
					<!-- svelte-ignore a11y_autofocus -->
					<input
						autofocus
						bind:value={query}
						placeholder="Search…"
						class="w-full bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
					/>
				</div>
			{/if}
			<ul class="max-h-56 overflow-y-auto py-1">
				{#each filtered as o (o.value)}
					<li>
						<button
							type="button"
							onclick={() => choose(o.value)}
							class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-surface-2/50 {o.value ===
							value
								? 'bg-surface-2/30'
								: ''}"
						>
							{#if o.icon}{@const Icon = o.icon}<Icon size={15} class="shrink-0 {o.tint}" />{/if}
							<span class="min-w-0 flex-1 truncate text-fg">{o.label}</span>
							{#if o.sublabel}<span class="shrink-0 text-xs text-muted">{o.sublabel}</span>{/if}
							{#if o.value === value}<Check size={14} class="shrink-0 text-accent" />{/if}
						</button>
					</li>
				{:else}
					<li class="px-3 py-3 text-center text-sm text-muted">No matches</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
