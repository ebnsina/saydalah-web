/** Staff user endpoints (manager/admin). */

import { get, post, put } from './client';
import type { Page, Role, User } from '$lib/types';

export interface UserInput {
	email: string;
	password: string;
	full_name?: string;
	role: Role;
	branch_id?: string | null;
}

export function listUsers(page = 1): Promise<Page<User>> {
	return get<Page<User>>(`/users?page=${page}`);
}

export function createUser(input: UserInput): Promise<User> {
	return post<User>('/users', input);
}

export function resetPassword(id: string, password: string): Promise<void> {
	return put<void>(`/users/${id}/password`, { password });
}

export function updateUser(
	id: string,
	input: { full_name?: string; role: Role; branch_id?: string | null; active: boolean }
): Promise<User> {
	return put<User>(`/users/${id}`, input);
}
