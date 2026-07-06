<script lang="ts">
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	let { rows = 6, cols = 4 }: { rows?: number; cols?: number } = $props();
</script>

<div class="overflow-hidden rounded-2xl border border-surface-2">
	{#each Array(rows) as _, i (i)}
		<div class="flex items-center gap-4 border-b border-surface-2 px-4 py-3.5 last:border-0">
			{#each Array(cols) as _, j (j)}
				<Skeleton class="h-4 {j === 0 ? 'w-44' : 'flex-1'}" />
			{/each}
		</div>
	{/each}
</div>
