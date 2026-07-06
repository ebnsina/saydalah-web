/**
 * Maps a product's dosage form to a Lucide icon + tint, so lists read at a
 * glance (capsule, tablet, syrup, injection…). Falls back to a generic pill.
 */

import { Pill, Tablets, Droplet, Syringe, SprayCan, Wind, FlaskConical } from '@lucide/svelte';
import type { Icon as IconType } from '@lucide/svelte';

interface FormIcon {
	icon: typeof IconType;
	tint: string; // tailwind text color for the glyph
}

const DEFAULT: FormIcon = { icon: Pill, tint: 'text-accent' };

const MAP: Record<string, FormIcon> = {
	capsule: { icon: Pill, tint: 'text-accent' },
	tablet: { icon: Tablets, tint: 'text-indigo-500' },
	syrup: { icon: FlaskConical, tint: 'text-amber-500' },
	suspension: { icon: FlaskConical, tint: 'text-amber-500' },
	solution: { icon: FlaskConical, tint: 'text-amber-500' },
	drops: { icon: Droplet, tint: 'text-sky-500' },
	drop: { icon: Droplet, tint: 'text-sky-500' },
	injection: { icon: Syringe, tint: 'text-rose-500' },
	cream: { icon: SprayCan, tint: 'text-teal-500' },
	ointment: { icon: SprayCan, tint: 'text-teal-500' },
	gel: { icon: SprayCan, tint: 'text-teal-500' },
	inhaler: { icon: Wind, tint: 'text-emerald-500' },
	spray: { icon: Wind, tint: 'text-emerald-500' }
};

export function productIcon(form: string | undefined | null): FormIcon {
	if (!form) return DEFAULT;
	return MAP[form.trim().toLowerCase()] ?? DEFAULT;
}
