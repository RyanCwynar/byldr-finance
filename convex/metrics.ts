import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { DailyMetric } from "@/components/NetWorthChart";

interface Wallet {
  chainType: string;
  address: string;
}

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

// Helper function to calculate net worth - now expects an action context
export async function calculateNetWorthHelper(ctx: any) {
  console.debug("Starting net worth calculation");

  // Get crypto prices first
  let ethPrice = 0, btcPrice = 0, solPrice = 0, avaxPrice = 0;
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,avalanche-2&vs_currencies=usd"
    );
    const data = await response.json();
    ethPrice = data.ethereum.usd;
    btcPrice = data.bitcoin.usd;
    solPrice = data.solana.usd;
    avaxPrice = data["avalanche-2"].usd;
    console.debug("Fetched prices:", { ethPrice, btcPrice, solPrice, avaxPrice });
  } catch (error) {
    console.error("Failed to fetch crypto prices:", error);
    return { netWorth: 0, prices: { ethereum: 0, bitcoin: 0, solana: 0, avalanche: 0 } };
  }

  let totalValue = 0;

  // Get all wallets
  const { wallets } = await ctx.runQuery(api.wallets.listWallets, {});
  console.info("Found wallets:", wallets.length);

  // Process Ethereum wallets
  const ethWallets = wallets.filter((w: Wallet) => w.chainType === "ethereum");
  console.info("Processing ETH wallets:", ethWallets.length);

  for (const wallet of ethWallets) {
    try {
      const balance = await ctx.runAction(api.finance.getWalletBalance, { 
        walletAddress: wallet.address,
        ethPrice // Pass the fetched ETH price
      });
      const walletValue = parseFloat(balance.totalUsdValue);
      console.debug(`Wallet ${wallet.address} value:`, walletValue);
      
      if (balance.totalUsdValue) {
        totalValue += walletValue;
        console.info(`Added wallet value: ${walletValue}, new total: ${totalValue}`);
      }
    } catch (error) {
      console.error(`Error getting balance for ETH wallet ${wallet.address}:`, error);
    }
  }

  // Process Bitcoin wallets
  const btcWallets = wallets.filter((w: Wallet) => w.chainType === "bitcoin");
  console.info("Processing BTC wallets:", btcWallets.length);

  for (const wallet of btcWallets) {
    try {
      // Get BTC balance using BlockCypher API
      const balance = await ctx.runAction(api.finance.getBitcoinWalletBalance, {
        xpub: wallet.address
      });
      
      const btcBalance = Number(balance.confirmedBalance); // Convert satoshis to BTC
      const walletValue = btcBalance * btcPrice;

      totalValue += walletValue;
      console.info(`Added BTC wallet value:`, {
        address: wallet.address,
        btcBalance,
        btcPrice,
        walletValue,
        newTotal: totalValue
      });
    } catch (error) {
      console.error(`Error getting balance for BTC wallet ${wallet.address}:`, error);
    }
  }

  // Get assets and debts totals
  const { assetsTotal } = await ctx.runQuery(api.metrics.getAssetsTotal, {});
  const { debtsTotal } = await ctx.runQuery(api.metrics.getDebtsTotal, {});
  
  console.info("Assets total:", assetsTotal);
  console.info("Debts total:", debtsTotal);

  totalValue += assetsTotal;
  totalValue -= debtsTotal;

  console.log("Final net worth calculation:", {
    totalValue,
    assetsTotal,
    debtsTotal,
    prices: {
      ethereum: ethPrice,
      bitcoin: btcPrice,
      solana: solPrice,
      avalanche: avaxPrice,
    }
  });

  return {
    netWorth: totalValue,
    prices: {
      ethereum: ethPrice,
      bitcoin: btcPrice,
      solana: solPrice,
      avalanche: avaxPrice,
    }
  };
}

// Query to get total value of all assets
export const getAssetsTotal = query({
  handler: async (ctx) => {
    const assets = await ctx.db.query("assets").collect();
    const assetsTotal = assets.reduce((sum, asset) => sum + asset.value, 0);
    return { assetsTotal };
  }
});

// Query to get total value of all debts 
export const getDebtsTotal = query({
  handler: async (ctx) => {
    const debts = await ctx.db.query("debts").collect();
    const debtsTotal = debts.reduce((sum, debt) => sum + debt.value, 0);
    return { debtsTotal };
  }
});

// Action to get current net worth and store daily metrics
export const getCurrentNetWorth = action({
  handler: async (ctx) => {
    // Calculate net worth
    const stats = await calculateNetWorthHelper(ctx);

    // Store the daily metrics
    await ctx.runMutation(api.metrics.storeDailyMetrics, {
      netWorth: stats.netWorth,
      prices: {
        ethereum: stats.prices.ethereum ?? 0,
        bitcoin: stats.prices.bitcoin ?? 0,
        solana: stats.prices.solana ?? 0,
        avalanche: stats.prices.avalanche ?? 0
      }
    });

    return stats.netWorth;
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

// Mutation to store daily metrics in the database
export const storeDailyMetrics = mutation({
  args: {
    netWorth: v.number(),
    prices: v.object({
      ethereum: v.number(),
      bitcoin: v.number(),
      solana: v.number(),
      avalanche: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dailyMetrics", {
      date: Date.now(),
      netWorth: args.netWorth,
      prices: args.prices,
      metadata: {
        dataSource: "CoinGecko",
        lastUpdated: Date.now(),
      }
    });
  }
});

// Action to fetch current prices and update metrics
export const updateDailyMetrics = action({
  handler: async (ctx) => {
    // Calculate net worth
    const stats = await calculateNetWorthHelper(ctx);

    // Store the data using the mutation
    await ctx.runMutation(api.metrics.storeDailyMetrics, {
      netWorth: stats.netWorth,
      prices: {
        ethereum: stats.prices.ethereum ?? 0,
        bitcoin: stats.prices.bitcoin ?? 0, 
        solana: stats.prices.solana ?? 0,
        avalanche: stats.prices.avalanche ?? 0
      }
    });

    return stats.netWorth;
  }
});


