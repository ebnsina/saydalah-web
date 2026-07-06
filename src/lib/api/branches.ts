/** Branch endpoints. */

import { get } from './client';
import type { Branch, Page } from '$lib/types';

export function listBranches(): Promise<Page<Branch>> {
	return get<Page<Branch>>('/branches?page_size=100');
}
