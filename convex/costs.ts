import { query } from './_generated/server';
import { getUserId } from './users';
import { monthlyAmount } from './recurring';

export const monthlyCostBreakdown = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [] as { label: string; amount: number }[];

    const recurring = await ctx.db
      .query('recurringTransactions')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    const oneTime = await ctx.db
      .query('oneTimeTransactions')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    const totals = new Map<string, number>();
    const add = (label: string, amt: number) => {
      totals.set(label, (totals.get(label) ?? 0) + amt);
    };

    recurring.forEach(r => {
      if (r.type !== 'expense') return;
      const amt = monthlyAmount(r);
      add(r.name, amt);
    });

    oneTime.forEach(o => {
      if (o.type !== 'expense') return;
      const amt = o.amount / 12;
      add(o.name, amt);
    });

    const total = Array.from(totals.values()).reduce((s, n) => s + n, 0);
    const result: { label: string; amount: number }[] = [];
    let other = 0;
    for (const [label, amount] of totals.entries()) {
      if (amount / total < 0.01) {
        other += amount;
      } else {
        result.push({ label, amount });
      }
    }
    if (other > 0) result.push({ label: 'Other', amount: other });
    return result.sort((a, b) => b.amount - a.amount);
  }
});
