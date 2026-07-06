import { describe, it, expect } from 'vitest';
import { toCSV } from './csv';

describe('toCSV', () => {
	it('joins headers and rows', () => {
		expect(toCSV(['A', 'B'], [['1', '2']])).toBe('A,B\n1,2');
	});

	it('quotes cells containing commas, quotes, or newlines', () => {
		const csv = toCSV(['name', 'note'], [['a,b', 'he said "hi"']]);
		expect(csv).toBe('name,note\n"a,b","he said ""hi"""');
	});

	it('accepts numbers', () => {
		expect(toCSV(['n'], [[42]])).toBe('n\n42');
	});
});
