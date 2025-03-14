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

// Update an existing wallet
export const updateWallet = mutation({
  args: {
    id: v.id("wallets"),
    name: v.optional(v.string()),
    value: v.optional(v.number()),
    metadata: v.optional(v.object({
      lastUpdated: v.number()
    }))
  },
  handler: async (ctx, { id, name, value, metadata }) => {
    const wallet = await ctx.db.get(id);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (value !== undefined) updates.value = value;
    if (metadata !== undefined) updates.metadata = metadata;

    return await ctx.db.patch(id, updates);
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

  return {
    wallets: sortedWallets
  };
}

// Query endpoint to list wallets
export const listWallets = query({
  handler: async (ctx) => {
    return await listWalletsHelper(ctx);
  }
});
// Upsert a holding (create or update)
export const upsertHolding = mutation({
  args: {
    walletId: v.id("wallets"),
    symbol: v.string(),
    quantity: v.number(),
    chain: v.optional(v.string())
  },
  handler: async (ctx, { walletId, symbol, quantity, chain }) => {
    // Check if wallet exists
    const wallet = await ctx.db.get(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Try to find existing holding
    const existingHolding = await ctx.db
      .query("holdings")
      .withIndex("by_symbol_and_wallet", q => 
        q.eq("symbol", symbol).eq("walletId", walletId)
      )
      .first();

    if (existingHolding) {
      // Update existing holding
      return await ctx.db.patch(existingHolding._id, {
        quantity,
        chain: chain || "mainnet",
        lastUpdated: Date.now()
      });
    } else {
      // Create new holding
      return await ctx.db.insert("holdings", {
        walletId,
        symbol,
        quantity,
        chain: chain || "mainnet",
        lastUpdated: Date.now()
      });
    }
  }
});

// Delete a holding
export const deleteHolding = mutation({
  args: {
    walletId: v.id("wallets"),
    symbol: v.string()
  },
  handler: async (ctx, { walletId, symbol }) => {
    // Find the holding
    const holding = await ctx.db
      .query("holdings")
      .withIndex("by_symbol_and_wallet", q => 
        q.eq("symbol", symbol).eq("walletId", walletId)
      )
      .first();

    if (!holding) {
      throw new Error("Holding not found");
    }

    await ctx.db.delete(holding._id);
    return true;
  }
});
