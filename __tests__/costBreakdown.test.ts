import { test, expect } from 'bun:test';
import { getMonthlyCostBreakdown } from '../lib/costs';

const recurring = [
  { name: 'Rent', frequency: 'monthly', amount: 1000, type: 'expense' },
  { name: 'Insurance', frequency: 'yearly', amount: 240, type: 'expense' },
  { name: 'Misc', frequency: 'monthly', amount: 200, type: 'expense' }
];

const oneTime = [
  { name: 'Vacation', amount: 1200, type: 'expense' }
];

test('aggregates monthly cost by name', () => {
  const result = getMonthlyCostBreakdown(recurring, oneTime);
  expect(result.find(r => r.name === 'Rent')!.amount).toBe(1000);
  expect(result.find(r => r.name === 'Insurance')!.amount).toBe(20);
  expect(result.find(r => r.name === 'Vacation')!.amount).toBe(100);
  expect(result.find(r => r.name === 'Misc')!.amount).toBe(200);
});
