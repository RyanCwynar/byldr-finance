import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";

interface HoldingFormProps {
  walletId: Id<"wallets">;
  onClose: () => void;
  holding?: Doc<"holdings">; // Optional holding for editing
}

export default function HoldingForm({ walletId, onClose, holding }: HoldingFormProps) {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [isDebt, setIsDebt] = useState(false);
  const [quoteSymbol, setQuoteSymbol] = useState("");
  const [quoteType, setQuoteType] = useState<"crypto" | "stock">("crypto");
  const [ignore, setIgnore] = useState(false);
  
  // Initialize form with holding data if editing
  useEffect(() => {
    if (holding) {
      setSymbol(holding.symbol);
      setQuantity(holding.quantity.toString());
      setChain(holding.chain);
      setIsDebt(holding.isDebt || false);
      setQuoteSymbol(holding.quoteSymbol || "");
      setQuoteType(holding.quoteType || "crypto");
      setIgnore(holding.ignore || false);
    }
  }, [holding]);
  
  const upsertHolding = useMutation(api.holdings.upsertHolding);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await upsertHolding({
      walletId,
      symbol: symbol,
      quantity: Number(quantity),
      chain,
      isDebt,
      ignore,
      quoteSymbol: quoteSymbol || undefined,
      quoteType
    });
    
    onClose();
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium leading-6 text-gray-100 mb-4">
        {holding ? "Edit Holding" : "Add New Holding"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-300">
            Token Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            placeholder="ETH, BTC, USDC, etc."
            disabled={!!holding} // Disable editing symbol for existing holdings
          />
        </div>
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-300">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            step="any"
            min="0"
            placeholder="0.0"
          />
        </div>
        
        <div>
          <label htmlFor="chain" className="block text-sm font-medium text-gray-300">
            Chain
          </label>
          <select
            id="chain"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={!!holding} // Disable editing chain for existing holdings
          >
            <option value="ethereum">Ethereum</option>
            <option value="bitcoin">Bitcoin</option>
            <option value="solana">Solana</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="base">Base</option>
            <option value="virtual">Virtual</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDebt"
            checked={isDebt}
            onChange={(e) => setIsDebt(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isDebt" className="ml-2 block text-sm font-medium text-gray-300">
            This is a debt (negative balance)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="ignore"
            checked={ignore}
            onChange={(e) => setIgnore(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="ignore" className="ml-2 block text-sm font-medium text-gray-300">
            Ignore this holding in calculations
          </label>
        </div>
        
        <div>
          <label htmlFor="quoteSymbol" className="block text-sm font-medium text-gray-300">
            Quote Symbol (Optional)
          </label>
          <input
            type="text"
            id="quoteSymbol"
            value={quoteSymbol}
            onChange={(e) => setQuoteSymbol(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="For price lookup, e.g. WETH → ETH"
          />
          <p className="mt-1 text-xs text-gray-400">
            If the token has a different symbol for price lookup, enter it here.
          </p>
        </div>
        
        <div>
          <label htmlFor="quoteType" className="block text-sm font-medium text-gray-300">
            Quote Type
          </label>
          <select
            id="quoteType"
            value={quoteType}
            onChange={(e) => setQuoteType(e.target.value as "crypto" | "stock")}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="crypto">Cryptocurrency</option>
            <option value="stock">Stock</option>
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Select whether this is a cryptocurrency or stock market symbol.
          </p>
        </div>
        
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {holding ? "Update Holding" : "Add Holding"}
          </button>
        </div>
      </form>
    </div>
  );
} 