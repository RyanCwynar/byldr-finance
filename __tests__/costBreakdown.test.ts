import { test, expect } from 'bun:test';
import { getMonthlyCostBreakdown } from '../lib/costs';

const recurring = [
  { name: 'Rent', frequency: 'monthly', amount: 1000, type: 'expense' },
  { name: 'Insurance', frequency: 'yearly', amount: 240, type: 'expense' },
  { name: 'Coffee', frequency: 'monthly', amount: 200, type: 'expense' },
  { name: 'Gym', frequency: 'monthly', amount: 50, type: 'expense', hidden: true }
];

const oneTime = [
  { name: 'Vacation', amount: 1200, type: 'expense' },
  { name: 'Treat', amount: 60, type: 'expense', hidden: true }
];

test('aggregates monthly cost by name and groups small ones', () => {
  const result = getMonthlyCostBreakdown(recurring, oneTime);
  expect(result.find(r => r.label === 'Rent')!.amount).toBe(1000);
  expect(result.find(r => r.label === 'Coffee')!.amount).toBe(200);
  expect(result.find(r => r.label === 'Vacation')!.amount).toBe(100);
  expect(result.find(r => r.label === 'Insurance')!.amount).toBe(20);
  expect(result.find(r => r.label === 'Other')).toBeUndefined();
});
