import { test, expect } from 'bun:test';
import { formatCompactCurrency } from '../lib/formatters';

test('formats large values with compact notation', () => {
  expect(formatCompactCurrency(1250000)).toBe('$1.25M');
});
