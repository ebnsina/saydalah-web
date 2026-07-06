<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';
	import { Search, Pill, Users, CornerDownLeft } from '@lucide/svelte';
	import { listProducts } from '$lib/api/products';
	import { listCustomers } from '$lib/api/customers';
	import { productIcon } from '$lib/productIcon';
	import { NAV } from '$lib/nav';
	import { palette } from '$lib/stores/palette.svelte';

	type Item = { kind: string; label: string; sub?: string; href: string; icon: typeof Pill; tint?: string };

	let open = $derived(palette.open);
	function set(v: boolean) {
		palette.open = v;
	}
	let query = $state('');
	let active = $state(0);
	let input = $state<HTMLInputElement>();
	let products = $state<Item[]>([]);
	let customers = $state<Item[]>([]);

	// ⌘K / Ctrl-K toggles the palette anywhere in the app.
	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			toggle();
		}
	}
	function toggle() {
		set(!open);
	}
	// Reset + focus whenever the palette opens.
	$effect(() => {
		if (open) {
			query = '';
			products = [];
			customers = [];
			active = 0;
			input?.focus();
		}
	});

	const navItems = $derived<Item[]>(
		(query.trim()
			? NAV.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase()))
			: NAV
		).map((n) => ({ kind: 'Go to', label: n.label, href: n.href, icon: n.icon }))
	);
	const items = $derived<Item[]>([...navItems, ...products, ...customers]);

	// Debounced entity search while the palette is open.
	$effect(() => {
		if (!open) return;
		const q = query.trim();
		if (!q) {
			products = [];
			customers = [];
			return;
		}
		let cancelled = false;
		const t = setTimeout(async () => {
			const [p, c] = await Promise.all([listProducts({ search: q }), listCustomers({ search: q })]);
			if (cancelled) return;
			products = p.items.slice(0, 6).map((pr) => {
				const fi = productIcon(pr.form);
				return { kind: 'Product', label: pr.name, sub: pr.strength || undefined, href: `/products/${pr.id}`, icon: fi.icon, tint: fi.tint };
			});
			customers = c.items.slice(0, 6).map((cu) => ({ kind: 'Customer', label: cu.name, sub: cu.phone || undefined, href: `/customers/${cu.id}`, icon: Users, tint: 'text-muted' }));
			active = 0;
		}, 180);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	});

	function go(item: Item) {
		set(false);
		goto(item.href);
	}
	function onListKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = Math.min(active + 1, items.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(active - 1, 0);
		} else if (e.key === 'Enter' && items[active]) {
			e.preventDefault();
			go(items[active]);
		} else if (e.key === 'Escape') {
			set(false);
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
		<button type="button" aria-label="Close search" class="fixed inset-0 bg-black/40 backdrop-blur-sm" transition:fade={{ duration: 120 }} onclick={() => set(false)}></button>
		<div class="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-surface-2 bg-surface shadow-2xl" transition:scale={{ duration: 150, start: 0.98, opacity: 0 }}>
			<div class="flex items-center gap-3 border-b border-surface-2 px-4 py-3">
				<Search size={18} class="text-muted" />
				<input
					bind:this={input}
					bind:value={query}
					onkeydown={onListKey}
					placeholder="Search products, customers, or jump to a page…"
					class="w-full bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
				/>
				<kbd class="rounded border border-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">ESC</kbd>
			</div>
			<ul class="max-h-[52vh] overflow-y-auto py-1.5">
				{#each items as item, i (item.kind + item.href)}
					{@const Icon = item.icon}
					<li>
						<button
							type="button"
							onclick={() => go(item)}
							onmouseenter={() => (active = i)}
							class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition {i === active ? 'bg-surface-2/70' : ''}"
						>
							<span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 {item.tint ?? 'text-fg-soft'}"><Icon size={15} /></span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-fg">{item.label}</span>
								{#if item.sub}<span class="block truncate text-xs text-muted">{item.sub}</span>{/if}
							</span>
							<span class="shrink-0 text-[10px] tracking-wide text-muted uppercase">{item.kind}</span>
							{#if i === active}<CornerDownLeft size={13} class="shrink-0 text-muted" />{/if}
						</button>
					</li>
				{:else}
					<li class="px-4 py-6 text-center text-sm text-muted">
						{query.trim() ? 'No results.' : 'Type to search…'}
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
