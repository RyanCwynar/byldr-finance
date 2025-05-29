'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import { Modal } from "@/components/modal";
import { WalletForm } from "@/components/forms/wallet-form";
import Link from "next/link";
import { formatNumber } from "@/lib/formatters";
import { useDictionary } from "@/components/TranslationsProvider";

type Wallet = Doc<"wallets">;

interface CryptoWalletsCardProps {
  wallets: Wallet[];
}

export const AddButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-12 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <PlusIcon className="w-5 h-5" />
    </button>
  );
};

export const UpdateButton = ({ onClick, isUpdating }: { onClick: () => void, isUpdating: boolean }) => {
  return (
    <button
      onClick={onClick}
      disabled={isUpdating}
      className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      title="Update wallet values"
    >
      <ArrowPathIcon className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
    </button>
  );
};

export default function CryptoWalletsCard({ wallets: initialWallets }: CryptoWalletsCardProps) {
  const dict = useDictionary();
  const wallets = useQuery(api.wallets.listWallets) ?? initialWallets;
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateAllWallets = useMutation(api.wallets.updateAllWalletValues);

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

  const totalWallets = useMemo(() => {
    if (!wallets) return 0;
    return wallets.reduce((sum, wallet) => sum + (wallet.value || 0), 0);
  }, [wallets]);

  const handleUpdateWallets = async () => {
    try {
      setIsUpdating(true);
      await updateAllWallets();
    } catch (error) {
      console.error('Error updating wallets:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-1">{dict.cards.wallets.title}</h2>
      <span className="block text-green-500 font-mono mb-4">
        {`${dict.cards.wallets.total}: $${formatNumber(totalWallets)}`}
      </span>
      <AddButton onClick={() => setShowAddForm(true)} />
      <UpdateButton onClick={handleUpdateWallets} isUpdating={isUpdating} />
      
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