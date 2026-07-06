/** Runtime settings exposed by the API (e.g. the tax rate). */

import { get } from './client';

export interface Meta {
	tax_rate: number;
}

export function getMeta(): Promise<Meta> {
	return get<Meta>('/meta');
}
