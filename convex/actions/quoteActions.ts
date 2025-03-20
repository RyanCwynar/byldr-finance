"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// ==========================================
// Helper Functions
// ==========================================

// Map common token symbols to their CoinGecko IDs
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

// Helper function to check if the US stock market is open
function isMarketOpen(): boolean {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  // Check if it's a weekday
  const day = nyTime.getDay();
  if (day === 0 || day === 6) return false; // Weekend
  
  // Check if it's between 9:30 AM and 4:00 PM ET
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  const marketOpenTime = 9 * 60 + 30;  // 9:30 AM
  const marketCloseTime = 16 * 60;     // 4:00 PM
  
  return timeInMinutes >= marketOpenTime && timeInMinutes < marketCloseTime;
}

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

// Get stock prices from Finnhub API
async function getStockPrices(symbols: string[], skipMarketCheck = false) {
  console.log("Fetching stock prices for symbols:", symbols);
  
  // Check if market is open, unless we're skipping this check
  if (!skipMarketCheck) {
    const marketOpen = isMarketOpen();
    if (!marketOpen) {
      console.log("Stock market is closed, skipping stock price updates");
      return {};
    }
  }
  
  // Get API key from environment
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_API_KEY) {
    console.error("No Finnhub API key found in environment variables");
    return {};
  }
  
  const symbolPrices: Record<string, number> = {};
  
  // Process symbols in batches to reduce API calls
  // Finnhub doesn't support true batch processing, but we can still optimize our requests
  const BATCH_SIZE = 5; // Number of symbols to process in parallel
  
  // Process symbols in batches
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batchSymbols = symbols.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch of symbols: ${batchSymbols.join(', ')}`);
    
    // Create an array of promises for concurrent requests
    const promises = batchSymbols.map(async (symbol) => {
      try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`Finnhub response for ${symbol}:`, data);
        
        // Extract the current price from the response
        if (data && data.c) {
          const price = parseFloat(data.c);
          return { symbol, price };
        } else if (data && data.error) {
          console.error(`Error from Finnhub for ${symbol}:`, data.error);
          return { symbol, error: data.error };
        }
        return { symbol, error: "No data returned" };
      } catch (error) {
        console.error(`Error fetching stock price for ${symbol}:`, error);
        return { symbol, error };
      }
    });
    
    // Wait for all requests in this batch to complete
    const results = await Promise.all(promises);
    
    // Process results
    results.forEach(result => {
      if (result.price !== undefined) {
        symbolPrices[result.symbol] = result.price;
      }
    });
    
    // Add a delay between batches to avoid rate limits
    if (i + BATCH_SIZE < symbols.length) {
      console.log(`Waiting between batches...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log("Stock prices:", symbolPrices);
  return symbolPrices;
}

// ==========================================
// Actions
// ==========================================

// Update quotes for all holdings
export const updateQuotes = action({
  handler: async (ctx): Promise<{ updated: number; total: number; skipped: number }> => {
    console.log("Starting quote update...");
    // Get all holdings to determine which quotes we need
    const holdings = await ctx.runQuery(api.holdings.listHoldings, {});
    
    // Get current quotes
    const currentQuotes = await ctx.runQuery(api.quotes.getQuotes);
    
    // Get all quotes to check which ones are ignored
    const allQuotes = await ctx.runQuery(api.quotes.listQuotes);
    const ignoredSymbols = new Set<string>(
      allQuotes.filter((q: any) => q.ignored).map((q: any) => q.symbol)
    );

    // Create map of symbols to their quote types from holdings
    const holdingQuoteTypes = new Map<string, string>(
      holdings.map((h: any) => [h.quoteSymbol || h.symbol, h.quoteType])
    );

    // Get unique symbols from holdings and filter out ignored ones
    const symbolsToUpdate = [...new Set(holdings.map((h: any) => h.quoteSymbol || h.symbol))]
      .filter(s => !ignoredSymbols.has(s));

    console.log("Symbols to update:", symbolsToUpdate);
    
    // Separate crypto and stock symbols based on holding quote types
    const cryptoSymbols = symbolsToUpdate.filter(s => holdingQuoteTypes.get(s) === "crypto");
    const stockSymbols = symbolsToUpdate.filter(s => holdingQuoteTypes.get(s) === "stock");
    
    console.log("Crypto symbols:", cryptoSymbols);
    console.log("Stock symbols:", stockSymbols);
    
    // Get current prices from external APIs
    const cryptoPrices = await getPricesForSymbols(cryptoSymbols);
    const stockPrices = await getStockPrices(stockSymbols);
    
    // Combine prices
    const prices = { ...cryptoPrices, ...stockPrices };
    console.log("All prices:", prices);
    
    // Check for missing prices and try to use cached values as fallback
    const missingSymbols = symbolsToUpdate.filter(s => !prices[s]);
    if (missingSymbols.length > 0) {
      console.log(`Missing prices for symbols: ${missingSymbols.join(', ')}. Checking for cached values.`);
      
      for (const symbol of missingSymbols) {
        // If we have a cached price for this symbol, use it as a fallback
        if (currentQuotes[symbol]) {
          console.log(`Using cached price for ${symbol}: ${currentQuotes[symbol]}`);
          prices[symbol] = currentQuotes[symbol];
        } else {
          console.log(`No cached price available for ${symbol}`);
        }
      }
    }
    
    // Update quotes in database
    let updatedCount = 0;
    for (const [symbol, price] of Object.entries(prices)) {
      // Skip if price is undefined or NaN
      if (price === undefined || isNaN(price)) {
        console.log(`Skipping ${symbol} due to invalid price:`, price);
        continue;
      }
      
      // Skip if price hasn't changed
      if (currentQuotes[symbol] === price) {
        console.log(`Skipping ${symbol} as price hasn't changed:`, price);
        continue;
      }
      
      try {
        // Determine quote type based on symbol lists
        const type = stockSymbols.includes(symbol) ? "stock" : "crypto";
        // Use the upsertQuote mutation to update or create the quote
        await ctx.runMutation(api.quotes.upsertQuote, {
          symbol,
          price,
          type
        });
        updatedCount++;
      } catch (error) {
        console.error(`Error updating quote for ${symbol}:`, error);
      }
    }
    
    // For stock symbols that weren't updated due to market hours, log them
    const updatedSymbols = new Set(Object.keys(prices));
    const skippedStocks = stockSymbols.filter(s => !updatedSymbols.has(s));
    if (skippedStocks.length > 0) {
      console.log("Skipped updating these stock symbols due to market hours:", skippedStocks);
    }
    
    console.log(`Updated ${updatedCount} quotes`);
    return { 
      updated: updatedCount,
      total: symbolsToUpdate.length,
      skipped: symbolsToUpdate.length - updatedCount
    };
  },
});

// Get a stock quote directly from Finnhub (for testing)
export const getStockQuote = action({
  args: {
    symbol: v.string(),
    skipMarketCheck: v.optional(v.boolean())
  },
  handler: async (ctx, { symbol, skipMarketCheck = false }) => {
    const prices = await getStockPrices([symbol], skipMarketCheck);
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