import { monthlyAmount } from './recurring';
import { monthlyOneTimeAmount } from './oneTime';

export interface RecurringTransaction {
  amount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  daysOfMonth?: number[] | null;
  daysOfWeek?: number[] | null;
  tags?: string[] | null;
}

export interface OneTimeTransaction {
  amount: number;
  type: 'income' | 'expense';
  tags?: string[] | null;
}

export interface CostBreakdownItem {
  tag: string;
  amount: number;
}

export function getMonthlyCostBreakdown(
  recurring: RecurringTransaction[],
  oneTime: OneTimeTransaction[]
): CostBreakdownItem[] {
  const totals = new Map<string, number>();

  const add = (tag: string, amt: number) => {
    totals.set(tag, (totals.get(tag) ?? 0) + amt);
  };

  recurring.forEach((r) => {
    if (r.type !== 'expense') return;
    const amt = monthlyAmount(r);
    if (r.tags && r.tags.length > 0) {
      r.tags.forEach((tag) => add(tag, amt));
    } else {
      add('Other', amt);
    }
  });

  oneTime.forEach((o) => {
    if (o.type !== 'expense') return;
    const amt = monthlyOneTimeAmount(o.amount);
    if (o.tags && o.tags.length > 0) {
      o.tags.forEach((tag) => add(tag, amt));
    } else {
      add('Other', amt);
    }
  });

  return Array.from(totals.entries()).map(([tag, amount]) => ({ tag, amount }));
}
