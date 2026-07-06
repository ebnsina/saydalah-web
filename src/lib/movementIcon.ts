/** Maps a stock-movement type to a Lucide icon + tint for the ledger. */

import {
	Truck,
	ShoppingCart,
	SlidersHorizontal,
	Undo2,
	ArrowDownLeft,
	ArrowUpRight,
	ClipboardCheck,
	PackageX,
	Package
} from '@lucide/svelte';
import type { Icon as IconType } from '@lucide/svelte';

interface MoveIcon {
	icon: typeof IconType;
	tint: string;
}

const MAP: Record<string, MoveIcon> = {
	purchase: { icon: Truck, tint: 'text-emerald-500' },
	sale: { icon: ShoppingCart, tint: 'text-rose-500' },
	adjustment: { icon: SlidersHorizontal, tint: 'text-amber-500' },
	return: { icon: Undo2, tint: 'text-emerald-500' },
	transfer_in: { icon: ArrowDownLeft, tint: 'text-emerald-500' },
	transfer_out: { icon: ArrowUpRight, tint: 'text-rose-500' },
	stock_take: { icon: ClipboardCheck, tint: 'text-sky-500' },
	purchase_return: { icon: PackageX, tint: 'text-rose-500' }
};

export function movementIcon(type: string): MoveIcon {
	return MAP[type] ?? { icon: Package, tint: 'text-muted' };
}
