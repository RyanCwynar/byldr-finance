import assert from 'node:assert';
import test from 'node:test';

function monthlyAmount(t) {
  if (t.frequency === 'monthly') {
    const occurrences = t.daysOfMonth ? t.daysOfMonth.length : 1;
    return t.amount * occurrences;
  }
  if (t.frequency === 'weekly') {
    const occurrences = t.daysOfWeek ? t.daysOfWeek.length : 1;
    return (t.amount * occurrences * 52) / 12;
  }
  if (t.frequency === 'quarterly') {
    return t.amount / 3;
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

test('monthlyAmount handles weekly frequency', () => {
  const item = { frequency: 'weekly', amount: 100, daysOfWeek: [1,5] };
  assert.strictEqual(monthlyAmount(item), (100 * 2 * 52) / 12);
});

test('monthlyAmount handles quarterly frequency', () => {
  const item = { frequency: 'quarterly', amount: 300, month: 1, day: 1 };
  assert.strictEqual(monthlyAmount(item), 100);
});
