import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Store wallet addresses across different chains
  wallets: defineTable({
    name: v.string(),
    address: v.string(), // The wallet address
    chainType: v.string(), // "evm", "solana", or "bitcoin"
    value: v.optional(v.number()), // Current value in USD
    metadata: v.optional(v.object({
      lastUpdated: v.number(), // When the value was last updated
    })),
  }).index("by_address", ["address"]),

  // Store individual token holdings for each wallet
  holdings: defineTable({
    walletId: v.id("wallets"), // Reference to the wallet this holding belongs to
    symbol: v.string(), // Token symbol (ETH, BTC, USDC, etc)
    quantity: v.number(), // Amount of tokens held
    chain: v.string(), // Chain name - only relevant for L2 chains, defaults to mainnet 
    lastUpdated: v.number(), // When the holding was last updated
  })
    .index("by_wallet", ["walletId"])
    .index("by_symbol", ["symbol"])
    .index("by_symbol_and_wallet", ["symbol", "walletId"]),

  // Store daily financial metrics
  dailyMetrics: defineTable({
    date: v.number(), // Unix timestamp for the day
    netWorth: v.number(), // Total portfolio value in USD
    prices: v.object({
      ethereum: v.number(), // ETH price in USD
      bitcoin: v.number(), // BTC price in USD  
      solana: v.number(), // SOL price in USD
      avalanche: v.number(), // AVAX price in USD
    }),
    // Optional metadata
    metadata: v.optional(v.object({
      dataSource: v.string(),
      lastUpdated: v.number(),
    })),
  }).index("by_date", ["date"]),

  // Store different types of assets
  assets: defineTable({
    name: v.string(), // Name of the asset
    type: v.union(v.literal("real_estate"), v.literal("stocks"), v.literal("crypto"), v.literal("cash"), v.literal("other")),
    value: v.number(), // Current value in USD
    metadata: v.optional(v.object({
      description: v.string(),
      purchaseDate: v.number(), // Unix timestamp
      purchasePrice: v.number(), // Original purchase price in USD
      location: v.optional(v.string()), // Useful for real estate
      ticker: v.optional(v.string()), // Useful for stocks
      lastUpdated: v.number(), // When the value was last updated
    })),
    tags: v.optional(v.array(v.string())),
  }).index("by_type", ["type"]),

  // Store different types of debts
  debts: defineTable({
    name: v.string(), // Name of the debt
    type: v.union(v.literal("mortgage"), v.literal("loan"), v.literal("credit_card"), v.literal("crypto"), v.literal("other")),
    value: v.number(), // Current amount owed in USD
    metadata: v.optional(v.object({
      description: v.string(),
      startDate: v.number(), // When the debt was taken
      originalAmount: v.number(), // Original debt amount in USD
      interestRate: v.optional(v.number()), // Annual interest rate
      lender: v.optional(v.string()), // Name of the lender
      dueDate: v.optional(v.number()), // When the debt is due
      minimumPayment: v.optional(v.number()), // Minimum monthly payment
      lastUpdated: v.number(), // When the value was last updated
    })),
    tags: v.optional(v.array(v.string())),
  }).index("by_type", ["type"]),
});
