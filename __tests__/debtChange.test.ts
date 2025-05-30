import { test, expect } from 'bun:test';
import { calculateChangeRates } from '../lib/debt';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

test('calculates weekly change using most recent week of data', () => {
  const history = [
    { timestamp: 0, value: 200 },
    { timestamp: WEEK_MS * 3, value: 150 }, // ignored - older than a week
    { timestamp: WEEK_MS * 4, value: 120 }, // start of last week
    { timestamp: WEEK_MS * 5, value: 100 } // latest
  ];
  const { weeklyChange, monthlyChange } = calculateChangeRates(history);
  expect(weeklyChange).toBeCloseTo(-20);
  expect(monthlyChange).toBeCloseTo(-107.142857, 3);
});

test('calculates monthly change using most recent month of data', () => {
  const history = [
    { timestamp: 0, value: 100 }, // ignored - older than a month
    { timestamp: MONTH_MS, value: 80 },
    { timestamp: MONTH_MS * 2, value: 60 }
  ];
  const { weeklyChange, monthlyChange } = calculateChangeRates(history);
  expect(weeklyChange).toBeNull();
  expect(monthlyChange).toBeCloseTo(-20);
});
