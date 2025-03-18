import { query, mutation, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { listHoldingsHelper } from "./holdings";
import { getQuotesHelper } from "./quotes";
import { updateAllWalletValuesHelper } from "./wallets";

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

// Helper function to create a snapshot of current quotes
async function createQuoteSnapshot(ctx: any) {
    console.log("Creating quote snapshot");
    
    // Get all active quotes
    const quotes = await ctx.db.query("quotes")
        .filter((q: any) => q.neq(q.field("ignored"), true))
        .collect();
    
    if (quotes.length === 0) {
        console.log("No active quotes found, not creating snapshot");
        return null;
    }
    
    // Convert quotes to a prices record
    const prices: Record<string, number> = {};
    quotes.forEach((quote: Doc<"quotes">) => {
        prices[quote.symbol] = quote.price;
    });
    
    // Create the snapshot
    const snapshot = await ctx.db.insert("quoteSnapshots", {
        timestamp: Date.now(),
        prices,
        metadata: {
            description: "Daily metrics snapshot",
            source: "snapshotDailyMetrics"
        }
    });
    
    console.log(`Created quote snapshot with ID: ${snapshot}`);
    return snapshot;
}

// Mutation to take a snapshot of net worth with additional metrics
export const snapshotDailyMetrics = mutation({
    handler: async (ctx): Promise<{
        userCount: number,
        quoteSnapshotId: Id<"quoteSnapshots"> | null,
        walletsUpdated: number,
        snapshots: {
            userId: string | undefined,
            netWorth: number,
            assets: number,
            debts: number
        }[]
    }> => {
        console.log("Starting daily metrics snapshot");
        
        // First, create a snapshot of current quotes
        const quoteSnapshot = await createQuoteSnapshot(ctx);
        
        // Then, update all wallet values to ensure they're current
        const walletUpdateResult = await updateAllWalletValuesHelper(ctx);
        
        // Get all users from the users table
        const users = await ctx.db.query("users").collect();
        const snapshots = [];

        // Create a metrics snapshot for each user
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
            quoteSnapshotId: quoteSnapshot?._id || null,
            walletsUpdated: walletUpdateResult.updated,
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
        prices: netWorthData.prices, // Store the current prices with the snapshot
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

    // Get current quotes for reference
    const quotes = await getQuotesHelper(ctx);

    // Get all wallets for this user
    const wallets = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect();

    console.log(`Found ${wallets.length} wallets for user ${userId}`);

    // Sum up wallet values
    let totalAssets = 0;
    let totalDebts = 0;

    // Add up the wallet values (they should be up-to-date at this point)
    wallets.forEach(wallet => {
        totalAssets += wallet.assets || 0;
        totalDebts += wallet.debts || 0;
    });

    // Get manual assets and debts from tables for this user
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

    // Add manual assets and debts to totals
    totalAssets += assetsTotal;
    totalDebts += debtsTotal;
    
    const netWorth = totalAssets - totalDebts;

    console.log(`User ${userId} metrics calculated: Net worth: ${netWorth}, Assets: ${totalAssets}, Debts: ${totalDebts}`);

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

