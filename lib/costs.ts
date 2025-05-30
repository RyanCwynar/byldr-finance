import { monthlyAmount } from './recurring';
import { monthlyOneTimeAmount } from './oneTime';

export interface RecurringTransaction {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  daysOfMonth?: number[] | null;
  daysOfWeek?: number[] | null;
}

export interface OneTimeTransaction {
  name: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface CostBreakdownItem {
  name: string;
  amount: number;
}

export function getMonthlyCostBreakdown(
  recurring: RecurringTransaction[],
  oneTime: OneTimeTransaction[]
): CostBreakdownItem[] {
  const totals = new Map<string, number>();

  const add = (name: string, amt: number) => {
    totals.set(name, (totals.get(name) ?? 0) + amt);
  };

  recurring.forEach((r) => {
    if (r.type !== 'expense') return;
    add(r.name, monthlyAmount(r));
  });

  oneTime.forEach((o) => {
    if (o.type !== 'expense') return;
    add(o.name, monthlyOneTimeAmount(o.amount));
  });

  return Array.from(totals.entries()).map(([name, amount]) => ({ name, amount }));
}
