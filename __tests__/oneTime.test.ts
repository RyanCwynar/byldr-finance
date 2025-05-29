import { test, expect } from 'bun:test';
import { monthlyOneTimeAmount } from '../lib/oneTime';

test('monthlyOneTimeAmount divides by 12', () => {
  expect(monthlyOneTimeAmount(120)).toBe(10);
});

