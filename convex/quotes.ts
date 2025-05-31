import {  mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// ==========================================
// Helper Functions
// ==========================================

// Helper function to get all quotes
export async function getQuotesHelper(ctx: QueryCtx): Promise<{ [symbol: string]: number }> {
  const quotes = await ctx.db
    .query("quotes")
    .collect();

  // Convert to dictionary format for easier lookup
  const quotesMap: { [symbol: string]: number } = {};
  quotes.forEach((quote: any) => {
    quotesMap[quote.symbol] = quote.price;
  });

  return quotesMap;
}

// ==========================================
// Queries
// ==========================================

// Get a quote by symbol
export const getQuote = query({
  args: {
    symbol: v.string()
  },
  handler: async (ctx, { symbol }) => {
    // Try to find existing quote
    const quote = await ctx.db
      .query("quotes")
      .withIndex("by_symbol", q => q.eq("symbol", symbol))
      .first();

    return quote;
  }
});

// Get all quotes
export const getQuotes = query({
  handler: async (ctx) => {
    return await getQuotesHelper(ctx);
  }
});

// List all quotes records
export const listQuotes = query({
  handler: async (ctx) => {
    const quotes = await ctx.db
      .query("quotes")
      .collect();
    
    return quotes;
  }
});

// ==========================================
// Mutations
// ==========================================

// Upsert a quote (create or update)
export const upsertQuote = mutation({
  args: {
    symbol: v.string(),
    price: v.number(),
    type: v.optional(v.union(v.literal("crypto"), v.literal("stock"))),
    source: v.optional(v.string()),
    ignored: v.optional(v.boolean())
  },
  handler: async (ctx, { symbol, price, type, source, ignored }) => {
    // Try to find existing quote
    const existingQuote = await ctx.db
      .query("quotes")
      .withIndex("by_symbol", q => q.eq("symbol", symbol))
      .first();

    if (existingQuote) {
      // Update existing quote
      return await ctx.db.patch(existingQuote._id, {
        price,
        lastUpdated: Date.now(),
        type: type || existingQuote.type || "crypto", // Keep existing type if not provided, default to crypto
        ...(ignored !== undefined ? { ignored } : {}), // Only update ignored if provided
        ...(source ? { source } : {})
      });
    } else {
      // Create new quote
      return await ctx.db.insert("quotes", {
        symbol,
        price,
        lastUpdated: Date.now(),
        type: type || "crypto", // Default to crypto if not provided
        ...(ignored !== undefined ? { ignored } : {}), // Only include ignored if provided
        ...(source ? { source } : {})
      });
    }
  }
});

// Toggle a quote's ignored status
export const toggleQuoteIgnored = mutation({
  args: {
    id: v.id("quotes")
  },
  handler: async (ctx, { id }) => {
    const quote = await ctx.db.get(id);
    if (!quote) {
      throw new Error("Quote not found");
    }
    
    return await ctx.db.patch(id, {
      ignored: !quote.ignored
    });
  }
});

// Create a new quote snapshot
export const createSnapshot = mutation({
  handler: async (ctx) => {
    console.log("Creating manual quote snapshot");
    
    // Get all non-ignored quotes
    const quotes = await ctx.db
      .query("quotes")
      .filter(q => q.neq(q.field("ignored"), true))
      .collect();
    
    if (quotes.length === 0) {
      throw new Error("No active quotes found to snapshot");
    }
    
    // Convert quotes to a prices record
    const prices: Record<string, number> = {};
    quotes.forEach(quote => {
      prices[quote.symbol] = quote.price;
    });
    
    // Create the snapshot
    const snapshot = await ctx.db.insert("quoteSnapshots", {
      timestamp: Date.now(),
      prices,
      metadata: {
        description: "Manually created snapshot",
        source: "manual"
      }
    });
    
    console.log(`Created quote snapshot with ID: ${snapshot}`);
    return {
      id: snapshot,
      timestamp: Date.now(),
      quoteCount: Object.keys(prices).length
    };
  }
});

// Get the most recent quote snapshot
export const getLatestSnapshot = query({
  handler: async (ctx) => {
    const snapshot = await ctx.db
      .query("quoteSnapshots")
      .order("desc")
      .first();
    
    return snapshot;
  }
});

// Get a specific snapshot by ID
export const getSnapshot = query({
  args: {
    id: v.id("quoteSnapshots")
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  }
});

// Get snapshots within a date range
export const getSnapshots = query({
  args: {
    startTimestamp: v.number(),
    endTimestamp: v.number(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { startTimestamp, endTimestamp, limit }) => {
    let query = ctx.db
      .query("quoteSnapshots")
      .filter(q => 
        q.and(
          q.gte(q.field("timestamp"), startTimestamp),
          q.lte(q.field("timestamp"), endTimestamp)
        )
      )
      .order("desc");
    
    const snapshots = limit
      ? await query.take(limit)
      : await query.collect();
    
    return snapshots;
  }
});