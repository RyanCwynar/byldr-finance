'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { AssetForm } from "@/components/forms/asset-form";

type Asset = Doc<"assets">;

interface AssetsCardProps {
  assets: Asset[];
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

export default function AssetsCard({ assets: initialAssets }: AssetsCardProps) {
  const assets = useQuery(api.assets.listAssets) ?? initialAssets;
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="relative bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4">Assets</h2>
      <AddButton onClick={() => setShowAddForm(true)} />
      
      <div className="space-y-3">
        {assets?.map((asset: Asset) => (
          <div key={asset._id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <div className="flex flex-col">
              <span className="font-medium">{asset.name}</span>
              <span className="text-xs text-gray-400">{asset.type}</span>
            </div>
            <span className="text-green-500">${asset.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
      
      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)}>
          <AssetForm onClose={() => setShowAddForm(false)} />
        </Modal>
      )}
    </div>
  );
} 