'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from "@/convex/_generated/dataModel";
import { formatNumber } from '@/lib/formatters';
import QuoteSlider from './quote-slider';
import SimulationSummary from './simulation-summary';
import SimulationWallets from './simulation-wallets';


type Quote = Doc<"quotes">;
type Holding = Doc<"holdings">;
type Wallet = Doc<"wallets">;
type Asset = Doc<"assets">;
type Debt = Doc<"debts">;

interface SimulationViewProps {
  initialQuotes: Quote[];
  initialHoldings: Holding[];
  initialWallets: Wallet[];
  manualAssets: Asset[];
  manualDebts: Debt[];
}

export default function SimulationView({ 
  initialQuotes, 
  initialHoldings, 
  initialWallets,
  manualAssets,
  manualDebts
}: SimulationViewProps) {
  // State for adjusted quote values
  const [adjustedQuotes, setAdjustedQuotes] = useState<Record<string, number>>({});
  const [debug, setDebug] = useState<any>({});
  const [initialized, setInitialized] = useState(false);

  const savedSimulation = useQuery(api.simulations.getSimulation, {});
  const saveSimulation = useMutation(api.simulations.saveSimulation);
  const clearSimulation = useMutation(api.simulations.clearSimulation);

  // Load saved adjustments from the database only once
  useEffect(() => {
    if (initialized) return;
    if (savedSimulation === undefined) return;

    if (savedSimulation?.adjustments) {
      setAdjustedQuotes(savedSimulation.adjustments);
    }
    setInitialized(true);
  }, [savedSimulation, initialized]);
  
  // Get unique symbols from holdings
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set<string>();
    initialHoldings.forEach(holding => {
      const symbol = holding.quoteSymbol || holding.symbol;
      if (symbol) {
        symbols.add(symbol);
      }
    });
    return Array.from(symbols).sort();
  }, [initialHoldings]);
  
  // Create a map of original quotes
  const originalQuotesMap = useMemo(() => {
    const map: Record<string, number> = {};
    initialQuotes.forEach(quote => {
      map[quote.symbol] = quote.price;
    });
    return map;
  }, [initialQuotes]);
  
  // Calculate adjusted holdings values
  const adjustedHoldings = useMemo(() => {
    return initialHoldings.map(holding => {
      const symbol = holding.quoteSymbol || holding.symbol;
      
      // Get the original price from quotes or use 1 for non-quoted assets (like manual assets)
      const originalPrice = symbol && originalQuotesMap[symbol] ? originalQuotesMap[symbol] : 1;
      
      // Get the adjusted price or use the original if no adjustment
      const adjustedPrice = symbol && adjustedQuotes[symbol] !== undefined ? adjustedQuotes[symbol] : originalPrice;
      
      // Calculate the adjustment factor
      const adjustmentFactor = originalPrice > 0 ? adjustedPrice / originalPrice : 1;
      
      // For non-crypto assets or debts without a quote, use the quantity directly as the value
      let originalValue = 0;
      let adjustedValue = 0;
      
      if (!symbol || !originalQuotesMap[symbol]) {
        // This is a manual asset/debt without a quote - quantity is the value
        originalValue = holding.quantity;
        adjustedValue = holding.quantity; // Manual assets don't get adjusted in simulation
      } else {
        // This is a quoted asset/debt - calculate value based on quantity and price
        originalValue = holding.quantity * originalPrice;
        adjustedValue = holding.quantity * adjustedPrice;
      }
      
      return {
        ...holding,
        adjustedValue,
        originalValue,
        adjustmentFactor,
        originalPrice,
        adjustedPrice,
        hasQuote: !!originalQuotesMap[symbol]
      };
    });
  }, [initialHoldings, originalQuotesMap, adjustedQuotes]);
  
  // Process manual assets
  const adjustedManualAssets = useMemo(() => {
    return manualAssets.map(asset => {
      // For manual assets, we don't adjust the value based on quotes
      return {
        ...asset,
        originalValue: asset.value,
        adjustedValue: asset.value,
        isManual: true
      };
    });
  }, [manualAssets]);
  
  // Process manual debts
  const adjustedManualDebts = useMemo(() => {
    return manualDebts.map(debt => {
      // For manual debts, we don't adjust the value based on quotes
      return {
        ...debt,
        originalValue: debt.value,
        adjustedValue: debt.value,
        isManual: true,
        isDebt: true
      };
    });
  }, [manualDebts]);
  
  // Calculate adjusted wallet values
  const adjustedWallets = useMemo(() => {
    // Group holdings by wallet
    const walletHoldingsMap = new Map<string, typeof adjustedHoldings>();
    
    adjustedHoldings.forEach(holding => {
      const walletId = holding.walletId.toString();
      if (!walletHoldingsMap.has(walletId)) {
        walletHoldingsMap.set(walletId, []);
      }
      walletHoldingsMap.get(walletId)?.push(holding);
    });
    
    return initialWallets.map(wallet => {
      const walletId = wallet._id.toString();
      const walletHoldings = walletHoldingsMap.get(walletId) || [];
      
      // Calculate total assets and debts
      let assets = 0;
      let debts = 0;
      let originalAssets = 0;
      let originalDebts = 0;
      
      walletHoldings.forEach(holding => {
        if (holding.isDebt) {
          debts += holding.adjustedValue;
          originalDebts += holding.originalValue;
        } else {
          assets += holding.adjustedValue;
          originalAssets += holding.originalValue;
        }
      });
      
      const value = assets - debts;
      const originalValue = originalAssets - originalDebts;
      
      return {
        ...wallet,
        originalValue,
        adjustedValue: value,
        adjustedAssets: assets,
        adjustedDebts: debts,
        originalAssets,
        originalDebts,
        percentChange: originalValue ? ((value - originalValue) / originalValue) * 100 : 0
      };
    });
  }, [initialWallets, adjustedHoldings]);
  
  // Calculate total portfolio value including manual assets and debts
  const portfolioSummary = useMemo(() => {
    let originalValue = 0;
    let adjustedValue = 0;
    let originalAssets = 0;
    let adjustedAssets = 0;
    let originalDebts = 0;
    let adjustedDebts = 0;
    
    // Add wallet values
    adjustedWallets.forEach(wallet => {
      originalValue += wallet.originalValue;
      adjustedValue += wallet.adjustedValue;
      originalAssets += wallet.originalAssets;
      adjustedAssets += wallet.adjustedAssets;
      originalDebts += wallet.originalDebts;
      adjustedDebts += wallet.adjustedDebts;
    });
    
    // Add manual assets
    adjustedManualAssets.forEach(asset => {
      originalAssets += asset.originalValue;
      adjustedAssets += asset.adjustedValue;
      originalValue += asset.originalValue;
      adjustedValue += asset.adjustedValue;
    });
    
    // Add manual debts
    adjustedManualDebts.forEach(debt => {
      originalDebts += debt.originalValue;
      adjustedDebts += debt.adjustedValue;
      originalValue -= debt.originalValue;
      adjustedValue -= debt.adjustedValue;
    });
    
    const summary = {
      originalValue,
      adjustedValue,
      originalAssets,
      adjustedAssets,
      originalDebts,
      adjustedDebts,
      percentChange: originalValue ? ((adjustedValue - originalValue) / originalValue) * 100 : 0
    };
    
    return summary;
  }, [adjustedWallets, adjustedManualAssets, adjustedManualDebts]);

  // Persist summary and adjustments whenever they change
  useEffect(() => {
    if (!initialized) return;

    try {
      saveSimulation({ adjustments: adjustedQuotes, summary: portfolioSummary });
    } catch (error) {
      console.error('Error saving simulation summary to DB:', error);
    }
  }, [portfolioSummary, adjustedQuotes, saveSimulation, initialized]);
  
  // Debug info
  useEffect(() => {
    // Count holdings by type
    const holdingsByType = {
      crypto: 0,
      stock: 0,
      manual: 0,
      debt: 0,
      withQuote: 0,
      withoutQuote: 0
    };
    
    initialHoldings.forEach(holding => {
      if (holding.isDebt) holdingsByType.debt++;
      if (holding.quoteType === 'crypto') holdingsByType.crypto++;
      if (holding.quoteType === 'stock') holdingsByType.stock++;
      
      const symbol = holding.quoteSymbol || holding.symbol;
      if (symbol && originalQuotesMap[symbol]) {
        holdingsByType.withQuote++;
      } else {
        holdingsByType.withoutQuote++;
        holdingsByType.manual++;
      }
    });
    
    setDebug({
      holdingsCount: initialHoldings.length,
      quotesCount: initialQuotes.length,
      walletsCount: initialWallets.length,
      manualAssetsCount: manualAssets.length,
      manualDebtsCount: manualDebts.length,
      uniqueSymbols: uniqueSymbols.length,
      adjustedHoldingsCount: adjustedHoldings.length,
      adjustedWalletsCount: adjustedWallets.length,
      originalQuotesMap: Object.keys(originalQuotesMap).length,
      holdingsByType,
      // Sample of holdings for inspection
      sampleHoldings: initialHoldings.slice(0, 3).map(h => ({
        symbol: h.symbol,
        quoteSymbol: h.quoteSymbol,
        quantity: h.quantity,
        isDebt: h.isDebt,
        quoteType: h.quoteType
      })),
      // Sample of adjusted holdings
      sampleAdjustedHoldings: adjustedHoldings.slice(0, 3).map(h => ({
        symbol: h.symbol,
        quoteSymbol: h.quoteSymbol,
        originalValue: h.originalValue,
        adjustedValue: h.adjustedValue,
        hasQuote: h.hasQuote
      })),
      // Sample of manual assets
      sampleManualAssets: manualAssets.slice(0, 3).map(a => ({
        name: a.name,
        type: a.type,
        value: a.value
      })),
      // Sample of manual debts
      sampleManualDebts: manualDebts.slice(0, 3).map(d => ({
        name: d.name,
        type: d.type,
        value: d.value
      }))
    });
  }, [initialHoldings, initialQuotes, initialWallets, manualAssets, manualDebts, uniqueSymbols, adjustedHoldings, adjustedWallets, originalQuotesMap]);
  
  // Handle slider change
  const handleSliderChange = (symbol: string, value: number) => {
    setAdjustedQuotes(prev => {
      const updated = {
        ...prev,
        [symbol]: value
      };
      
      return updated;
    });
  };
  
  // Reset all adjustments
  const handleReset = () => {
    setAdjustedQuotes({});

    try {
      clearSimulation();
    } catch (error) {
      console.error('Error clearing simulation data from DB:', error);
    }
  };
  
  // Filter symbols to only include those with quotes
  const quotedSymbols = useMemo(() => {
    return uniqueSymbols.filter(symbol => originalQuotesMap[symbol]);
  }, [uniqueSymbols, originalQuotesMap]);
  
  return (
    <div className="flex flex-col gap-8">
      <SimulationSummary summary={portfolioSummary} onReset={handleReset} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Adjust Asset Prices</h2>
          
          {quotedSymbols.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No quoted assets found.</p>
          ) : (
            <div className="space-y-6">
              {quotedSymbols.map(symbol => {
                const originalPrice = originalQuotesMap[symbol] || 0;
                const adjustedPrice = adjustedQuotes[symbol] !== undefined ? adjustedQuotes[symbol] : originalPrice;
                const percentChange = originalPrice ? ((adjustedPrice - originalPrice) / originalPrice) * 100 : 0;
                
                return (
                  <QuoteSlider
                    key={symbol}
                    symbol={symbol}
                    originalPrice={originalPrice}
                    adjustedPrice={adjustedPrice}
                    percentChange={percentChange}
                    onChange={(value) => handleSliderChange(symbol, value)}
                  />
                );
              })}
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-400">
            <p>Note: Manual assets and debts without quotes are not adjustable in the simulation.</p>
          </div>
        </div>
        
        <SimulationWallets wallets={adjustedWallets} />
      </div>
      
      {/* Manual Assets and Debts Summary */}
      {(manualAssets.length > 0 || manualDebts.length > 0) && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mt-4">
          <h2 className="text-xl font-semibold mb-4">Manual Assets and Debts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Assets */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-green-400">Assets</h3>
              {manualAssets.length === 0 ? (
                <p className="text-gray-400">No manual assets found.</p>
              ) : (
                <div className="space-y-3">
                  {manualAssets.map(asset => (
                    <div key={asset._id} className="p-3 bg-gray-800/50 rounded">
                      <div className="flex justify-between">
                        <span>{asset.name}</span>
                        <span className="text-green-400">${formatNumber(asset.value)}</span>
                      </div>
                      <div className="text-xs text-gray-400">{asset.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Manual Debts */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-red-400">Debts</h3>
              {manualDebts.length === 0 ? (
                <p className="text-gray-400">No manual debts found.</p>
              ) : (
                <div className="space-y-3">
                  {manualDebts.map(debt => (
                    <div key={debt._id} className="p-3 bg-gray-800/50 rounded">
                      <div className="flex justify-between">
                        <span>{debt.name}</span>
                        <span className="text-red-400">${formatNumber(debt.value)}</span>
                      </div>
                      <div className="text-xs text-gray-400">{debt.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Debug info - hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg text-xs font-mono">
          <h3 className="text-sm font-semibold mb-2">Debug Info</h3>
          <pre>{JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 