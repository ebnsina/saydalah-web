<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { X } from '@lucide/svelte';

	let {
		open = $bindable(false),
		title = '',
		children
	}: { open?: boolean; title?: string; children: Snippet } = $props();

	function close() {
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
		<!-- Backdrop -->
		<button
			type="button"
			aria-label="Close dialog"
			class="fixed inset-0 bg-black/40 backdrop-blur-sm"
			transition:fade={{ duration: 150 }}
			onclick={close}
		></button>

		<!-- Panel -->
		<div
			role="dialog"
			aria-modal="true"
			class="relative z-10 my-8 w-full max-w-lg rounded-2xl border border-surface-2 bg-surface p-6"
			transition:scale={{ duration: 180, start: 0.96, opacity: 0, easing: cubicOut }}
		>
			<div class="mb-4 flex items-center justify-between gap-4">
				<h2 class="text-lg font-semibold text-fg">{title}</h2>
				<button
					type="button"
					onclick={close}
					class="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
				>
					<X size={16} />
				</button>
			</div>
			{@render children()}
		</div>
	</div>
{/if}
