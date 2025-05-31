import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface WalletFormProps {
  onClose: () => void;
}

export function WalletForm({ onClose }: WalletFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [chainType, setChainType] = useState<"ethereum" | "solana" | "bitcoin" | "virtual">("ethereum");
  const addWallet = useMutation(api.wallets.addWallet);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addWallet({
      name,
      address: chainType === "virtual" ? `virtual:${Date.now()}` : address,
      chainType
    });
    onClose();
  };

  return (
    <div>
      <h3 className="text-lg font-medium leading-6 mb-4">
        Add New Crypto Wallet
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Wallet Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            placeholder={chainType === "virtual" ? "My Coinbase Account" : "My Ethereum Wallet"}
          />
        </div>

        <div>
          <label htmlFor="chainType" className="block text-sm font-medium">
            Chain Type
          </label>
          <select
            id="chainType"
            value={chainType}
            onChange={(e) => setChainType(e.target.value as typeof chainType)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ethereum">Ethereum (EVM)</option>
            <option value="solana">Solana</option>
            <option value="bitcoin">Bitcoin</option>
            <option value="virtual">Virtual (Manual Entry)</option>
          </select>
          {chainType === "virtual" && (
            <p className="mt-1 text-xs">
              Virtual wallets are not scanned automatically. You'll need to manually add holdings.
            </p>
          )}
        </div>

        {chainType !== "virtual" && (
          <div>
            <label htmlFor="address" className="block text-sm font-medium">
              Wallet Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              placeholder={
                chainType === "ethereum" 
                  ? "0x..." 
                  : chainType === "solana" 
                    ? "..." 
                    : "bc1... or xpub..."
              }
            />
            <p className="mt-1 text-xs">
              {chainType === "ethereum" && "Enter a valid Ethereum address starting with 0x"}
              {chainType === "solana" && "Enter a valid Solana address"}
              {chainType === "bitcoin" && "Enter a Bitcoin address or xpub key"}
            </p>
          </div>
        )}

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
            Add Wallet
          </button>
        </div>
      </form>
    </div>
  );
} 