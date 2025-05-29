import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./users";

export const listRecurringTransactions = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const addRecurringTransaction = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    frequency: v.union(v.literal("monthly"), v.literal("yearly")),
    daysOfMonth: v.optional(v.array(v.number())),
    month: v.optional(v.number()),
    day: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("recurringTransactions", { ...args, userId });
  },
});

export const updateRecurringTransaction = mutation({
  args: {
    id: v.id("recurringTransactions"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    frequency: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    daysOfMonth: v.optional(v.array(v.number())),
    month: v.optional(v.number()),
    day: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...updates }) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not authorized");
    }
    return await ctx.db.patch(id, updates);
  },
});

export const deleteRecurringTransaction = mutation({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, { id }) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(id);
    return true;
  },
});

export function monthlyAmount(t: any): number {
  if (t.frequency === "monthly") {
    const occurrences = t.daysOfMonth ? t.daysOfMonth.length : 1;
    return t.amount * occurrences;
  }
  if (t.frequency === "yearly") {
    return t.amount / 12;
  }
  return 0;
}

export const getMonthlyTotals = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return { monthlyIncome: 0, monthlyCost: 0 };
    const recs = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    let monthlyIncome = 0;
    let monthlyCost = 0;
    recs.forEach((r) => {
      const amt = monthlyAmount(r);
      if (r.type === "income") monthlyIncome += amt;
      else monthlyCost += amt;
    });
    return { monthlyIncome, monthlyCost };
  },
});
