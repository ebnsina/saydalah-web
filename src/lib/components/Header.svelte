<script lang="ts">
	import { Pill } from '@lucide/svelte';
	import ThemeToggle from './ThemeToggle.svelte';
</script>

<header
	class="sticky top-0 z-20 border-b border-surface-2/70 bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60"
>
	<div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
		<a href="/" class="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
			<span class="grid h-8 w-8 place-items-center rounded-xl bg-accent/15 text-accent">
				<Pill size={18} />
			</span>
			<span class="text-lg text-fg">Saydalah</span>
		</a>
		<nav class="hidden items-center gap-6 text-sm text-muted sm:flex">
			<a href="/" class="transition hover:text-fg">Dashboard</a>
		</nav>
		<ThemeToggle />
	</div>
</header>
