'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

export default function QuotesTicker() {
  const quotes = useQuery(api.quotes.listQuotes) || [];
  const [prevQuotes, setPrevQuotes] = useState<Record<string, number>>({});
  
  // Track previous quotes to show price changes
  useEffect(() => {
    if (quotes.length > 0) {
      const quoteMap: Record<string, number> = {};
      quotes.forEach((quote) => {
        quoteMap[quote.symbol] = quote.price;
      });
      setPrevQuotes(quoteMap);
    }
  }, []);

  // Filter out ignored quotes and sort by symbol
  const filteredQuotes = quotes.filter(quote => !quote.ignored);
  const sortedQuotes = [...filteredQuotes].sort((a, b) => a.symbol.localeCompare(b.symbol));

  // Create a single quote item component for reuse
  const QuoteItem = ({ quote }: { quote: typeof sortedQuotes[0] }) => {
    const prevPrice = prevQuotes[quote.symbol] || quote.price;
    const priceChange = quote.price - prevPrice;
    const percentChange = prevPrice ? (priceChange / prevPrice) * 100 : 0;
    const isUp = priceChange >= 0;
    
    return (
      <div className="inline-flex items-center mx-4">
        <span className="font-medium">{quote.symbol}</span>
        <span className="ml-2 font-mono">${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className={`ml-2 flex items-center ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
          {Math.abs(percentChange).toFixed(2)}%
        </span>
      </div>
    );
  };

  // If no quotes to display, show a message
  if (sortedQuotes.length === 0) {
    return (
      <div className="w-full bg-black/80 border-b border-gray-800 py-1 text-center text-gray-400">
        No quotes available
      </div>
    );
  }

  return (
    <div className="w-full bg-black/80 border-b border-gray-800 overflow-hidden py-1">
      <div className="flex animate-marquee whitespace-nowrap">
        <div className="flex flex-nowrap">
          {sortedQuotes.map((quote) => (
            <QuoteItem key={quote.symbol} quote={quote} />
          ))}
        </div>
        {/* Duplicate the content for seamless looping */}
        <div className="flex flex-nowrap">
          {sortedQuotes.map((quote) => (
            <QuoteItem key={`dup-${quote.symbol}`} quote={quote} />
          ))}
        </div>
      </div>
    </div>
  );
} 