import type { HandleClientError } from '@sveltejs/kit';

/**
 * Last-resort handler for uncaught client errors. It logs for diagnostics and
 * returns a safe message for the +error.svelte boundary. Expected API/data
 * errors are surfaced inline by each page from the API envelope — this only
 * catches the unexpected.
 */
export const handleError: HandleClientError = ({ error, status, message }) => {
	console.error('[client error]', error);
	return {
		message: status >= 500 ? 'An unexpected error occurred. Please try again.' : message
	};
};
