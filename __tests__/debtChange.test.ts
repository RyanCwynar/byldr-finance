import { test, expect } from 'bun:test';
import { calculateChangeRates } from '../lib/debt';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

test('calculates weekly change when enough data', () => {
  const history = [
    { timestamp: 0, value: 100 },
    { timestamp: WEEK_MS * 2, value: 80 }
  ];
  const { weeklyChange, monthlyChange } = calculateChangeRates(history);
  expect(weeklyChange).toBeCloseTo(-10);
  expect(monthlyChange).toBeNull();
});

test('calculates monthly change when enough data', () => {
  const history = [
    { timestamp: 0, value: 100 },
    { timestamp: MONTH_MS * 2, value: 60 }
  ];
  const { weeklyChange, monthlyChange } = calculateChangeRates(history);
  expect(weeklyChange).toBeCloseTo(-4.666666, 3);
  expect(monthlyChange).toBeCloseTo(-20);
});
