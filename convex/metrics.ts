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
        userCount: number,
        snapshots: {
            userId: string | undefined,
            netWorth: number,
            assets: number,
            debts: number
        }[]
    }> => {
        // Get all users from the users table
        const users = await ctx.db.query("users").collect();
        const snapshots = [];

        // Create a snapshot for each user
        for (const user of users) {
            const userId = user.externalId;
            if (userId) {
                const snapshot = await createSnapshotForUser(ctx, userId);
                snapshots.push({
                    userId,
                    ...snapshot
                });
            }
        }

        return {
            userCount: users.length,
            snapshots
        };
    }
});

// Helper function to create a snapshot for a specific user
async function createSnapshotForUser(ctx: any, userId: string): Promise<{
    netWorth: number,
    assets: number,
    debts: number
}> {
    // Use the getCurrentNetWorthHelper to calculate net worth
    const netWorthData = await getCurrentNetWorthHelper(ctx, userId);
    
    // Store the daily metrics
    await ctx.db.insert("dailyMetrics", {
        date: Date.now(),
        netWorth: netWorthData.netWorth,
        assets: netWorthData.assets,
        debts: netWorthData.debts,
        userId,
        metadata: {
            dataSource: "CoinGecko",
            lastUpdated: Date.now(),
        }
    });
    
    return {
        netWorth: netWorthData.netWorth,
        assets: netWorthData.assets,
        debts: netWorthData.debts
    };
}

// Helper function to get current net worth snapshot
export async function getCurrentNetWorthHelper(ctx: QueryCtx, userId: string) {
    // Ensure we have a userId
    if (!userId) {
        throw new Error("User ID is required for getCurrentNetWorthHelper");
    }

    // Get all holdings for this user
    const holdings = await listHoldingsHelper(ctx, {
        userId // Pass the userId to override auth
    });

    // Get current quotes
    const quotes = await getQuotesHelper(ctx);

    // Calculate holdings assets and debts
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

    // Get assets and debts from tables for this user
    const assets = await ctx.db
        .query("assets")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect();

    const debts = await ctx.db
        .query("debts")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect();

    const assetsTotal = assets.reduce((sum: number, asset: any) => sum + asset.value, 0);
    const debtsTotal = debts.reduce((sum: number, debt: any) => sum + debt.value, 0);

    // Calculate final totals
    const totalAssets = holdingsAssets + assetsTotal;
    const totalDebts = holdingsDebts + debtsTotal;
    const netWorth = totalAssets - totalDebts;

    return {
        userId,
        netWorth,
        assets: totalAssets,
        debts: totalDebts,
        timestamp: Date.now(),
        prices: quotes
    };
}

// Query to get current net worth snapshot
export const getCurrentNetWorth = query({
    handler: async (ctx) => {
        // Get the user ID from authentication or use the override
        const identity = await ctx.auth.getUserIdentity();
        const authUserId = identity?.subject;

        if (!authUserId) {
            throw new Error("User ID is required for getCurrentNetWorth");
        }

        return await getCurrentNetWorthHelper(ctx, authUserId);
    }
});

