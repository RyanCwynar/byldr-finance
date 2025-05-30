import { query } from './_generated/server';
import { getUserId } from './users';
import { monthlyAmount } from './recurring';

export const monthlyCostBreakdown = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [] as { name: string; amount: number }[];

    const recurring = await ctx.db
      .query('recurringTransactions')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    const oneTime = await ctx.db
      .query('oneTimeTransactions')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    const totals = new Map<string, number>();
    const add = (name: string, amt: number) => {
      totals.set(name, (totals.get(name) ?? 0) + amt);
    };

    recurring.forEach(r => {
      if (r.type !== 'expense') return;
      add(r.name, monthlyAmount(r));
    });

    oneTime.forEach(o => {
      if (o.type !== 'expense') return;
      const amt = o.amount / 12;
      add(o.name, amt);
    });

    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }
});
