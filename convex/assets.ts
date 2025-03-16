import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Asset queries
export const listAssets = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    if (userId) {
      // If authenticated, return only user's assets
      return await ctx.db
        .query("assets")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
    } else {
      // For backward compatibility, return assets without userId
      return await ctx.db
        .query("assets")
        .filter(q => q.eq(q.field("userId"), undefined))
        .collect();
    }
  }
});

export const getAssetsByType = query({
  args: {
    type: v.union(v.literal("real_estate"), v.literal("stocks"), v.literal("crypto"), v.literal("cash"), v.literal("other"))
  },
  handler: async (ctx, { type }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    if (userId) {
      // If authenticated, return only user's assets of the specified type
      return await ctx.db
        .query("assets")
        .withIndex("by_user_and_type", q => q.eq("userId", userId).eq("type", type))
        .collect();
    } else {
      // For backward compatibility, return assets without userId
      return await ctx.db
        .query("assets")
        .withIndex("by_type", q => q.eq("type", type))
        .filter(q => q.eq(q.field("userId"), undefined))
        .collect();
    }
  }
});

export const getAssetsTotal = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    let assets;
    if (userId) {
      // If authenticated, calculate total for user's assets
      assets = await ctx.db
        .query("assets")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
    } else {
      // For backward compatibility, calculate total for assets without userId
      assets = await ctx.db
        .query("assets")
        .filter(q => q.eq(q.field("userId"), undefined))
        .collect();
    }
    
    const assetsTotal = assets.reduce((sum, asset) => sum + asset.value, 0);
    return { assetsTotal };
  }
});

export const getAsset = query({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    
    // Check if the asset exists
    if (!asset) {
      return null;
    }
    
    // If the asset has a userId, verify the current user has access
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    if (asset.userId && asset.userId !== userId) {
      // User doesn't have access to this asset
      return null;
    }
    
    return asset;
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
    // Get the user ID from authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    // Add the asset with the user ID
    return await ctx.db.insert("assets", {
      ...args,
      userId
    });
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
    // Get the user ID from authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    // Get the asset
    const asset = await ctx.db.get(id);
    if (!asset) {
      throw new Error("Asset not found");
    }
    
    // Check if the user has access to this asset
    if (asset.userId && asset.userId !== userId) {
      throw new Error("Not authorized to update this asset");
    }
    
    // Update the asset
    return await ctx.db.patch(id, updates);
  }
});

export const deleteAsset = mutation({
  args: {
    id: v.id("assets")
  },
  handler: async (ctx, { id }) => {
    // Get the user ID from authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    // Get the asset
    const asset = await ctx.db.get(id);
    if (!asset) {
      throw new Error("Asset not found");
    }
    
    // Check if the user has access to this asset
    if (asset.userId && asset.userId !== userId) {
      throw new Error("Not authorized to delete this asset");
    }
    
    // Delete the asset
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

