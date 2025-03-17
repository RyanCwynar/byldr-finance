'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from "@/convex/_generated/dataModel";
import { EyeIcon, EyeSlashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

type Quote = Doc<"quotes">;

interface QuotesManagerProps {
  initialQuotes: Quote[];
}

export default function QuotesManager({ initialQuotes }: QuotesManagerProps) {
  // Use the preloaded quotes as initial data, but keep it updated with real-time changes
  const liveQuotes = useQuery(api.quotes.listQuotes) ?? initialQuotes;
  const [filter, setFilter] = useState<'all' | 'active' | 'ignored'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'lastUpdated'>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const toggleQuoteIgnored = useMutation(api.quotes.toggleQuoteIgnored);
  
  // Filter and sort quotes
  const filteredAndSortedQuotes = useMemo(() => {
    // First, filter by search term and active/ignored status
    let filtered = liveQuotes.filter(quote => {
      const matchesSearch = search === '' || 
        quote.symbol.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'active' && !quote.ignored) || 
        (filter === 'ignored' && quote.ignored);
      
      return matchesSearch && matchesFilter;
    });
    
    // Then, sort by the selected column
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'symbol') {
        comparison = a.symbol.localeCompare(b.symbol);
      } else if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'lastUpdated') {
        comparison = a.lastUpdated - b.lastUpdated;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [liveQuotes, filter, search, sortBy, sortDirection]);
  
  // Handle toggling a quote's ignored status
  const handleToggleIgnored = async (id: string) => {
    await toggleQuoteIgnored({ id: id as any });
  };
  
  // Handle sorting
  const handleSort = (column: 'symbol' | 'price' | 'lastUpdated') => {
    if (sortBy === column) {
      // If already sorting by this column, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, sort by this column in ascending order
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded ${filter === 'active' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('ignored')}
            className={`px-3 py-1 rounded ${filter === 'ignored' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Ignored
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/80">
                <th 
                  className="px-4 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center">
                    <span>Symbol</span>
                    {sortBy === 'symbol' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end">
                    <span>Price</span>
                    {sortBy === 'price' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('lastUpdated')}
                >
                  <div className="flex items-center">
                    <span>Last Updated</span>
                    {sortBy === 'lastUpdated' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No quotes found
                  </td>
                </tr>
              ) : (
                filteredAndSortedQuotes.map((quote) => (
                  <tr key={quote._id} className="border-t border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">{quote.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono">${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {new Date(quote.lastUpdated).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${quote.type === 'crypto' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
                        {quote.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${quote.ignored ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                        {quote.ignored ? 'Ignored' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleIgnored(quote._id)}
                        className="p-2 rounded-full hover:bg-gray-700"
                        title={quote.ignored ? "Show in ticker" : "Hide from ticker"}
                      >
                        {quote.ignored ? (
                          <EyeIcon className="w-5 h-5 text-blue-400" />
                        ) : (
                          <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 