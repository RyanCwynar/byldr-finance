"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function FinnhubTestPage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [skipMarketCheck, setSkipMarketCheck] = useState(false);

  const testFinnhub = useAction(api.testFinnhub.testFinnhubQuote);
  const updateQuotes = useAction(api.quoteActions.updateQuotes);
  const getStockQuote = useAction(api.quoteActions.getStockQuote);

  async function handleTestFinnhub() {
    setLoading(true);
    try {
      const data = await testFinnhub({ symbol });
      setResult(data);
    } catch (error) {
      console.error("Error testing Finnhub:", error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleGetStockQuote() {
    setLoading(true);
    try {
      const price = await getStockQuote({ symbol, skipMarketCheck });
      setResult({ symbol, price, skipMarketCheck });
    } catch (error) {
      console.error("Error getting stock quote:", error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAllQuotes() {
    setLoading(true);
    try {
      const data = await updateQuotes();
      setResult(data);
    } catch (error) {
      console.error("Error updating quotes:", error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  // Check if US market is currently open
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = nyTime.getDay();
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  const marketOpenTime = 9 * 60 + 30;  // 9:30 AM
  const marketCloseTime = 16 * 60;     // 4:00 PM
  const isWeekend = day === 0 || day === 6;
  const isMarketOpen = !isWeekend && timeInMinutes >= marketOpenTime && timeInMinutes < marketCloseTime;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Finnhub API Test</h1>
      
      <div className="mb-8 p-4 border border-gray-700 rounded-lg">
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Market Status</h2>
          <p className={`text-lg ${isMarketOpen ? 'text-green-500' : 'text-red-500'}`}>
            US Stock Market is currently {isMarketOpen ? 'OPEN' : 'CLOSED'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            New York Time: {nyTime.toLocaleTimeString()} ({isWeekend ? 'Weekend' : 'Weekday'})
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Market Hours: 9:30 AM - 4:00 PM ET (Mon-Fri)
          </p>
          <p className="text-sm text-gray-400 mt-3">
            Note: Stock quotes will only update during market hours. Crypto quotes update 24/7.
          </p>
        </div>
        
        <h2 className="text-xl font-semibold mb-4">Test Single Symbol</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md flex-grow"
          />
          <button
            onClick={handleGetStockQuote}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {loading ? "Loading..." : "Get Stock Quote"}
          </button>
        </div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="skipMarketCheck"
            checked={skipMarketCheck}
            onChange={(e) => setSkipMarketCheck(e.target.checked)}
            className="mr-2 h-4 w-4"
          />
          <label htmlFor="skipMarketCheck" className="text-sm text-gray-300">
            Skip market hours check (get quote even when market is closed)
          </label>
        </div>
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleTestFinnhub}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md disabled:opacity-50"
          >
            {loading ? "Loading..." : "Test Raw Finnhub API"}
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Update All Quotes</h2>
        <p className="text-sm text-gray-400 mb-4">
          This function is automatically run every hour by a cron job. You can manually trigger it here for testing.
        </p>
        <button
          onClick={handleUpdateAllQuotes}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update All Quotes"}
        </button>
      </div>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 