import { monthlyAmount } from './recurring';
import { monthlyOneTimeAmount } from './oneTime';

export interface RecurringTransaction {
  amount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  daysOfMonth?: number[] | null;
  daysOfWeek?: number[] | null;
  name: string;
  hidden?: boolean;
  tags?: string[];
}

export interface OneTimeTransaction {
  amount: number;
  type: 'income' | 'expense';
  name: string;
  hidden?: boolean;
  tags?: string[];
}

export interface CostBreakdownItem {
  label: string;
  amount: number;
}

export function getMonthlyCostBreakdown(
  recurring: RecurringTransaction[],
  oneTime: OneTimeTransaction[]
): CostBreakdownItem[] {
  const totals = new Map<string, number>();

  const add = (label: string, amt: number) => {
    totals.set(label, (totals.get(label) ?? 0) + amt);
  };

  recurring.forEach((r) => {
    if (r.hidden) return;
    if (r.type !== 'expense') return;
    const amt = monthlyAmount(r);
    add(r.name, amt);
  });

  oneTime.forEach((o) => {
    if (o.hidden) return;
    if (o.type !== 'expense') return;
    const amt = monthlyOneTimeAmount(o.amount);
    add(o.name, amt);
  });

  const total = Array.from(totals.values()).reduce((sum, n) => sum + n, 0);
  const breakdown: CostBreakdownItem[] = [];
  let other = 0;
  for (const [label, amount] of totals.entries()) {
    if (amount / total < 0.01) {
      other += amount;
    } else {
      breakdown.push({ label, amount });
    }
  }
  if (other > 0) breakdown.push({ label: 'Other', amount: other });
  return breakdown.sort((a, b) => b.amount - a.amount);
}

export function getMonthlyCostBreakdownByTags(
  recurring: RecurringTransaction[],
  oneTime: OneTimeTransaction[],
  groups: string[]
): CostBreakdownItem[] {
  const totals = new Map<string, number>();

  const add = (label: string, amt: number) => {
    totals.set(label, (totals.get(label) ?? 0) + amt);
  };

  const assign = (
    item: RecurringTransaction | OneTimeTransaction,
    amt: number
  ) => {
    if ((item as any).hidden) return;
    if (item.type !== 'expense') return;
    const tag = groups.find((g) => item.tags?.includes(g));
    if (tag) add(tag, amt);
    else add(item.name, amt);
  };

  recurring.forEach((r) => assign(r, monthlyAmount(r)));
  oneTime.forEach((o) => assign(o, monthlyOneTimeAmount(o.amount)));

  const total = Array.from(totals.values()).reduce((sum, n) => sum + n, 0);
  const breakdown: CostBreakdownItem[] = [];
  let other = 0;
  for (const [label, amount] of totals.entries()) {
    if (amount / total < 0.01) {
      other += amount;
    } else {
      breakdown.push({ label, amount });
    }
  }
  if (other > 0) breakdown.push({ label: 'Other', amount: other });
  return breakdown.sort((a, b) => b.amount - a.amount);
}
