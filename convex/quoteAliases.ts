import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listAliases = query({
  handler: async (ctx) => {
    return await ctx.db.query("quoteAliases").collect();
  }
});

export const getAlias = query({
  args: { symbol: v.string() },
  handler: async (ctx, { symbol }) => {
    return await ctx.db
      .query("quoteAliases")
      .withIndex("by_symbol", q => q.eq("symbol", symbol))
      .first();
  }
});

export const upsertAlias = mutation({
  args: {
    symbol: v.string(),
    quoteSymbol: v.optional(v.string()),
    fixedPrice: v.optional(v.number()),
    quoteType: v.optional(v.union(v.literal("crypto"), v.literal("stock")))
  },
  handler: async (ctx, { symbol, quoteSymbol, fixedPrice, quoteType }) => {
    const existing = await ctx.db
      .query("quoteAliases")
      .withIndex("by_symbol", q => q.eq("symbol", symbol))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        quoteSymbol,
        fixedPrice,
        quoteType
      });
    } else {
      return await ctx.db.insert("quoteAliases", {
        symbol,
        quoteSymbol,
        fixedPrice,
        quoteType
      });
    }
  }
});

export const deleteAlias = mutation({
  args: { id: v.id("quoteAliases") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  }
});
