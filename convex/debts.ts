import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Debt queries
export const listDebts = query({
  handler: async (ctx) => {
    return await ctx.db.query("debts").collect();
  }
});

export const getDebtsByType = query({
  args: {
    type: v.union(v.literal("mortgage"), v.literal("loan"), v.literal("credit_card"), v.literal("crypto"), v.literal("other"))
  },
  handler: async (ctx, { type }) => {
    return await ctx.db
      .query("debts")
      .withIndex("by_type", q => q.eq("type", type))
      .collect();
  }
});

export const getDebtsTotal = query({
  handler: async (ctx) => {
    const debts = await ctx.db.query("debts").collect();
    const debtsTotal = debts.reduce((sum, debt) => sum + debt.value, 0);
    return { debtsTotal };
  }
});

// Debt mutations
export const addDebt = mutation({
  args: {
    name: v.string(),
    value: v.number(),
    type: v.union(v.literal("mortgage"), v.literal("loan"), v.literal("credit_card"), v.literal("crypto"), v.literal("other")),
    metadata: v.optional(v.object({
      description: v.string(),
      startDate: v.number(),
      originalAmount: v.number(),
      interestRate: v.optional(v.number()),
      lender: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      minimumPayment: v.optional(v.number()),
      lastUpdated: v.number()
    })),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("debts", args);
  }
});

export const updateDebt = mutation({
  args: {
    id: v.id("debts"),
    name: v.optional(v.string()),
    value: v.optional(v.number()),
    type: v.optional(v.union(v.literal("mortgage"), v.literal("loan"), v.literal("credit_card"), v.literal("crypto"), v.literal("other"))),
    metadata: v.optional(v.object({
      description: v.string(),
      startDate: v.number(),
      originalAmount: v.number(),
      interestRate: v.optional(v.number()),
      lender: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      minimumPayment: v.optional(v.number()),
      lastUpdated: v.number()
    })),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, { id, ...updates }) => {
    const debt = await ctx.db.get(id);
    if (!debt) {
      throw new Error("Debt not found");
    }
    return await ctx.db.patch(id, updates);
  }
}); 