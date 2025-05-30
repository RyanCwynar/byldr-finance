import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

// Return a fake identity when BYPASS_AUTH is enabled for local development
export async function getUserIdentity(ctx: QueryCtx) {
  if (process.env.BYPASS_AUTH === "true") {
    return {
      tokenIdentifier: "bypass-token",
      subject: process.env.BYPASS_AUTH_EMAIL ?? "dev-user",
    };
  }
  return await ctx.auth.getUserIdentity();
}

// Helper function to get the current user ID from the auth context
export async function getUserId(ctx: QueryCtx) {
  const identity = await getUserIdentity(ctx);
  return identity?.subject;
}

// Upsert a user (create if not exists, update if exists)
export const upsertUser = mutation({
  args: {
    metadata: v.optional(v.object({
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Get the user ID from authentication
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const externalId = identity.subject;
    const now = Date.now();
    
    // Try to find existing user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_external_id", q => q.eq("externalId", externalId))
      .first();
    
    if (existingUser) {
      // Update existing user's last seen timestamp and metadata if provided
      return await ctx.db.patch(existingUser._id, {
        lastSeen: now,
        ...(args.metadata ? { metadata: args.metadata } : {}),
      });
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        externalId,
        createdAt: now,
        lastSeen: now,
        ...(args.metadata ? { metadata: args.metadata } : {}),
      });
    }
  }
});

// Get the current user
export const getMe = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return null;
    }
    
    const externalId = identity.subject;
    
    // Find the user by external ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", q => q.eq("externalId", externalId))
      .first();
    
    return user;
  }
});

// Get all users (admin only)
export const getAllUsers = query({
  handler: async (ctx) => {
    // In a real app, you'd want to add admin-only checks here
    return await ctx.db
      .query("users")
      .collect();
  }
}); 