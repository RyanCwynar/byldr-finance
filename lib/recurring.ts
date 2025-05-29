export function monthlyAmount(t: {
  frequency: 'monthly' | 'yearly';
  amount: number;
  daysOfMonth?: number[] | null;
}): number {
  if (t.frequency === 'monthly') {
    const occurrences = t.daysOfMonth && t.daysOfMonth.length > 0 ? t.daysOfMonth.length : 1;
    return t.amount * occurrences;
  }
  if (t.frequency === 'yearly') {
    return t.amount / 12;
  }
  return 0;
}
