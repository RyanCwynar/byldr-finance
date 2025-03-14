import { api } from "./_generated/api";
import { action, mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// Upsert a quote (create or update)
export const upsertQuote = mutation({
  args: {
    symbol: v.string(),
    price: v.number()
  },
  handler: async (ctx, { symbol, price }) => {
    // Try to find existing quote
    const existingQuote = await ctx.db
      .query("quotes")
      .withIndex("by_symbol", q => q.eq("symbol", symbol))
      .first();

    if (existingQuote) {
      // Update existing quote
      return await ctx.db.patch(existingQuote._id, {
        price,
        lastUpdated: Date.now()
      });
    } else {
      // Create new quote
      return await ctx.db.insert("quotes", {
        symbol,
        price,
        lastUpdated: Date.now()
      });
    }
  }
});

// Get a quote by symbol
export const getQuote = query({
  args: {
    symbol: v.string()
  },
  handler: async (ctx, { symbol }) => {
    // Try to find existing quote
    const quote = await ctx.db
      .query("quotes")
      .withIndex("by_symbol", q => q.eq("symbol", symbol))
      .first();

    return quote;
  }
});

// Helper function to get all quotes
export async function getQuotesHelper(ctx: QueryCtx): Promise<{ [symbol: string]: number }> {
  const quotes = await ctx.db
    .query("quotes")
    .collect();

  // Convert to dictionary format for easier lookup
  const quotesMap: { [symbol: string]: number } = {};
  quotes.forEach((quote: any) => {
    quotesMap[quote.symbol] = quote.price;
  });

  return quotesMap;
}

// Get all quotes
export const getQuotes = query({
  handler: async (ctx) => {
    return await getQuotesHelper(ctx);
  }
});


// List all quotes records
export const listQuotes = query({
  handler: async (ctx) => {
    const quotes = await ctx.db
      .query("quotes")
      .collect();
    
    return quotes;
  }
});

// Map common token symbols to their CoinGecko IDs for things I hold
const COINGECKO_ID_MAP: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'AVAX': 'avalanche-2',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'DAI': 'dai',
    'OP': 'optimism',
    'DSYNC': 'destra-network',
    'ENQAI': 'enqai',
    'PALM': 'palm-ai',
  };
  
  // Get prices from CoinGecko for a list of symbols
  async function getPricesForSymbols(symbols: string[]) {
    const ids = symbols
      .map(s => COINGECKO_ID_MAP[s.toUpperCase()] || s.toLowerCase())
      .filter(Boolean)
      .join(',');
    
    console.log("Fetching prices for symbols:", symbols);
    console.log("Using CoinGecko IDs:", ids);
  
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );
    const data = await response.json();
    console.log("CoinGecko price response:", data);
  
    // Map CoinGecko IDs back to original symbols
    const symbolPrices: Record<string, number> = {};
    for (const symbol of symbols) {
      const id = COINGECKO_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
      if (data[id]) {
        symbolPrices[symbol] = data[id].usd;
      }
    }
    console.log("Symbol prices:", symbolPrices);
  
    return symbolPrices;
  }

// Update quotes for all symbols we care about
export const updateQuotes = action({
  handler: async (ctx) => {
    // Get all symbols from holdings
    const holdings = await ctx.runQuery(api.holdings.listHoldings, {});
    const holdingsSymbols = new Set<string>();
    holdings.forEach((holding) => {
      const symbol = holding.quoteSymbol || holding.symbol;
      holdingsSymbols.add(symbol);
    });

    // Get existing symbols from quotes table
    const existingQuotes = await ctx.runQuery(api.quotes.listQuotes, {});
    existingQuotes.forEach((quote) => {
      holdingsSymbols.add(quote.symbol);
    });

    // Get current prices for all symbols
    const symbols = Array.from(holdingsSymbols);
    const prices = await getPricesForSymbols(symbols);

    // Update quotes table with new prices
    for (const [symbol, price] of Object.entries(prices)) {
      await ctx.runMutation(api.quotes.upsertQuote, {
        symbol,
        price,
      });
    }

    return {
      updatedSymbols: symbols,
      prices
    };
  }
});