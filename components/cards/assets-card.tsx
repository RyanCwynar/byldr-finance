'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import { Modal } from "@/components/modal";
import { AssetForm } from "@/components/forms/asset-form";
import Link from "next/link";
import { formatNumber } from "@/lib/formatters";
import { useDictionary } from "@/components/TranslationsProvider";

type Asset = Doc<"assets">;

interface AssetsCardProps {
  assets: Asset[];
}

export default function AssetsCard({ assets: initialAssets }: AssetsCardProps) {
  const dict = useDictionary();
  const assets = useQuery(api.assets.listAssets) ?? initialAssets;
  const [showAddForm, setShowAddForm] = useState(false);

  // Sort assets by value in descending order
  const sortedAssets = useMemo(() => {
    if (!assets) return [];
    return [...assets].sort((a, b) => b.value - a.value);
  }, [assets]);

  const totalAssets = useMemo(() => {
    if (!assets) return 0;
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

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
      <h2 className="text-xl font-semibold mb-1">{dict.cards.assets.title}</h2>
      <span className="block text-green-500 font-mono mb-4">
        {`${dict.cards.assets.total}: $${formatNumber(totalAssets)}`}
      </span>
      <button
        onClick={() => setShowAddForm(true)}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
      
      <div className="space-y-3">
        {sortedAssets.length === 0 ? (
          <p className="text-gray-400 text-center py-4">{dict.cards.assets.empty}</p>
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
      
      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)}>
          <AssetForm onClose={() => setShowAddForm(false)} />
        </Modal>
      )}
    </div>
  );
} 