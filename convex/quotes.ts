import { api } from "./_generated/api";
import { action, mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// Upsert a quote (create or update)
export const upsertQuote = mutation({
  args: {
    symbol: v.string(),
    price: v.number(),
    type: v.optional(v.union(v.literal("crypto"), v.literal("stock"))),
    ignored: v.optional(v.boolean())
  },
  handler: async (ctx, { symbol, price, type, ignored }) => {
    // Try to find existing quote
    const existingQuote = await ctx.db
      .query("quotes")
      .withIndex("by_symbol", q => q.eq("symbol", symbol))
      .first();

    if (existingQuote) {
      // Update existing quote
      return await ctx.db.patch(existingQuote._id, {
        price,
        lastUpdated: Date.now(),
        type: type || existingQuote.type || "crypto", // Keep existing type if not provided, default to crypto
        ...(ignored !== undefined ? { ignored } : {}) // Only update ignored if provided
      });
    } else {
      // Create new quote
      return await ctx.db.insert("quotes", {
        symbol,
        price,
        lastUpdated: Date.now(),
        type: type || "crypto", // Default to crypto if not provided
        ...(ignored !== undefined ? { ignored } : {}) // Only include ignored if provided
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

// Get stock prices from Alpha Vantage API
async function getStockPrices(symbols: string[]) {
  // Replace with your Alpha Vantage API key
  const API_KEY = "GGYT0O0DY3ZPHPOW";
  
  console.log("Fetching stock prices for symbols:", symbols);
  
  const symbolPrices: Record<string, number> = {};
  
  // Alpha Vantage free tier has rate limits, so we need to fetch one at a time
  for (const symbol of symbols) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`Alpha Vantage response for ${symbol}:`, data);
      
      // Extract the price from the response
      if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
        const price = parseFloat(data["Global Quote"]["05. price"]);
        symbolPrices[symbol] = price;
      }
      
      // Alpha Vantage free tier has a limit of 5 requests per minute
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 12000));
    } catch (error) {
      console.error(`Error fetching stock price for ${symbol}:`, error);
    }
  }
  
  console.log("Stock prices:", symbolPrices);
  return symbolPrices;
}

// Update quotes for all symbols we care about
export const updateQuotes = action({
  handler: async (ctx) => {
    // Get all symbols from holdings
    const holdings = await ctx.runQuery(api.holdings.listHoldings, {});
    const holdingSymbols = new Map<string, { symbol: string, type?: string }>();
    
    holdings.forEach((holding) => {
      const symbol = holding.quoteSymbol || holding.symbol;
      // Only set type if it's explicitly defined on the holding
      const type = holding.quoteType;
      holdingSymbols.set(symbol, { symbol, type });
    });

    // Get existing symbols from quotes table
    const existingQuotes = await ctx.runQuery(api.quotes.listQuotes, {});
    existingQuotes.forEach((quote) => {
      // Skip ignored quotes
      if (quote.ignored) {
        console.log(`Skipping ignored quote: ${quote.symbol}`);
        return;
      }
      
      if (!holdingSymbols.has(quote.symbol)) {
        holdingSymbols.set(quote.symbol, { 
          symbol: quote.symbol, 
          type: quote.type // Only use the type if it's explicitly set in the quote
        });
      } else if (!holdingSymbols.get(quote.symbol)?.type && quote.type) {
        // If we have a symbol from holdings without a type, but the quote has a type, use that
        holdingSymbols.set(quote.symbol, { 
          symbol: quote.symbol, 
          type: quote.type 
        });
      }
    });

    // Separate symbols into crypto and stock symbols based on their type
    const symbolsArray = Array.from(holdingSymbols.values());
    const cryptoSymbols = symbolsArray
      .filter(item => item.type === "crypto")
      .map(item => item.symbol);
    
    const stockSymbols = symbolsArray
      .filter(item => item.type === "stock")
      .map(item => item.symbol);
    
    console.log("Crypto symbols:", cryptoSymbols);
    console.log("Stock symbols:", stockSymbols);
    console.log("Symbols without clear type (skipping):", 
      symbolsArray.filter(item => !item.type).map(item => item.symbol));

    // Get current prices for crypto symbols
    const cryptoPrices = await getPricesForSymbols(cryptoSymbols);
    
    // Get current prices for stock symbols
    const stockPrices = await getStockPrices(stockSymbols);
    
    // Update quotes table with new prices
    for (const symbol of cryptoSymbols) {
      if (cryptoPrices[symbol]) {
        await ctx.runMutation(api.quotes.upsertQuote, {
          symbol,
          price: cryptoPrices[symbol],
          type: "crypto"
        });
      }
    }
    
    for (const symbol of stockSymbols) {
      if (stockPrices[symbol]) {
        await ctx.runMutation(api.quotes.upsertQuote, {
          symbol,
          price: stockPrices[symbol],
          type: "stock"
        });
      }
    }

    // Combine all prices for the return value
    const prices = { ...cryptoPrices, ...stockPrices };
    
    return {
      updatedCryptoSymbols: cryptoSymbols,
      updatedStockSymbols: stockSymbols,
      prices
    };
  }
});

// Get a stock quote directly from Alpha Vantage (for testing)
export const getStockQuote = action({
  args: {
    symbol: v.string()
  },
  handler: async (ctx, { symbol }) => {
    const prices = await getStockPrices([symbol]);
    if (prices[symbol]) {
      // Store the quote in the database
      await ctx.runMutation(api.quotes.upsertQuote, {
        symbol,
        price: prices[symbol],
        type: "stock" // Explicitly set type to stock
      });
    }
    return prices[symbol] || null;
  }
});

// Get a crypto quote directly from CoinGecko (for testing)
export const getCryptoQuote = action({
  args: {
    symbol: v.string()
  },
  handler: async (ctx, { symbol }) => {
    const prices = await getPricesForSymbols([symbol]);
    if (prices[symbol]) {
      // Store the quote in the database
      await ctx.runMutation(api.quotes.upsertQuote, {
        symbol,
        price: prices[symbol],
        type: "crypto" // Explicitly set type to crypto
      });
    }
    return prices[symbol] || null;
  }
});

// Toggle a quote's ignored status
export const toggleQuoteIgnored = mutation({
  args: {
    id: v.id("quotes")
  },
  handler: async (ctx, { id }) => {
    const quote = await ctx.db.get(id);
    if (!quote) {
      throw new Error("Quote not found");
    }
    
    return await ctx.db.patch(id, {
      ignored: !quote.ignored
    });
  }
});