import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

interface AssetFormProps {
  onClose: () => void;
  asset?: Doc<"assets">;
  onSubmit?: (updatedData: Partial<Doc<"assets">>) => Promise<void>;
}

export function AssetForm({ onClose, asset, onSubmit }: AssetFormProps) {
  const [name, setName] = useState(asset?.name || "");
  const [value, setValue] = useState(asset?.value.toString() || "");
  const [type, setType] = useState<"real_estate" | "stocks" | "crypto" | "cash" | "other">(
    asset?.type || "other"
  );
  const [description, setDescription] = useState(asset?.metadata?.description || "");
  const [location, setLocation] = useState(asset?.metadata?.location || "");
  const [ticker, setTicker] = useState(asset?.metadata?.ticker || "");
  const [purchasePrice, setPurchasePrice] = useState(
    asset?.metadata?.purchasePrice !== undefined ? asset.metadata.purchasePrice.toString() : ""
  );
  
  const addAsset = useMutation(api.assets.addAsset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const metadata = {
      description,
      purchaseDate: asset?.metadata?.purchaseDate || Date.now(),
      purchasePrice: purchasePrice ? Number(purchasePrice) : Number(value),
      lastUpdated: Date.now(),
      location: location || undefined,
      ticker: ticker || undefined
    };
    
    if (asset && onSubmit) {
      // Update existing asset
      await onSubmit({
        name,
        value: Number(value),
        type,
        metadata
      });
    } else {
      // Add new asset
      await addAsset({
        name,
        value: Number(value),
        type,
        metadata
      });
    }
    
    onClose();
  };

  return (
    <div>
      <h3 className="text-lg font-medium leading-6 mb-4">
        {asset ? "Edit Asset" : "Add New Asset"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Asset Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Asset Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="real_estate">Real Estate</option>
            <option value="stocks">Stocks</option>
            <option value="crypto">Crypto</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium">
            Value (USD)
          </label>
          <input
            type="number"
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            min="0"
            step="0.01"
          />
        </div>
        
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium">
            Purchase Price (USD)
          </label>
          <input
            type="number"
            id="purchasePrice"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="0"
            step="0.01"
          />
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="ticker" className="block text-sm font-medium">
            Ticker Symbol
          </label>
          <input
            type="text"
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {asset ? "Update Asset" : "Add Asset"}
          </button>
        </div>
      </form>
    </div>
  );
} 