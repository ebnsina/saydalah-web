<script lang="ts">
	/** Prev/Next pager. Bind `page`; hides itself when everything fits one page. */
	let {
		page = $bindable(1),
		total,
		pageSize = 20,
		noun = 'items'
	}: { page?: number; total: number; pageSize?: number; noun?: string } = $props();

	const lastPage = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const btn =
		'rounded-full border border-surface-2 px-4 py-1.5 transition hover:bg-surface-2 disabled:opacity-40';
</script>

{#if total > pageSize}
	<div class="mt-3 flex items-center justify-between text-sm text-muted">
		<span>{total} {noun}</span>
		<div class="flex items-center gap-2">
			<button onclick={() => (page = Math.max(1, page - 1))} disabled={page <= 1} class={btn}>Prev</button>
			<span>Page {page} of {lastPage}</span>
			<button onclick={() => (page = Math.min(lastPage, page + 1))} disabled={page >= lastPage} class={btn}>Next</button>
		</div>
	</div>
{/if}
