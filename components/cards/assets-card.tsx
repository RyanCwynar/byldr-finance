'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import { Modal } from "@/components/modal";
import { AssetForm } from "@/components/forms/asset-form";
import { WalletForm } from "@/components/forms/wallet-form";
import Link from "next/link";
import { formatNumber } from "@/lib/formatters";

type Asset = Doc<"assets">;
type Wallet = Doc<"wallets">;

interface AssetsCardProps {
  assets: Asset[];
  wallets: Wallet[];
}

export default function AssetsCard({ assets: initialAssets, wallets: initialWallets }: AssetsCardProps) {
  const assets = useQuery(api.assets.listAssets) ?? initialAssets;
  const wallets = useQuery(api.wallets.listWallets) ?? initialWallets;
  const [showAddAssetForm, setShowAddAssetForm] = useState(false);
  const [showAddWalletForm, setShowAddWalletForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateAllWallets = useMutation(api.wallets.updateAllWalletValues);

  // Sort assets by value in descending order
  const sortedAssets = useMemo(() => {
    if (!assets) return [];
    return [...assets].sort((a, b) => b.value - a.value);
  }, [assets]);

  const totalAssets = useMemo(() => {
    if (!assets) return 0;
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

  const sortedWallets = useMemo(() => {
    if (!wallets) return [];
    return [...wallets].sort((a, b) => {
      const valueA = a.value || 0;
      const valueB = b.value || 0;
      return valueB - valueA;
    });
  }, [wallets]);

  const totalWallets = useMemo(() => {
    if (!wallets) return 0;
    return wallets.reduce((sum, wallet) => sum + (wallet.value || 0), 0);
  }, [wallets]);

  const total = totalAssets + totalWallets;

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

  // Helper function to get icon based on asset type
  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'real_estate':
        return '🏠';
      case 'vehicle':
        return '🚗';
      case 'investment':
        return '📈';
      case 'cash':
        return '💵';
      case 'crypto':
        return '₿';
      default:
        return '💰';
    }
  };

  return (
    <div className="relative bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-1">Assets</h2>
      <span className="block text-green-500 font-mono mb-4">
        {`Total: $${formatNumber(total)}`}
      </span>

      <div className="space-y-6">
        <div className="relative">
          <h3 className="text-lg font-medium mb-2">Wallets</h3>
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={() => setShowAddWalletForm(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleUpdateWallets}
              disabled={isUpdating}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Update wallet values"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 mt-6">
            {sortedWallets.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No wallets found. Add one to get started.</p>
            ) : (
              sortedWallets.map((wallet: Wallet) => (
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
              ))
            )}
          </div>
          <div className="mt-2 text-right font-mono text-green-500">
            {`Total: $${formatNumber(totalWallets)}`}
          </div>
        </div>

        <div className="relative">
          <h3 className="text-lg font-medium mb-2">Manual Assets</h3>
          <button
            onClick={() => setShowAddAssetForm(true)}
            className="absolute top-0 right-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <PlusIcon className="w-5 h-5" />
          </button>

          <div className="space-y-3 mt-6">
            {sortedAssets.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No assets found. Add one to get started.</p>
            ) : (
              sortedAssets.map((asset: Asset) => (
                <Link
                  href={`/asset/${asset._id}`}
                  key={asset._id}
                  className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-xl" aria-hidden="true">{getAssetTypeIcon(asset.type)}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{asset.name}</span>
                      <span className="text-xs text-gray-400 capitalize">{asset.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <span className="text-green-500 font-mono">
                    ${formatNumber(asset.value)}
                  </span>
                </Link>
              ))
            )}
          </div>
          <div className="mt-2 text-right font-mono text-green-500">
            {`Total: $${formatNumber(totalAssets)}`}
          </div>
        </div>
      </div>

      {showAddWalletForm && (
        <Modal onClose={() => setShowAddWalletForm(false)}>
          <WalletForm onClose={() => setShowAddWalletForm(false)} />
        </Modal>
      )}

      {showAddAssetForm && (
        <Modal onClose={() => setShowAddAssetForm(false)}>
          <AssetForm onClose={() => setShowAddAssetForm(false)} />
        </Modal>
      )}
    </div>
  );
} 