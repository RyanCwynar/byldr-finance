import assert from 'node:assert';
import test from 'node:test';

function monthlyAmount(t) {
  if (t.frequency === 'monthly') {
    const occurrences = t.daysOfMonth ? t.daysOfMonth.length : 1;
    return t.amount * occurrences;
  }
  if (t.frequency === 'yearly') {
    return t.amount / 12;
  }
  return 0;
}

test('monthlyAmount handles monthly frequency with multiple days', () => {
  const item = { frequency: 'monthly', amount: 6000, daysOfMonth: [1,15] };
  assert.strictEqual(monthlyAmount(item), 12000);
});

test('monthlyAmount handles yearly frequency', () => {
  const item = { frequency: 'yearly', amount: 120, month: 4, day: 12 };
  assert.strictEqual(monthlyAmount(item), 10);
});
