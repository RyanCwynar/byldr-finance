import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Debt queries
export const listDebts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    if (userId) {
      // If authenticated, return only user's debts
      return await ctx.db
        .query("debts")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
    } else {
      // For backward compatibility, return debts without userId
      return await ctx.db
        .query("debts")
        .filter(q => q.eq(q.field("userId"), undefined))
        .collect();
    }
  }
});

export const getDebt = query({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const debt = await ctx.db.get(args.id);
    
    // Check if the debt exists
    if (!debt) {
      return null;
    }
    
    // If the debt has a userId, verify the current user has access
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    if (debt.userId && debt.userId !== userId) {
      // User doesn't have access to this debt
      return null;
    }
    
    return debt;
  },
});

export const getDebtsByType = query({
  args: {
    type: v.union(v.literal("mortgage"), v.literal("loan"), v.literal("credit_card"), v.literal("crypto"), v.literal("other"))
  },
  handler: async (ctx, { type }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    if (userId) {
      // If authenticated, return only user's debts of the specified type
      return await ctx.db
        .query("debts")
        .withIndex("by_user_and_type", q => q.eq("userId", userId).eq("type", type))
        .collect();
    } else {
      // For backward compatibility, return debts without userId
      return await ctx.db
        .query("debts")
        .withIndex("by_type", q => q.eq("type", type))
        .filter(q => q.eq(q.field("userId"), undefined))
        .collect();
    }
  }
});

export const getDebtsTotal = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    let debts;
    if (userId) {
      // If authenticated, calculate total for user's debts
      debts = await ctx.db
        .query("debts")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
    } else {
      // For backward compatibility, calculate total for debts without userId
      debts = await ctx.db
        .query("debts")
        .filter(q => q.eq(q.field("userId"), undefined))
        .collect();
    }
    
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
    // Get the user ID from authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    // Add the debt with the user ID
    const debtId = await ctx.db.insert("debts", {
      ...args,
      userId
    });

    // Record the initial value in history
    await ctx.db.insert("debtHistory", {
      debtId,
      timestamp: Date.now(),
      value: args.value
    });

    return debtId;
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
    // Get the user ID from authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    // Get the debt
    const debt = await ctx.db.get(id);
    if (!debt) {
      throw new Error("Debt not found");
    }
    
    // Check if the user has access to this debt
    if (debt.userId && debt.userId !== userId) {
      throw new Error("Not authorized to update this debt");
    }
    
    // Update the debt
    const updated = await ctx.db.patch(id, updates);

    // Record value change if provided
    if (updates.value !== undefined && updates.value !== debt.value) {
      await ctx.db.insert("debtHistory", {
        debtId: id,
        timestamp: Date.now(),
        value: updates.value
      });
    }

    return updated;
  }
});

export const deleteDebt = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    // Get the user ID from authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    // Get the debt
    const debt = await ctx.db.get(args.id);
    if (!debt) {
      throw new Error("Debt not found");
    }
    
    // Check if the user has access to this debt
    if (debt.userId && debt.userId !== userId) {
      throw new Error("Not authorized to delete this debt");
    }
    
    // Delete the debt
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Get history of a debt's value changes
export const getDebtHistory = query({
  args: { debtId: v.id("debts") },
  handler: async (ctx, { debtId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const debt = await ctx.db.get(debtId);
    if (!debt) throw new Error("Debt not found");

    if (debt.userId && debt.userId !== userId) {
      throw new Error("Not authorized to view this debt");
    }

    return await ctx.db
      .query("debtHistory")
      .withIndex("by_debt", q => q.eq("debtId", debtId))
      .order("asc")
      .collect();
  },
});

// Manually add a historical value entry for a debt
export const addDebtHistoryEntry = mutation({
  args: {
    debtId: v.id("debts"),
    timestamp: v.number(),
    value: v.number(),
  },
  handler: async (ctx, { debtId, timestamp, value }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const debt = await ctx.db.get(debtId);
    if (!debt) throw new Error("Debt not found");

    if (debt.userId && debt.userId !== userId) {
      throw new Error("Not authorized to update this debt");
    }

    return await ctx.db.insert("debtHistory", { debtId, timestamp, value });
  },
});

// Update an existing debt history entry
export const updateDebtHistoryEntry = mutation({
  args: {
    id: v.id("debtHistory"),
    timestamp: v.optional(v.number()),
    value: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const entry = await ctx.db.get(id);
    if (!entry) throw new Error("Entry not found");

    const debt = await ctx.db.get(entry.debtId);
    if (!debt) throw new Error("Debt not found");

    if (debt.userId && debt.userId !== userId) {
      throw new Error("Not authorized to update this debt");
    }

    return await ctx.db.patch(id, updates);
  },
});

// Delete a debt history entry
export const deleteDebtHistoryEntry = mutation({
  args: { id: v.id("debtHistory") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const entry = await ctx.db.get(id);
    if (!entry) throw new Error("Entry not found");

    const debt = await ctx.db.get(entry.debtId);
    if (!debt) throw new Error("Debt not found");

    if (debt.userId && debt.userId !== userId) {
      throw new Error("Not authorized to update this debt");
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});
