import { test, expect } from 'bun:test';
import { getMonthlyCostBreakdownByTags } from '../lib/costs';

const recurring = [
  { name: 'Rent', frequency: 'monthly', amount: 1000, type: 'expense', tags: ['housing'] },
  { name: 'Netflix', frequency: 'monthly', amount: 20, type: 'expense', tags: ['subscription','entertainment'] },
];

const oneTime = [
  { name: 'Laptop', amount: 1200, type: 'expense', tags: ['electronics','work'] }
];

test('groups expenses by selected tags in priority order', () => {
  const result = getMonthlyCostBreakdownByTags(recurring, oneTime, ['subscription','housing']);
  expect(result.find(r => r.label === 'housing')!.amount).toBe(1000);
  expect(result.find(r => r.label === 'subscription')!.amount).toBe(20);
  expect(result.find(r => r.label === 'Laptop')!.amount).toBe(100);
});

