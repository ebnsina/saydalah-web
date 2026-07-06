<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
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
	<!-- Bottom sheet on phones (items-end, full width), centered dialog on ≥sm. -->
	<div class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto sm:items-center sm:p-4">
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
			class="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-surface-2 bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:my-8 sm:max-w-lg sm:rounded-2xl sm:p-6 sm:pb-6"
			transition:fly={{ y: 80, duration: 240, opacity: 0, easing: cubicOut }}
		>
			<!-- Drag handle (mobile affordance) -->
			<div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-surface-3 sm:hidden"></div>

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
