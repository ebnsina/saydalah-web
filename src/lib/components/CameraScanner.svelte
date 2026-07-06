<script lang="ts">
	import { X } from '@lucide/svelte';
	import { fade, scale } from 'svelte/transition';

	let {
		open = $bindable(false),
		ondetected
	}: { open?: boolean; ondetected: (code: string) => void } = $props();

	let video = $state<HTMLVideoElement>();
	let error = $state<string | null>(null);
	let stream: MediaStream | null = null;
	let timer: ReturnType<typeof setInterval> | null = null;

	// BarcodeDetector is a browser global not yet in TS's lib.
	const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

	function stop() {
		if (timer) clearInterval(timer);
		timer = null;
		stream?.getTracks().forEach((t) => t.stop());
		stream = null;
	}

	function close() {
		stop();
		open = false;
	}

	async function start() {
		error = null;
		if (!supported) {
			error = 'This browser can’t scan with the camera. Use a hardware scanner or type the barcode.';
			return;
		}
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const Detector = (window as any).BarcodeDetector;
			const detector = new Detector({
				formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
			});
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			});
			if (video) {
				video.srcObject = stream;
				await video.play();
			}
			timer = setInterval(async () => {
				if (!video) return;
				try {
					const codes = await detector.detect(video);
					if (codes.length > 0 && codes[0].rawValue) {
						const code = codes[0].rawValue as string;
						close();
						ondetected(code);
					}
				} catch {
					/* transient decode error — keep polling */
				}
			}, 300);
		} catch {
			error = 'Could not access the camera. Grant permission, or type the barcode instead.';
		}
	}

	$effect(() => {
		if (open) start();
		return stop;
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button
			type="button"
			aria-label="Close scanner"
			class="fixed inset-0 bg-black/70"
			transition:fade={{ duration: 150 }}
			onclick={close}
		></button>
		<div
			class="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-surface-2 bg-surface"
			transition:scale={{ duration: 180, start: 0.96 }}
		>
			<div class="flex items-center justify-between border-b border-surface-2 px-4 py-3">
				<h2 class="font-semibold text-fg">Scan barcode</h2>
				<button
					onclick={close}
					class="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
				>
					<X size={16} />
				</button>
			</div>
			<div class="relative aspect-[4/3] bg-black">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video bind:this={video} class="h-full w-full object-cover" muted playsinline></video>
				{#if !error}
					<div class="pointer-events-none absolute inset-0 grid place-items-center">
						<div class="h-28 w-56 rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"></div>
					</div>
				{/if}
			</div>
			{#if error}
				<p class="px-4 py-3 text-sm text-red-500">{error}</p>
			{:else}
				<p class="px-4 py-3 text-center text-xs text-muted">Point the camera at a product barcode.</p>
			{/if}
		</div>
	</div>
{/if}
