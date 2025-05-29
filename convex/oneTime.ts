import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./users";

export const listOneTimeTransactions = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("oneTimeTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const addOneTimeTransaction = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    date: v.number(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("oneTimeTransactions", { ...args, userId });
  },
});

export const updateOneTimeTransaction = mutation({
  args: {
    id: v.id("oneTimeTransactions"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    date: v.optional(v.number()),
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

export const deleteOneTimeTransaction = mutation({
  args: { id: v.id("oneTimeTransactions") },
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

export const listOneTimeTags = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [] as string[];
    const items = await ctx.db
      .query("oneTimeTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const tagSet = new Set<string>();
    items.forEach((r) => {
      r.tags?.forEach((t: string) => tagSet.add(t));
    });
    return Array.from(tagSet);
  },
});

export const getYearlyTotals = query({
  args: { year: v.number() },
  handler: async (ctx, { year }) => {
    const userId = await getUserId(ctx);
    if (!userId) return { income: 0, expense: 0 };
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();
    const items = await ctx.db
      .query("oneTimeTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    let income = 0;
    let expense = 0;
    items.forEach((i) => {
      if (i.date >= start && i.date < end) {
        if (i.type === "income") income += i.amount;
        else expense += i.amount;
      }
    });
    return { income, expense };
  },
});
