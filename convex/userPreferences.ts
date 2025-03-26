import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./users";

// Default preferences
const DEFAULT_PREFERENCES = {
  useSimulationData: false,
  monthlyIncome: 18000,
  monthlyCost: 10000,
  forecastDataView: "all" as "all" | "real" | "projected",
  theme: "dark" as "light" | "dark" | "system",
  dashboardLayout: [] as string[],
  customSettings: {}
};

// Get user preferences
export const getUserPreferences = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;
    
    // Look up user preferences from the database
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    // Return preferences or default values if not found
    return preferences || { 
      userId, 
      preferences: DEFAULT_PREFERENCES,
      lastUpdated: Date.now()
    };
  }
});

// Get a specific preference value
export const getPreference = query({
  args: {
    key: v.string()
  },
  handler: async (ctx, { key }) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;
    
    // Look up user preferences from the database
    const userPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!userPrefs) {
      // If no preferences are found, return the default value for this key
      // @ts-ignore: Dynamic key access
      return DEFAULT_PREFERENCES[key] || null;
    }
    
    // Return the specific preference value, or its default if not set
    // @ts-ignore: Dynamic key access
    return userPrefs.preferences[key] !== undefined 
      // @ts-ignore: Dynamic key access
      ? userPrefs.preferences[key] 
      // @ts-ignore: Dynamic key access
      : (DEFAULT_PREFERENCES[key] || null);
  }
});

// Set a single preference
export const setPreference = mutation({
  args: {
    key: v.string(),
    value: v.any()
  },
  handler: async (ctx, { key, value }) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Look up user preferences from the database
    const userPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!userPrefs) {
      // If no preferences exist yet, create a new entry with defaults
      const newPreferences = { ...DEFAULT_PREFERENCES };
      // @ts-ignore: Dynamic key access
      newPreferences[key] = value;
      
      await ctx.db.insert("userPreferences", {
        userId,
        preferences: newPreferences,
        lastUpdated: Date.now()
      });
    } else {
      // Update existing preferences
      const updatedPreferences = { ...userPrefs.preferences };
      // @ts-ignore: Dynamic key access
      updatedPreferences[key] = value;
      
      await ctx.db.patch(userPrefs._id, {
        preferences: updatedPreferences,
        lastUpdated: Date.now()
      });
    }
    
    return true;
  }
});

// Update multiple preferences at once
export const updatePreferences = mutation({
  args: {
    preferences: v.object({
      useSimulationData: v.optional(v.boolean()),
      monthlyIncome: v.optional(v.number()),
      monthlyCost: v.optional(v.number()),
      forecastDataView: v.optional(v.union(v.literal("all"), v.literal("real"), v.literal("projected"))),
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
      dashboardLayout: v.optional(v.array(v.string())),
      customSettings: v.optional(v.any())
    })
  },
  handler: async (ctx, { preferences }) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Look up user preferences from the database
    const userPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!userPrefs) {
      // If no preferences exist yet, create a new entry with merged defaults
      const newPreferences = { 
        ...DEFAULT_PREFERENCES,
        ...preferences
      };
      
      await ctx.db.insert("userPreferences", {
        userId,
        preferences: newPreferences,
        lastUpdated: Date.now()
      });
    } else {
      // Update existing preferences by merging
      const updatedPreferences = { 
        ...userPrefs.preferences,
        ...preferences
      };
      
      await ctx.db.patch(userPrefs._id, {
        preferences: updatedPreferences,
        lastUpdated: Date.now()
      });
    }
    
    return true;
  }
}); 