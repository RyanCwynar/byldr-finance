'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { AssetForm } from "@/components/forms/asset-form";
import Link from "next/link";

type Asset = Doc<"assets">;

interface AssetsCardProps {
  assets: Asset[];
}

export default function AssetsCard({ assets: initialAssets }: AssetsCardProps) {
  const assets = useQuery(api.assets.listAssets) ?? initialAssets;
  const [showAddForm, setShowAddForm] = useState(false);

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
      <h2 className="text-xl font-semibold mb-4">Assets</h2>
      <button
        onClick={() => setShowAddForm(true)}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
      
      <div className="space-y-3">
        {assets?.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No assets found. Add one to get started.</p>
        ) : (
          assets?.map((asset: Asset) => (
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
              <span className="text-green-500">
                ${asset.value.toLocaleString()}
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