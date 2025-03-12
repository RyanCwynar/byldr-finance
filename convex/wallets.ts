import { v } from "convex/values";
import { DatabaseReader, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

    // Insert new wallet
    return await ctx.db.insert("wallets", {
      name,
      address,
      chainType,
    });
  }
});

// Update an existing wallet
export const updateWallet = mutation({
  args: {
    id: v.id("wallets"),
    name: v.optional(v.string())
  },
  handler: async (ctx, { id, name }) => {
    const wallet = await ctx.db.get(id);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return await ctx.db.patch(id, {
      name,
    });
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

  return {
    wallets
  };
}

// Query endpoint to list wallets
export const listWallets = query({
  handler: async (ctx) => {
    return await listWalletsHelper(ctx);
  }
});
