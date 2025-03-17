'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import { Modal } from "@/components/modal";
import { WalletForm } from "@/components/forms/wallet-form";
import Link from "next/link";
import { formatNumber } from "@/lib/formatters";

type Wallet = Doc<"wallets">;

interface CryptoWalletsCardProps {
  wallets: Wallet[];
}

export const AddButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <PlusIcon className="w-5 h-5" />
    </button>
  );
};

export default function CryptoWalletsCard({ wallets: initialWallets }: CryptoWalletsCardProps) {
  const wallets = useQuery(api.wallets.listWallets) ?? initialWallets;
  const [showAddForm, setShowAddForm] = useState(false);

  // Sort wallets by value in descending order
  const sortedWallets = useMemo(() => {
    if (!wallets) return [];
    return [...wallets].sort((a, b) => {
      // Use 0 as default value if wallet.value is undefined
      const valueA = a.value || 0;
      const valueB = b.value || 0;
      return valueB - valueA; // Descending order
    });
  }, [wallets]);

  return (
    <div className="relative bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4">Wallets</h2>
      <AddButton onClick={() => setShowAddForm(true)} />
      
      <div className="space-y-3">
        {sortedWallets.map((wallet: Wallet) => (
          <Link 
            href={`/wallet/${wallet._id}`} 
            key={wallet._id}
            className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{wallet.name}</span>
              <span className="text-xs text-gray-400">{wallet.chainType}</span>
            </div>
            <span className={`${wallet.value && wallet.value > 0 ? 'text-green-500' : 'text-gray-400'} font-mono`}>
              ${formatNumber(wallet.value || 0)}
            </span>
          </Link>
        ))}
      </div>
      
      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)}>
          <WalletForm onClose={() => setShowAddForm(false)} />
        </Modal>
      )}
    </div>
  );
} 