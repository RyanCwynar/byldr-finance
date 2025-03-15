import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AssetFormProps {
  onClose: () => void;
}

export function AssetForm({ onClose }: AssetFormProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<"real_estate" | "crypto" | "stocks" | "cash" | "other">("other");
  const addAsset = useMutation(api.assets.addAsset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAsset({
      name,
      value: Number(value),
      type,
      metadata: {
        lastUpdated: Date.now(),
        description: "",
        purchaseDate: Date.now(),
        purchasePrice: Number(value)
      }
    });
    onClose();
  };

  return (
    <div>
      <h3 className="text-lg font-medium leading-6 text-gray-100 mb-4">
        Add New Asset
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">
            Asset Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-300">
            Asset Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="real_estate">Real Estate</option>
            <option value="stocks">Stocks</option>
            <option value="crypto">Crypto</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-300">
            Value (USD)
          </label>
          <input
            type="number"
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            min="0"
            step="0.01"
          />
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
            Add Asset
          </button>
        </div>
      </form>
    </div>
  );
} 