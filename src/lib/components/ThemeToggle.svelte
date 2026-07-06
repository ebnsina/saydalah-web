<script lang="ts">
	import { Sun, Moon } from '@lucide/svelte';
	import { browser } from '$app/environment';

	type Theme = 'light' | 'dark';

	function currentTheme(): Theme {
		if (!browser) return 'light';
		const attr = document.documentElement.dataset.theme;
		if (attr === 'light' || attr === 'dark') return attr;
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	let theme = $state<Theme>(currentTheme());

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			/* storage unavailable (private mode) — ignore */
		}
	}
</script>

<button
	type="button"
	onclick={toggle}
	class="grid h-9 w-9 place-items-center rounded-full border border-surface-2 text-muted transition hover:border-surface-3 hover:text-fg"
	aria-label="Toggle color theme"
	title="Toggle {theme === 'dark' ? 'light' : 'dark'} mode"
>
	{#if theme === 'dark'}
		<Sun size={18} />
	{:else}
		<Moon size={18} />
	{/if}
</button>
