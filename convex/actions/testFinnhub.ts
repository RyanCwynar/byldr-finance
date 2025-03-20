"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";

// Test action for Finnhub API
export const testFinnhubQuote = action({
  args: {
    symbol: v.string(),
  },
  handler: async (ctx, { symbol }) => {
    console.log(`Testing Finnhub API for symbol: ${symbol}`);
    
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (!FINNHUB_API_KEY) {
      throw new Error("No Finnhub API key found in environment variables");
    }
    
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`Finnhub response:`, data);
      
      // Return the full response for debugging
      return {
        symbol,
        response: data,
        currentPrice: data.c,
        open: data.o,
        high: data.h,
        low: data.l,
        previousClose: data.pc,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Error fetching from Finnhub:`, error);
      throw error;
    }
  },
}); 