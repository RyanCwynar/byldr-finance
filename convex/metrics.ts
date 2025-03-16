import { query, mutation, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { listHoldingsHelper } from "./holdings";
import { getQuotesHelper } from "./quotes";

type DailyMetric = Doc<"dailyMetrics">;

// Query to get historical metrics
export const getDailyMetrics = query({
  handler: async (ctx): Promise<DailyMetric[]> => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    if (userId) {
      // If authenticated, return only user's metrics
      return await ctx.db
        .query("dailyMetrics")
        .withIndex("by_user_and_date", q => q.eq("userId", userId))
        .order("asc")
        .collect();
    } else {
      // For backward compatibility, return metrics without userId
      return await ctx.db
        .query("dailyMetrics")
        .withIndex("by_date")
        .filter(q => q.eq(q.field("userId"), undefined))
        .order("asc")
        .collect();
    }
  }
});

// Helper function to get total value of all assets
export async function getAssetsTotalHelper(ctx: QueryCtx) {
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

// Helper function to get total value of all debts
export async function getDebtsTotalHelper(ctx: QueryCtx) {
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

// Query to get total value of all assets
export const getAssetsTotal = query({
  handler: async (ctx) => {
    return await getAssetsTotalHelper(ctx);
  }
});

// Query to get total value of all debts 
export const getDebtsTotal = query({
  handler: async (ctx) => {
    return await getDebtsTotalHelper(ctx);
  }
});

// Mutation to take a snapshot of net worth with additional metrics
export const snapshotDailyMetrics = mutation({
  handler: async (ctx): Promise<{
    netWorth: number,
    assets: number,
    debts: number
  }> => {
    // Get the user ID from authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    // Get holdings value using helper
    const holdings = await listHoldingsHelper(ctx, { includeDebts: true });
    const quotes = await getQuotesHelper(ctx);

    // Calculate holdings totals
    let holdingsAssets = 0;
    let holdingsDebts = 0;
    
    holdings.forEach(holding => {
      const symbol = holding.quoteSymbol || holding.symbol;
      const price = quotes[symbol] || 0;
      const value = holding.quantity * price;
      
      if (holding.isDebt) {
        holdingsDebts += value;
      } else {
        holdingsAssets += value;
      }
    });

    // Get assets and debts from tables
    let assets, debts;
    
    if (userId) {
      // If authenticated, get user's assets and debts
      assets = await ctx.db
        .query("assets")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
        
      debts = await ctx.db
        .query("debts")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
    } else {
      // For backward compatibility, get assets and debts without userId
      assets = await ctx.db
        .query("assets")
        .filter(q => q.eq(q.field("userId"), undefined))
        .collect();
        
      debts = await ctx.db
        .query("debts")
        .filter(q => q.eq(q.field("userId"), undefined))
        .collect();
    }
    
    const assetsTotal = assets.reduce((sum, asset) => sum + asset.value, 0);
    const debtsTotal = debts.reduce((sum, debt) => sum + debt.value, 0);

    // Calculate final totals
    const totalAssets = holdingsAssets + assetsTotal;
    const totalDebts = holdingsDebts + debtsTotal;
    const netWorth = totalAssets - totalDebts;

    // Store the daily metrics
    await ctx.db.insert("dailyMetrics", {
      date: Date.now(),
      netWorth,
      assets: totalAssets,
      debts: totalDebts,
      userId,
      prices: quotes,
      metadata: {
        dataSource: "CoinGecko",
        lastUpdated: Date.now(),
      }
    });

    return {
      netWorth,
      assets: totalAssets,
      debts: totalDebts
    };
  }
});

// Add a query for cached net worth
export const getCachedNetWorth = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    // Get the most recent daily metric
    let latestMetric;
    
    if (userId) {
      // If authenticated, get user's latest metric
      latestMetric = await ctx.db
        .query("dailyMetrics")
        .withIndex("by_user_and_date", q => q.eq("userId", userId))
        .order("desc")
        .first();
    } else {
      // For backward compatibility, get latest metric without userId
      latestMetric = await ctx.db
        .query("dailyMetrics")
        .withIndex("by_date")
        .filter(q => q.eq(q.field("userId"), undefined))
        .order("desc")
        .first();
    }
    
    return latestMetric?.netWorth ?? 0;
  }
});

