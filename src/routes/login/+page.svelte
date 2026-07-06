<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '$lib/api/auth';
	import { validate, loginSchema } from '$lib/validation';
	import { Pill, Building2, CalendarClock, BarChart3, ShieldCheck } from '@lucide/svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	// Server error text is whatever the API returned — the API is the source of truth.
	let error = $state<string | null>(null);

	const highlights = [
		{ icon: Building2, title: 'Multi-branch', desc: 'One catalog, stock scoped per store.' },
		{ icon: CalendarClock, title: 'Batch & expiry', desc: 'FEFO dispensing, never sell expired.' },
		{ icon: BarChart3, title: 'Live reports', desc: 'Sales, valuation, day-end at a glance.' },
		{ icon: ShieldCheck, title: 'Role-based access', desc: 'Cashiers, pharmacists, managers.' }
	];

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;

		// zod validates input shape before we hit the network.
		const result = validate(loginSchema, { email, password });
		if (result.errors) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};

		submitting = true;
		try {
			await login(email, password);
			await goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in — Saydalah</title>
</svelte:head>

<div class="grid min-h-screen lg:grid-cols-2">
	<!-- Branded visual panel (hidden on small screens) -->
	<div class="relative hidden overflow-hidden bg-gradient-to-br from-accent/80 via-accent/85 to-accent-strong/90 p-12 text-accent-contrast lg:flex lg:flex-col">
		<!-- Organic blobs -->
		<div class="pointer-events-none absolute -top-24 -left-16 h-96 w-96 rounded-full bg-white/15 blur-3xl"></div>
		<div class="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-black/10 blur-3xl"></div>
		<div class="pointer-events-none absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>

		<div class="relative flex items-center gap-3">
			<span class="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur"><Pill size={24} /></span>
			<span class="text-2xl font-bold tracking-tight">Saydalah</span>
		</div>

		<div class="relative mt-auto max-w-md">
			<h2 class="text-3xl font-bold leading-tight tracking-tight">Run your pharmacy chain with confidence.</h2>
			<p class="mt-3 text-accent-contrast/80">Point of sale, inventory, purchasing, and prescriptions — one clean system across every branch.</p>

			<ul class="mt-8 grid grid-cols-2 gap-4">
				{#each highlights as h (h.title)}
					{@const Icon = h.icon}
					<li class="flex items-start gap-3">
						<span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur"><Icon size={17} /></span>
						<span>
							<span class="block text-sm font-semibold">{h.title}</span>
							<span class="block text-xs text-accent-contrast/70">{h.desc}</span>
						</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="relative mt-10 text-xs text-accent-contrast/60">© Saydalah Pharmacy · Internal system</div>
	</div>

	<!-- Form panel -->
	<div class="flex items-center justify-center bg-bg px-6 py-16">
		<div class="w-full max-w-sm">
			<!-- Compact logo for mobile (visual panel is hidden there) -->
			<div class="mb-8 flex items-center gap-2 lg:hidden">
				<span class="grid h-10 w-10 place-items-center rounded-2xl bg-accent/15 text-accent"><Pill size={22} /></span>
				<span class="text-xl font-bold tracking-tight text-fg">Saydalah</span>
			</div>

			<h1 class="text-2xl font-semibold tracking-tight text-fg">Welcome back</h1>
			<p class="mt-1 text-sm text-muted">Sign in to your pharmacy branch dashboard.</p>

			<form class="mt-8 flex flex-col gap-4" onsubmit={handleSubmit}>
				<TextInput
					label="Email"
					type="email"
					bind:value={email}
					placeholder="you@pharmacy.com"
					error={fieldErrors.email}
				/>
				<TextInput
					label="Password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					error={fieldErrors.password}
				/>

				{#if error}
					<p class="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
				{/if}

				<Button type="submit" disabled={submitting} class="mt-2 w-full">
					{submitting ? 'Signing in…' : 'Sign in'}
				</Button>
			</form>
		</div>
	</div>
</div>
