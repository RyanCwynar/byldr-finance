import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { getQuotesHelper } from "./quotes";

type Wallet = Doc<"wallets">;
type Holding = Doc<"holdings">;
// Helper function to list holdings
export async function listHoldingsHelper(ctx: QueryCtx, filter?: {
  walletIds?: Id<"wallets">[],
  includeDebts?: boolean,
  debtsOnly?: boolean
}) {
  let q = ctx.db.query("holdings").filter(q => q.eq(q.field("ignore"), false));
  
  // Handle debt filtering
  if (filter?.debtsOnly) {
    // Only show debts
    q = q.filter(q => q.eq(q.field("isDebt"), true));
  } else if (!filter?.includeDebts) {
    // Default: only show assets (not debts)
    q = q.filter(q => q.eq(q.field("isDebt"), false));
  }
  
  if (filter?.walletIds && filter.walletIds.length > 0) {
    const walletIds = filter.walletIds;
    q = q.filter(q => 
      q.or(...walletIds.map(id => q.eq("walletId", id as any)))
    );
  }

  return await q.collect();
}

// Query endpoint to list holdings
export const listHoldings = query({
  args: {
    filter: v.optional(v.object({
      walletIds: v.optional(v.array(v.id("wallets"))),
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
  const holdings = await listHoldingsHelper(ctx, {
    walletIds,
    includeDebts: true // Include both assets and debts
  });
  
  // Get unique symbols
  const symbols = new Set<string>();
  holdings.forEach((holding: Holding) => {
    symbols.add(holding.quoteSymbol || holding.symbol);
  });

  // Get prices
  const prices: { [symbol: string]: number } = await getQuotesHelper(ctx);

  // Track assets and debts by wallet
  const walletAssets = new Map<Id<"wallets">, number>();
  const walletDebts = new Map<Id<"wallets">, number>();
  
  holdings.forEach((holding: Holding) => {
    const symbol = holding.quoteSymbol || holding.symbol;
    const price = prices[symbol] || 0;
    const value = holding.quantity * price;

    if (holding.isDebt) {
      const currentDebt = walletDebts.get(holding.walletId) || 0;
      walletDebts.set(holding.walletId, currentDebt + value);
    } else {
      const currentAsset = walletAssets.get(holding.walletId) || 0;
      walletAssets.set(holding.walletId, currentAsset + value);
    }
  });

  // Calculate totals
  let totalAssets = 0;
  let totalDebts = 0;
  const walletValues: {[key: string]: {assets: number, debts: number, value: number}} = {};

  // Convert maps to return object and calculate totals
  walletAssets.forEach((assetValue, walletId) => {
    const debtValue = walletDebts.get(walletId) || 0;
    walletValues[walletId] = {
      assets: assetValue,
      debts: debtValue,
      value: assetValue - debtValue
    };
    totalAssets += assetValue;
    totalDebts += debtValue;
  });

  // Handle wallets that only have debts
  walletDebts.forEach((debtValue, walletId) => {
    if (!walletAssets.has(walletId)) {
      walletValues[walletId] = {
        assets: 0,
        debts: debtValue,
        value: -debtValue
      };
    }
  });

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
      // Check if wallet exists
      const wallet = await ctx.db.get(walletId);
      if (!wallet) {
        throw new Error("Wallet not found");
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
          ignore: ignore || false,
          quoteSymbol: quoteSymbol || undefined,
          isDebt: isDebt || false,
          quoteType: quoteType || undefined
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
          quoteType: quoteType || undefined
        });
      }
    }
  });
  
  // Delete a holding
  export const deleteHolding = mutation({
    args: {
      walletId: v.id("wallets"),
      symbol: v.string(),
      chain: v.string()
    },
    handler: async (ctx, { walletId, symbol, chain }) => {
      // Find the holding
      const holding = await ctx.db
        .query("holdings")
        .withIndex("by_symbol_and_wallet_and_chain", q => 
          q.eq("symbol", symbol).eq("walletId", walletId).eq("chain", chain)
        )
        .first();
  
      if (!holding) {
        throw new Error("Holding not found");
      }
  
      await ctx.db.delete(holding._id);
      return true;
    }
  });
 
  // Helper function to calculate net worth - now expects an action context
export async function updateHoldingsHelper(ctx: any) {
    console.debug("Starting holdings update");
  
    // Get all wallets
    const { wallets } = await ctx.runQuery(api.wallets.listWallets, {});
    console.info("Found wallets:", wallets.length);
  
    // Process Ethereum wallets
    const ethWallets = wallets.filter((w: Wallet) => w.chainType === "ethereum");
    console.info("Processing ETH wallets:", ethWallets.length);
    for (const wallet of ethWallets) {
      try {
       await ctx.runAction(api.holdingsNode.updateEvmWalletHoldings, { 
          walletAddress: wallet.address,
        });
      } catch (error) {
        console.error(`Error updating holdings for ETH wallet ${wallet.address}:`, error);
      }
    }
  
    // Process Bitcoin wallets
    const btcWallets = wallets.filter((w: Wallet) => w.chainType === "bitcoin");
  
    console.info("Processing BTC wallets:", btcWallets.length);
    for (const wallet of btcWallets) {
      try {
        // Get BTC balance using BlockCypher API
        const balance = await ctx.runAction(api.holdingsNode.getBitcoinWalletBalance, {
          xpub: wallet.address
        });
        
        const btcBalance = Number(balance.confirmedBalance); // Convert satoshis to BTC
        // Update BTC holding for this wallet
        await ctx.runMutation(api.holdings.upsertHolding, {
          walletId: wallet._id,
          symbol: "BTC",
          quantity: btcBalance,
          chain: "bitcoin"
        });
  
    
      } catch (error) {
        console.error(`Error getting balance for BTC wallet ${wallet.address}:`, error);
      }
    }
  
    return true;
  }

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