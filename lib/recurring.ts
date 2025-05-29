export function monthlyAmount(t: {
  frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  amount: number;
  daysOfMonth?: number[] | null;
  daysOfWeek?: number[] | null;
}): number {
  if (t.frequency === 'monthly') {
    const occurrences = t.daysOfMonth && t.daysOfMonth.length > 0 ? t.daysOfMonth.length : 1;
    return t.amount * occurrences;
  }
  if (t.frequency === 'weekly') {
    const occurrences = t.daysOfWeek && t.daysOfWeek.length > 0 ? t.daysOfWeek.length : 1;
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
