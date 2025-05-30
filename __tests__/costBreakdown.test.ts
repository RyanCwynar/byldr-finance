import { test, expect } from 'bun:test';
import { getMonthlyCostBreakdown } from '../lib/costs';

const recurring = [
  { frequency: 'monthly', amount: 1000, type: 'expense', tags: ['rent'] },
  { frequency: 'yearly', amount: 240, type: 'expense', tags: ['insurance'] },
  { frequency: 'monthly', amount: 200, type: 'expense' }
];

const oneTime = [
  { amount: 1200, type: 'expense', tags: ['vacation'] }
  ,{ amount: 5, type: 'expense', tags: ['coffee'] }
];

test('aggregates monthly cost by tag', () => {
  const result = getMonthlyCostBreakdown(recurring, oneTime);
  expect(result.find(r => r.tag === 'rent')!.amount).toBe(1000);
  expect(result.find(r => r.tag === 'insurance')!.amount).toBe(20);
  expect(result.find(r => r.tag === 'vacation')!.amount).toBe(100);
  expect(result.find(r => r.tag === 'Other')!.amount).toBeCloseTo(200 + 5/12);
  expect(result.some(r => r.tag === 'coffee')).toBe(false);
});
