import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./users";

export const getSimulation = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("simulationData")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const saveSimulation = mutation({
  args: {
    adjustments: v.record(v.string(), v.number()),
    summary: v.object({
      originalValue: v.number(),
      adjustedValue: v.number(),
      originalAssets: v.number(),
      adjustedAssets: v.number(),
      originalDebts: v.number(),
      adjustedDebts: v.number(),
      percentChange: v.number(),
    }),
  },
  handler: async (ctx, { adjustments, summary }) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("simulationData")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        adjustments,
        summary,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("simulationData", {
      userId,
      adjustments,
      summary,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const clearSimulation = mutation({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("simulationData")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return true;
  },
});
