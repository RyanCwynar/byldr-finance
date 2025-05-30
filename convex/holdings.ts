import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { getQuotesHelper } from "./quotes";
import { getUserIdentity } from "./users";

type Wallet = Doc<"wallets">;
type Holding = Doc<"holdings">;
// Helper function to list holdings
export async function listHoldingsHelper(ctx: QueryCtx, filter?: {
  walletId?: Id<"wallets">,
  userId?: string,
  includeDebts?: boolean,
  debtsOnly?: boolean
}) {
  console.log("listHoldingsHelper called with filter:", filter);
  
  let q = ctx.db.query("holdings").filter(q => q.eq(q.field("ignore"), false));

  // Filter by either walletId or userId, but not both
  if (filter?.walletId && filter?.userId) {
    throw new Error("Cannot filter by both walletId and userId");
  }

  if (filter?.walletId) {
    console.log("Filtering by walletId:", filter.walletId);
    q = q.filter(q => q.eq(q.field("walletId"), filter.walletId));
  } else if (filter?.userId) {
    console.log("Filtering by userId:", filter.userId);
    q = q.filter(q => q.eq(q.field("userId"), filter.userId));
  }

  // Handle debt filtering
  if (filter?.debtsOnly) {
    console.log("Filtering for debts only");
    // Only show debts
    q = q.filter(q => q.eq(q.field("isDebt"), true));
  } else if (!filter?.includeDebts) {
    console.log("Filtering out debts");
    // Default: only show assets (not debts)
    q = q.filter(q => q.eq(q.field("isDebt"), false));
  } else {
    console.log("Including both assets and debts");
  }

  const holdings = await q.collect();
  console.log("Found holdings:", holdings.length);
  return holdings;
}

// Query endpoint to list holdings
export const listHoldings = query({
  args: {
    filter: v.optional(v.object({
      walletId: v.optional(v.id("wallets")),
      includeDebts: v.optional(v.boolean()),
      debtsOnly: v.optional(v.boolean())
    }))
  },
  handler: async (ctx, args) => {
    return await listHoldingsHelper(ctx, args.filter);
  }
});

// Helper function to get holdings value
export async function getHoldingsValueHelper(ctx: QueryCtx, walletIds?: Id<"wallets">[]) {
  console.log("getHoldingsValueHelper called with walletIds:", walletIds);
  
  // If no wallet IDs are provided, return empty results
  if (!walletIds || walletIds.length === 0) {
    console.log("No wallet IDs provided, returning empty results");
    return {
      total: {
        assets: 0,
        debts: 0,
        value: 0
      },
      walletValues: {},
      prices: {}
    };
  }
  
  // Process one wallet at a time
  const allHoldings = [];
  for (const walletId of walletIds) {
    const holdings = await listHoldingsHelper(ctx, {
      walletId,
      includeDebts: true // Include both assets and debts
    });
    allHoldings.push(...holdings);
  }
  
  console.log("Holdings found:", allHoldings.length);
  
  // Get unique symbols
  const symbols = new Set<string>();
  allHoldings.forEach((holding: Holding) => {
    symbols.add(holding.quoteSymbol || holding.symbol);
  });
  
  console.log("Unique symbols:", Array.from(symbols));

  // Get prices
  const prices: { [symbol: string]: number } = await getQuotesHelper(ctx);
  console.log("Prices retrieved:", Object.keys(prices).length);
  
  // Track assets and debts by wallet
  const walletAssets = new Map<string, number>();
  const walletDebts = new Map<string, number>();
  
  allHoldings.forEach((holding: Holding) => {
    const symbol = holding.quoteSymbol || holding.symbol;
    const price = prices[symbol] || 0;
    const value = holding.quantity * price;
    
    console.log("Processing holding:", {
      symbol,
      quantity: holding.quantity,
      price,
      value,
      isDebt: holding.isDebt,
      walletId: holding.walletId
    });

    // Convert wallet ID to string for consistent key usage
    const walletIdStr = holding.walletId.toString();

    if (holding.isDebt) {
      const currentDebt = walletDebts.get(walletIdStr) || 0;
      walletDebts.set(walletIdStr, currentDebt + value);
    } else {
      const currentAsset = walletAssets.get(walletIdStr) || 0;
      walletAssets.set(walletIdStr, currentAsset + value);
    }
  });
  
  console.log("Wallet assets:", Array.from(walletAssets.entries()));
  console.log("Wallet debts:", Array.from(walletDebts.entries()));

  // Calculate totals
  let totalAssets = 0;
  let totalDebts = 0;
  const walletValues: {[key: string]: {assets: number, debts: number, value: number}} = {};

  // Convert maps to return object and calculate totals
  walletAssets.forEach((assetValue, walletIdStr) => {
    const debtValue = walletDebts.get(walletIdStr) || 0;
    walletValues[walletIdStr] = {
      assets: assetValue,
      debts: debtValue,
      value: assetValue - debtValue
    };
    totalAssets += assetValue;
    totalDebts += debtValue;
  });

  // Handle wallets that only have debts
  walletDebts.forEach((debtValue, walletIdStr) => {
    if (!walletAssets.has(walletIdStr)) {
      walletValues[walletIdStr] = {
        assets: 0,
        debts: debtValue,
        value: -debtValue
      };
    }
  });
  
  // Ensure all requested wallet IDs have entries in the result
  walletIds.forEach(walletId => {
    const walletIdStr = walletId.toString();
    if (!walletValues[walletIdStr]) {
      console.log("Adding empty entry for wallet:", walletIdStr);
      walletValues[walletIdStr] = {
        assets: 0,
        debts: 0,
        value: 0
      };
    }
  });
  
  console.log("Final wallet values:", walletValues);

  return {
    total: {
      assets: totalAssets,
      debts: totalDebts,
      value: totalAssets - totalDebts
    },
    walletValues,
    prices
  };
}

// Query endpoint to get holdings value
export const getHoldingsValue = query({
  args: {
    walletIds: v.optional(v.array(v.id("wallets"))),
  },
  handler: async (ctx, { walletIds }) => {
    return await getHoldingsValueHelper(ctx, walletIds);
  }
});

// Get all asset holdings (non-debt holdings)
export const getAssetHoldings = query({
  handler: async (ctx) => {
    const holdings = await ctx.db
      .query("holdings")
      .filter(q => q.eq(q.field("isDebt"), false))
      .collect();

    return {
      assets: holdings
    };
  }
});

// Get asset holdings grouped by symbol
export const getAssetHoldingsBySymbol = query({
  handler: async (ctx) => {
    const holdings = await ctx.runQuery(api.holdings.listHoldings, {});

    const holdingsBySymbol: {[key: string]: number} = {};
    holdings.forEach((holding: Holding) => {
      const symbol = holding.quoteSymbol || holding.symbol;
      holdingsBySymbol[symbol] = (holdingsBySymbol[symbol] || 0) + holding.quantity;
    });

    return holdingsBySymbol;
  }
});

// Get all holdings marked as debts
export const getDebtHoldings = query({
  handler: async (ctx) => {
    const holdings = await ctx.db
      .query("holdings")
      .filter(q => q.eq(q.field("isDebt"), true))
      .collect();

    return {
      debts: holdings
    };
  }
});

// Get debt holdings grouped by symbol
export const getDebtHoldingsBySymbol = query({
  handler: async (ctx) => {
    const holdings = await ctx.db
      .query("holdings")
      .filter(q => q.eq(q.field("isDebt"), true))
      .collect();

    const debtsBySymbol: {[key: string]: number} = {};
    holdings.forEach((holding) => {
      const symbol = holding.quoteSymbol || holding.symbol;
      debtsBySymbol[symbol] = (debtsBySymbol[symbol] || 0) + holding.quantity;
    });

    return debtsBySymbol;
  }
});

// Upsert a holding (create or update)
export const upsertHolding = mutation({
    args: {
      walletId: v.id("wallets"),
      symbol: v.string(),
      chain: v.string(),
      quantity: v.number(),
      ignore: v.optional(v.boolean()),
      quoteSymbol: v.optional(v.string()),
      isDebt: v.optional(v.boolean()),
      quoteType: v.optional(v.union(v.literal("crypto"), v.literal("stock")))
    },
    handler: async (ctx, { walletId, symbol, quantity, chain, ignore, quoteSymbol, isDebt, quoteType }) => {
      // Get the user ID from authentication
      const identity = await getUserIdentity(ctx);
      const authUserId = identity?.subject;
      
      // Check if wallet exists
      const wallet = await ctx.db.get(walletId);
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      
      // Determine the userId to use:
      // 1. If authenticated, use the authenticated user's ID
      // 2. If not authenticated but wallet has a userId, use the wallet's userId (for actions)
      // 3. If neither, throw an error
      let userId = authUserId;
      
      if (!userId) {
        // If no authenticated user, check if wallet has a userId
        if (wallet.userId) {
          userId = wallet.userId;
          console.log("Using wallet's userId for upsertHolding:", userId);
        } else {
          throw new Error("Authentication required to upsert holdings and wallet has no userId");
        }
      } else {
        // If authenticated, check if user has access to this wallet
        if (wallet.userId && wallet.userId !== userId) {
          throw new Error("Not authorized to modify holdings for this wallet");
        }
      }
  
      // Try to find existing holding
      const existingHolding = await ctx.db
        .query("holdings")
        .withIndex("by_symbol_and_wallet_and_chain", q => 
          q.eq("symbol", symbol).eq("walletId", walletId).eq("chain", chain)
        )
        .first();
  
      if (existingHolding) {
        // Update existing holding
        return await ctx.db.patch(existingHolding._id, {
          quantity,
          chain: chain || "ethereum",
          lastUpdated: Date.now(),
          ignore: ignore !== undefined ? ignore : existingHolding.ignore,
          // Preserve existing quoteSymbol if it's already defined and no new value is provided
          quoteSymbol: quoteSymbol !== undefined ? quoteSymbol : existingHolding.quoteSymbol,
          // Preserve existing isDebt status if it's already defined and no new value is provided
          isDebt: isDebt !== undefined ? isDebt : existingHolding.isDebt,
          quoteType: quoteType !== undefined ? quoteType : existingHolding.quoteType,
          // Update userId if it's missing on the existing holding
          userId: existingHolding.userId || userId
        });
      } else {
        // Create new holding
        return await ctx.db.insert("holdings", {
          walletId,
          symbol,
          quantity,
          chain: chain || "ethereum",
          lastUpdated: Date.now(),
          ignore: ignore || false,
          quoteSymbol: quoteSymbol || undefined,
          isDebt: isDebt || false,
          quoteType: quoteType || "crypto",
          userId // Always include userId for new holdings
        });
      }
    }
  });
  
 

// Get holdings for a specific wallet
export const getHoldingsByWallet = query({
  args: { walletId: v.id("wallets") },
  handler: async (ctx, { walletId }) => {
    return await ctx.db
      .query("holdings")
      .withIndex("by_wallet", q => q.eq("walletId", walletId))
      .collect();
  }
});

// Add a holding
export const addHolding = mutation({
  args: {
    walletId: v.id("wallets"),
    symbol: v.string(),
    quantity: v.number(),
    chain: v.string(),
    isDebt: v.optional(v.boolean()),
    quoteSymbol: v.optional(v.string()),
    quoteType: v.optional(v.union(v.literal("crypto"), v.literal("stock")))
  },
  handler: async (ctx, args) => {
    // Get the user ID from authentication
    const identity = await getUserIdentity(ctx);
    const userId = identity?.subject;
    
    // Get the wallet to check if the user has access
    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    
    // Check if the user has access to this wallet
    if (wallet.userId && wallet.userId !== userId) {
      throw new Error("Not authorized to add holdings to this wallet");
    }
    
    // Check if a holding with the same symbol and chain already exists
    const existingHolding = await ctx.db
      .query("holdings")
      .withIndex("by_symbol_and_wallet_and_chain", q => 
        q.eq("symbol", args.symbol)
         .eq("walletId", args.walletId)
         .eq("chain", args.chain)
      )
      .first();
    
    if (existingHolding) {
      // Update the quantity of the existing holding
      const newQuantity = existingHolding.quantity + args.quantity;
      return await ctx.db.patch(existingHolding._id, { 
        quantity: newQuantity,
        lastUpdated: Date.now()
      });
    }
    
    // Insert a new holding
    return await ctx.db.insert("holdings", {
      ...args,
      userId,
      lastUpdated: Date.now(),
      ignore: false,
      quoteType: args.quoteType || "crypto"
    });
  }
});

// Update a holding
export const updateHolding = mutation({
  args: {
    id: v.id("holdings"),
    quantity: v.optional(v.number()),
    ignore: v.optional(v.boolean()),
    isDebt: v.optional(v.boolean()),
    quoteSymbol: v.optional(v.string()),
    quoteType: v.optional(v.union(v.literal("crypto"), v.literal("stock")))
  },
  handler: async (ctx, { id, ...updates }) => {
    // Get the user ID from authentication
    const identity = await getUserIdentity(ctx);
    const userId = identity?.subject;
    
    // Get the holding
    const holding = await ctx.db.get(id);
    if (!holding) {
      throw new Error("Holding not found");
    }
    
    // Check if the user has access to this holding
    if (holding.userId && holding.userId !== userId) {
      throw new Error("Not authorized to update this holding");
    }
    
    // If quoteType is not explicitly provided, remove it from updates to preserve existing value
    if (updates.quoteType === undefined) {
      delete updates.quoteType;
    }
    
    // Update the holding
    return await ctx.db.patch(id, {
      ...updates,
      lastUpdated: Date.now()
    });
  }
});

// Delete a holding
export const deleteHolding = mutation({
  args: {
    id: v.id("holdings")
  },
  handler: async (ctx, { id }) => {
    // Get the user ID from authentication
    const identity = await getUserIdentity(ctx);
    const userId = identity?.subject;
    
    // Get the holding
    const holding = await ctx.db.get(id);
    if (!holding) {
      throw new Error("Holding not found");
    }
    
    // Check if the user has access to this holding
    if (holding.userId && holding.userId !== userId) {
      throw new Error("Not authorized to delete this holding");
    }
    
    // Delete the holding
    await ctx.db.delete(id);
    return { success: true };
  }
});

// Add a new mutation to toggle the ignore status of a holding
export const toggleHoldingIgnore = mutation({
  args: {
    id: v.id("holdings")
  },
  handler: async (ctx, { id }) => {
    // Get the holding
    const holding = await ctx.db.get(id);
    if (!holding) {
      throw new Error("Holding not found");
    }
    
    // Get the user ID from authentication
    const identity = await getUserIdentity(ctx);
    const userId = identity?.subject;
    
    // Get the wallet to check ownership
    const wallet = await ctx.db.get(holding.walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    
    // Check if the user has access to this wallet
    if (wallet.userId && wallet.userId !== userId) {
      throw new Error("Not authorized to update this holding");
    }
    
    // Toggle the ignore status
    const newIgnoreStatus = !holding.ignore;
    
    // Update the holding
    return await ctx.db.patch(id, {
      ignore: newIgnoreStatus,
      lastUpdated: Date.now()
    });
  }
});