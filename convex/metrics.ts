import { action, query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { DailyMetric } from "@/components/net-worth-chart";
import { listHoldingsHelper } from "./holdings";
import { getQuotesHelper } from "./quotes";

// Query to get historical metrics
export const getDailyMetrics = query({
  handler: async (ctx): Promise<DailyMetric[]> => {
    return await ctx.db
      .query("dailyMetrics")
      .withIndex("by_date")
      .order("asc")
      .collect();
  }
});

// Helper function to get total value of all assets
export async function getAssetsTotalHelper(ctx: QueryCtx) {
  const assets = await ctx.db.query("assets").collect();
  const assetsTotal = assets.reduce((sum, asset) => sum + asset.value, 0);
  return { assetsTotal };
}

// Helper function to get total value of all debts
export async function getDebtsTotalHelper(ctx: QueryCtx) {
  const debts = await ctx.db.query("debts").collect();
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
    const assets = await ctx.db.query("assets").collect();
    const debts = await ctx.db.query("debts").collect();
    
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
    // Get the most recent daily metric
    const latestMetric = await ctx.db
      .query("dailyMetrics")
      .withIndex("by_date")
      .order("desc")
      .first();
    
    return latestMetric?.netWorth ?? 0;
  }
});

