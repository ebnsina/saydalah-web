/**
 * Primary navigation. Each item maps to a feature area backed by the API.
 * `roles` (when set) restricts the link to those roles; admins see everything.
 */

import type { Role } from '$lib/types';
import {
	LayoutDashboard,
	ShoppingCart,
	Boxes,
	ArrowLeftRight,
	Pill,
	Truck,
	ClipboardList,
	Users,
	FileText,
	ShieldCheck,
	Settings
} from '@lucide/svelte';
import type { Icon as IconType } from '@lucide/svelte';

export interface NavItem {
	href: string;
	label: string;
	icon: typeof IconType;
	roles?: Role[];
}

export const NAV: NavItem[] = [
	{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/sales', label: 'Sales', icon: ShoppingCart },
	{ href: '/inventory', label: 'Inventory', icon: Boxes },
	{ href: '/stock', label: 'Stock ops', icon: ArrowLeftRight, roles: ['manager', 'pharmacist'] },
	{ href: '/products', label: 'Products', icon: Pill },
	{ href: '/purchasing', label: 'Purchasing', icon: Truck, roles: ['manager', 'pharmacist'] },
	{ href: '/prescriptions', label: 'Prescriptions', icon: ClipboardList, roles: ['manager', 'pharmacist'] },
	{ href: '/customers', label: 'Customers', icon: Users },
	{ href: '/reports', label: 'Reports', icon: FileText, roles: ['manager'] },
	{ href: '/admin', label: 'Admin', icon: ShieldCheck, roles: ['manager'] },
	{ href: '/settings', label: 'Settings', icon: Settings }
];

/** Whether a role may see a nav item (admins always may). */
export function canSee(item: NavItem, role: Role | undefined): boolean {
	if (!item.roles || role === 'admin') return true;
	return role !== undefined && item.roles.includes(role);
}
