import { v } from "convex/values";
import { DatabaseReader, mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getHoldingsValueHelper } from "./holdings";

// Get a wallet by address
export const getWalletByAddress = query({
    args: {
        address: v.string()
    },
    handler: async (ctx, { address }) => {
        // Get the user ID from authentication
        const identity = await ctx.auth.getUserIdentity();
        const userId = identity?.subject;
        
        // Find the wallet by address
        const wallet = await ctx.db
            .query("wallets")
            .withIndex("by_address", q => q.eq("address", address))
            .filter(q => 
                userId ? q.eq(q.field("userId"), userId) : q.eq(q.field("userId"), undefined)
            )
            .first();
            
        return wallet;
    }
});

// Extract the wallet update logic into a helper function to be reused
async function updateWalletValueHelper(ctx: MutationCtx, walletId: Id<"wallets">, options?: { skipAuth?: boolean }) {
    console.log("Starting updateWalletValueHelper for wallet:", walletId);
    
    // Get the wallet
    const wallet = await ctx.db.get(walletId);
    if (!wallet) {
        console.error("Wallet not found:", walletId);
        throw new Error("Wallet not found");
    }
    
    console.log("Found wallet:", wallet);
    
    // Check authentication if not skipped
    if (!options?.skipAuth) {
        // Get the user ID from authentication
        const identity = await ctx.auth.getUserIdentity();
        const userId = identity?.subject;
        
        console.log("User ID from auth:", userId);
        console.log("Wallet user ID:", wallet.userId);
        
        // Check if the user has access to this wallet
        if (wallet.userId && wallet.userId !== userId) {
            console.error("Not authorized to update this wallet. User:", userId, "Wallet owner:", wallet.userId);
            throw new Error("Not authorized to update this wallet");
        }
    }
    
    // Get the wallet's holdings value using the helper function
    console.log("Getting holdings value for wallet:", walletId);
    const holdingsValue = await getHoldingsValueHelper(ctx, [walletId]);
    console.log("Holdings value result:", holdingsValue);
    
    // Get the wallet's value from the holdings
    // Convert the ID to a string to use as a key in the walletValues object
    const walletIdStr = walletId.toString();
    console.log("Wallet ID as string:", walletIdStr);
    const walletValue = holdingsValue.walletValues[walletIdStr];
    console.log("Wallet value from holdings:", walletValue);
    
    if (!walletValue) {
        console.log("No holdings or all holdings are ignored, setting values to 0");
        // No holdings or all holdings are ignored
        return await ctx.db.patch(walletId, {
            value: 0,
            assets: 0,
            debts: 0,
            metadata: {
                lastUpdated: Date.now()
            }
        });
    }
    
    console.log("Updating wallet with new values:", {
        value: walletValue.value,
        assets: walletValue.assets,
        debts: walletValue.debts
    });
    
    // Update the wallet with the new values
    return await ctx.db.patch(walletId, {
        value: walletValue.value,
        assets: walletValue.assets,
        debts: walletValue.debts,
        metadata: {
            lastUpdated: Date.now()
        }
    });
}

// Update a wallet's value based on its holdings
export const updateWalletValue = mutation({
    args: {
        id: v.id("wallets")
    },
    handler: async (ctx, { id }) => {
        return await updateWalletValueHelper(ctx, id);
    }
});

// Add a new wallet
export const addWallet = mutation({
    args: {
        name: v.string(),
        address: v.string(),
        chainType: v.string(),
    },
    handler: async (ctx, { name, address, chainType }) => {
        // Get the user ID from authentication
        const identity = await ctx.auth.getUserIdentity();
        const userId = identity?.subject;
        
        // Validate address format based on chain type
        if (chainType === "ethereum" && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new Error("Invalid EVM address format");
        }
        // Add more chain-specific validation as needed

        // Check if wallet already exists for this user
        const existing = await ctx.db
            .query("wallets")
            .withIndex("by_address", q => q.eq("address", address))
            .filter(q => 
                userId ? q.eq(q.field("userId"), userId) : q.eq(q.field("userId"), undefined)
            )
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
            userId,
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
    const { id, ...updates } = args;
    
    // Get the wallet
    const wallet = await ctx.db.get(id);
    if (!wallet) {
        throw new Error("Wallet not found");
    }
    
    // Get the user ID from authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    // Check if the user has access to this wallet
    if (wallet.userId && wallet.userId !== userId) {
        throw new Error("Not authorized to update this wallet");
    }
    
    // Update the wallet
    return await ctx.db.patch(id, updates);
}

// Update a wallet
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
    handler: updateWalletHelper
});

// Delete a wallet
export const deleteWallet = mutation({
    args: {
        id: v.id("wallets")
    },
    handler: async (ctx, { id }) => {
        // Get the user ID from authentication
        const identity = await ctx.auth.getUserIdentity();
        const userId = identity?.subject;
        
        // Get the wallet
        const wallet = await ctx.db.get(id);
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        
        // Check if the user has access to this wallet
        if (wallet.userId && wallet.userId !== userId) {
            throw new Error("Not authorized to delete this wallet");
        }
        
        // Delete the wallet
        await ctx.db.delete(id);
        
        // Delete all holdings for this wallet
        const holdings = await ctx.db
            .query("holdings")
            .withIndex("by_wallet", q => q.eq("walletId", id))
            .collect();
            
        for (const holding of holdings) {
            await ctx.db.delete(holding._id);
        }
        
        return { success: true };
    }
});

// Helper function to list wallets
export async function listWalletsHelper(ctx: { db: DatabaseReader, auth?: { getUserIdentity: () => Promise<any> } }) {
    // Get the user ID from authentication if available
    const identity = ctx.auth ? await ctx.auth.getUserIdentity() : null;
    const userId = identity?.subject;
    
    if (userId) {
        // If authenticated, return only user's wallets
        return await ctx.db
            .query("wallets")
            .withIndex("by_user", q => q.eq("userId", userId))
            .collect();
    } else {
        // For backward compatibility, return wallets without userId
        return await ctx.db
            .query("wallets")
            .filter(q => q.eq(q.field("userId"), undefined))
            .collect();
    }
}

// List all wallets
export const listWallets = query({
    handler: async (ctx) => {
        return await listWalletsHelper(ctx);
    }
});

// Get a specific wallet
export const getWallet = query({
    args: {
        id: v.id("wallets")
    },
    handler: async (ctx, { id }) => {
        const wallet = await ctx.db.get(id);
        
        // Check if the wallet exists
        if (!wallet) {
            return null;
        }
        
        // If the wallet has a userId, verify the current user has access
        const identity = await ctx.auth.getUserIdentity();
        const userId = identity?.subject;
        
        if (wallet.userId && wallet.userId !== userId) {
            // User doesn't have access to this wallet
            return null;
        }
        
        return wallet;
    }
});

// Helper function to update all wallet values
export async function updateAllWalletValuesHelper(ctx: MutationCtx) {
    console.log("Starting updateAllWalletValues for all wallets");
    
    // Get all wallets
    const wallets = await ctx.db.query("wallets").collect();
    console.log(`Found ${wallets.length} wallets to update`);
    
    if (wallets.length === 0) {
        console.log("No wallets found, nothing to update");
        return { updated: 0 };
    }
    
    // Keep track of how many wallets were updated
    let updatedCount = 0;
    
    // Update each wallet using the helper function
    for (const wallet of wallets) {
        try {
            await updateWalletValueHelper(ctx, wallet._id, { skipAuth: true });
            updatedCount++;
        } catch (error) {
            console.error(`Error updating wallet ${wallet._id}:`, error);
            // Continue with the next wallet
        }
    }
    
    console.log(`Successfully updated ${updatedCount} wallets`);
    return { updated: updatedCount };
}

// Internal mutation to update all wallet values based on current quotes
export const updateAllWalletValues = mutation({
    handler: async (ctx) => {
        return await updateAllWalletValuesHelper(ctx);
    }
});
