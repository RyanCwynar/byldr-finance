import { test, expect } from 'bun:test';
import { formatCompactNumber } from '../lib/formatters';

test('formats numbers with compact notation and lowercase suffix', () => {
  expect(formatCompactNumber(440000)).toBe('440k');
});
