import { query } from './_generated/server';
import { getUserId } from './users';
import { monthlyAmount } from './recurring';

export const monthlyCostBreakdown = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [] as { tag: string; amount: number }[];

    const recurring = await ctx.db
      .query('recurringTransactions')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    const oneTime = await ctx.db
      .query('oneTimeTransactions')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    const totals = new Map<string, number>();
    const add = (tag: string, amt: number) => {
      totals.set(tag, (totals.get(tag) ?? 0) + amt);
    };

    recurring.forEach(r => {
      if (r.type !== 'expense') return;
      const amt = monthlyAmount(r);
      if (r.tags && r.tags.length > 0) r.tags.forEach(tag => add(tag, amt));
      else add('Other', amt);
    });

    oneTime.forEach(o => {
      if (o.type !== 'expense') return;
      const amt = o.amount / 12;
      if (o.tags && o.tags.length > 0) o.tags.forEach(tag => add(tag, amt));
      else add('Other', amt);
    });
    const totalAmount = Array.from(totals.values()).reduce((s, v) => s + v, 0);
    const threshold = totalAmount * 0.01;
    const result = new Map<string, number>();
    totals.forEach((amt, tag) => {
      if (amt < threshold) {
        result.set('Other', (result.get('Other') ?? 0) + amt);
      } else {
        result.set(tag, amt);
      }
    });

    return Array.from(result.entries())
      .map(([tag, amount]) => ({ tag, amount }))
      .sort((a, b) => b.amount - a.amount);
  }
});
