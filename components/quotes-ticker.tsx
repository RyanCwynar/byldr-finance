'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState, useRef, useMemo } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/formatters';

export default function QuotesTicker() {
  const quotes = useQuery(api.quotes.listQuotesWithChange) || [];
  const [tickerWords, setTickerWords] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const tickerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out ignored quotes and sort by symbol
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => !quote.ignored)
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [quotes]);

  // Generate the ticker content from quotes
  useEffect(() => {
    if (filteredQuotes.length === 0) return;
    
    const quoteElements: string[] = [];
    
    filteredQuotes.forEach((quote) => {
      const percentChange = quote.percentChange || 0;
      const isUp = percentChange >= 0;
      const formattedPrice = formatCurrency(quote.price);
      const formattedPercent = Math.abs(percentChange).toFixed(2);
      
      // Add color spans for up/down indicators
      const colorClass = isUp ? 'text-green-500' : 'text-red-500';
      const arrow = isUp ? '▲' : '▼';
      
      // Create a single quote element
      const quoteElement = `<span class="ticker-item">${quote.symbol}: ${formattedPrice} <span class="${colorClass}">${arrow} ${formattedPercent}%</span></span>`;
      quoteElements.push(quoteElement);
    });
    
    // Duplicate the elements to ensure continuous scrolling
    const allElements = [...quoteElements, ...quoteElements, ...quoteElements];
    setTickerWords(allElements);
  }, [filteredQuotes]);

  // Set up the ticker animation
  useEffect(() => {
    // Don't do anything if there are no words or if paused
    if (tickerWords.length === 0 || isPaused) {
      if (tickerIntervalRef.current) {
        clearInterval(tickerIntervalRef.current);
        tickerIntervalRef.current = null;
      }
      return;
    }
    
    // Clear any existing interval
    if (tickerIntervalRef.current) {
      clearInterval(tickerIntervalRef.current);
    }
    
    // Start a new interval that moves words from front to back
    tickerIntervalRef.current = setInterval(() => {
      setTickerWords(prev => {
        if (prev.length <= 1) return prev; // Prevent issues with empty arrays
        // Move the first word to the end
        const firstWord = prev[0];
        const restWords = prev.slice(1);
        return [...restWords, firstWord];
      });
    }, 2000); // 2 seconds per word movement for better readability
    
    // Cleanup on unmount or dependency change
    return () => {
      if (tickerIntervalRef.current) {
        clearInterval(tickerIntervalRef.current);
        tickerIntervalRef.current = null;
      }
    };
  }, [tickerWords.length, isPaused]); // Only depend on the length, not the content

  // Toggle pause state
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // If no quotes to display, show a message
  if (filteredQuotes.length === 0) {
    return (
      <div className="w-full border-b border-gray-800 py-1 text-center">
        No quotes available
      </div>
    );
  }

  return (
    <div className="w-full border-b border-gray-800 overflow-hidden py-1 relative">
      <div className="ticker-container px-4">
        <div className="ticker-text">
          {tickerWords.map((word, index) => (
            <span key={`ticker-word-${index}`} dangerouslySetInnerHTML={{ __html: word + ' ' }} />
          ))}
        </div>
      </div>
      
      {/* Pause/Play button */}
      <button
        onClick={togglePause}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800/70 hover:bg-gray-700/70 text-white rounded-full p-1 z-10"
        aria-label={isPaused ? "Play ticker" : "Pause ticker"}
      >
        {isPaused ? (
          <PlayIcon className="w-4 h-4" />
        ) : (
          <PauseIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
} 