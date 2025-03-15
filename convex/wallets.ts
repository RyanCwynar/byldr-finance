import { v } from "convex/values";
import { DatabaseReader, mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { listHoldingsHelper } from "./holdings";
import { getQuotesHelper } from "./quotes";

// Add a new wallet
export const addWallet = mutation({
    args: {
        name: v.string(),
        address: v.string(),
        chainType: v.string(),
    },
    handler: async (ctx, { name, address, chainType }) => {
        // Validate address format based on chain type
        if (chainType === "ethereum" && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new Error("Invalid EVM address format");
        }
        // Add more chain-specific validation as needed

        // Check if wallet already exists
        const existing = await ctx.db
            .query("wallets")
            .withIndex("by_address", q => q.eq("address", address))
            .first();

        if (existing) {
            throw new Error("Wallet already exists");
        }

        // Insert new wallet with all required fields
        return await ctx.db.insert("wallets", {
            name,
            address,
            chainType,
            value: 0,
            metadata: {
                lastUpdated: Date.now()
            }
        });
    }
});

// Helper function to update a wallet
export async function updateWalletHelper(ctx: MutationCtx, args: {
    id: Id<"wallets">,
    name?: string,
    value?: number,
    assets?: number,
    debts?: number,
    metadata?: {
        lastUpdated: number
    }
}) {
    const wallet = await ctx.db.get(args.id);
    if (!wallet) {
        throw new Error("Wallet not found");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.value !== undefined) updates.value = args.value;
    if (args.assets !== undefined) updates.assets = args.assets;
    if (args.debts !== undefined) updates.debts = args.debts;
    if (args.metadata !== undefined) updates.metadata = args.metadata;

    return await ctx.db.patch(args.id, updates);
}

// Update an existing wallet
export const updateWallet = mutation({
    args: {
        id: v.id("wallets"),
        name: v.optional(v.string()),
        value: v.optional(v.number()),
        assets: v.optional(v.number()),
        debts: v.optional(v.number()),
        metadata: v.optional(v.object({
            lastUpdated: v.number()
        }))
    },
    handler: async (ctx, args) => {
        return await updateWalletHelper(ctx, args);
    }
});

// Delete a wallet
export const deleteWallet = mutation({
    args: {
        id: v.id("wallets")
    },
    handler: async (ctx, { id }) => {
        const wallet = await ctx.db.get(id);
        if (!wallet) {
            throw new Error("Wallet not found");
        }

        await ctx.db.delete(id);
        return true;
    }
});

// Get all wallets
export const getAllWallets = query({
    handler: async (ctx) => {
        return await ctx.db.query("wallets").collect();
    }
});

// Get wallet by address
export const getWalletByAddress = query({
    args: { address: v.string() },
    handler: async (ctx, { address }) => {
        return await ctx.db
            .query("wallets")
            .withIndex("by_address", q => q.eq("address", address))
            .first();
    }
});

// Helper function to list wallets that can be used by other queries
export async function listWalletsHelper(ctx: { db: DatabaseReader }) {
    const query = ctx.db.query("wallets");
    const wallets = await query.collect();

    // Sort wallets by value, handling undefined values
    const sortedWallets = wallets.sort((a, b) => {
        const valueA = a.value ?? 0;
        const valueB = b.value ?? 0;
        return valueB - valueA; // Sort in descending order
    });

    return sortedWallets;
}

// Mutation to update wallet values
export const updateWalletValues = mutation({
    handler: async (ctx) => {


        // Get all holdings and quotes using helpers
        const holdings = await listHoldingsHelper(ctx, { includeDebts: true });
        const quotes = await getQuotesHelper(ctx);

        // Group holdings by wallet
        const walletTotals: Record<string, { assets: number; debts: number; value: number }> = {};

        holdings.forEach((holding: any) => {
            if (!holding.ignore) {
                const symbol = holding.quoteSymbol || holding.symbol;
                const price = quotes[symbol] || 0;
                const value = holding.quantity * price;

                // Initialize wallet totals if not exists
                if (!walletTotals[holding.walletId.toString()]) {
                    walletTotals[holding.walletId.toString()] = {
                        assets: 0,
                        debts: 0,
                        value: 0
                    };
                }

                if (holding.isDebt) {
                    walletTotals[holding.walletId.toString()].debts += value;
                    walletTotals[holding.walletId.toString()].value -= value;
                } else {
                    walletTotals[holding.walletId.toString()].assets += value;
                    walletTotals[holding.walletId.toString()].value += value;
                }
            }
        });

        // Get all wallets
        const allWallets = await ctx.db.query("wallets").collect();

        // Update each wallet's values
        for (const wallet of allWallets) {
            const totals = walletTotals[wallet._id.toString()] || { assets: 0, debts: 0, value: 0 };
            await updateWalletHelper(ctx, {
                id: wallet._id,
                assets: totals.assets,
                debts: totals.debts,
                value: totals.value,
                metadata: {
                    lastUpdated: Date.now()
                }
            });
        }

        return true;
    }
});

// Query endpoint to list wallets
export const listWallets = query({
    handler: async (ctx) => {
        return await listWalletsHelper(ctx);
    }
});

// Get wallet by ID
export const getWallet = query({
  args: { id: v.id("wallets") },
  handler: async (ctx, { id }) => {
    const wallet = await ctx.db.get(id);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    return wallet;
  }
});
