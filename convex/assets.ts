import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Asset queries
export const listAssets = query({
  handler: async (ctx) => {
    return await ctx.db.query("assets").collect();
  }
});

export const getAssetsByType = query({
  args: {
    type: v.union(v.literal("real_estate"), v.literal("stocks"), v.literal("crypto"), v.literal("cash"), v.literal("other"))
  },
  handler: async (ctx, { type }) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_type", q => q.eq("type", type))
      .collect();
  }
});

export const getAssetsTotal = query({
  handler: async (ctx) => {
    const assets = await ctx.db.query("assets").collect();
    const assetsTotal = assets.reduce((sum, asset) => sum + asset.value, 0);
    return { assetsTotal };
  }
});

export const getAsset = query({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Asset mutations
export const addAsset = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("real_estate"), v.literal("stocks"), v.literal("crypto"), v.literal("cash"), v.literal("other")),
    value: v.number(),
    metadata: v.optional(v.object({
      description: v.string(),
      purchaseDate: v.number(),
      purchasePrice: v.number(),
      location: v.optional(v.string()),
      ticker: v.optional(v.string()),
      lastUpdated: v.number(),
    })),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assets", args);
  }
});

export const updateAsset = mutation({
  args: {
    id: v.id("assets"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("real_estate"), v.literal("stocks"), v.literal("crypto"), v.literal("cash"), v.literal("other"))),
    value: v.optional(v.number()),
    metadata: v.optional(v.object({
      description: v.string(),
      purchaseDate: v.number(),
      purchasePrice: v.number(),
      location: v.optional(v.string()),
      ticker: v.optional(v.string()),
      lastUpdated: v.number(),
    })),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, { id, ...updates }) => {
    const asset = await ctx.db.get(id);
    if (!asset) {
      throw new Error("Asset not found");
    }
    return await ctx.db.patch(id, updates);
  }
});

export const deleteAsset = mutation({
  args: {
    id: v.id("assets")
  },
  handler: async (ctx, { id }) => {
    const asset = await ctx.db.get(id);
    if (!asset) {
      throw new Error("Asset not found");
    }
    await ctx.db.delete(id);
    return true;
  }
});

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

