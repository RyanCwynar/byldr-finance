'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Modal } from '@/components/modal';
import { AssetForm } from '@/components/forms/asset-form';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AssetDetailsProps {
  asset: Doc<"assets">;
}

export default function AssetDetails({ asset }: AssetDetailsProps) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const updateAsset = useMutation(api.assets.updateAsset);
  const deleteAsset = useMutation(api.assets.deleteAsset);
  
  const handleUpdateAsset = async (updatedData: Partial<Doc<"assets">>) => {
    if (!asset) return;
    
    await updateAsset({
      id: asset._id,
      ...updatedData,
    });
    
    setShowEditForm(false);
  };
  
  const handleDeleteAsset = async () => {
    if (!asset) return;
    
    setIsDeleting(true);
    try {
      await deleteAsset({ id: asset._id });
      router.push('/');
    } catch (error) {
      console.error('Failed to delete asset:', error);
      setIsDeleting(false);
    }
  };
  
  // Format date from timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };
  
  if (!asset) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <Link href="/" className="mr-4 p-2 rounded-full hover:bg-gray-800">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{asset.name}</h1>
      </div>
      
      <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">Asset Details</h2>
            <p className="text-gray-400 text-sm">Last updated: {formatDate(asset.metadata?.lastUpdated)}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowEditForm(true)}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDeleteAsset}
              disabled={isDeleting}
              className="p-2 rounded-full hover:bg-gray-800 text-red-500"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Type</h3>
              <p className="text-lg capitalize">{asset.type.replace('_', ' ')}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400">Value</h3>
              <p className="text-lg text-green-500">${asset.value.toLocaleString()}</p>
            </div>
            
            {asset.metadata?.purchasePrice !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Purchase Price</h3>
                <p className="text-lg">${asset.metadata.purchasePrice.toLocaleString()}</p>
              </div>
            )}
            
            {asset.metadata?.location && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Location</h3>
                <p className="text-lg">{asset.metadata.location}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {asset.metadata?.ticker && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Ticker</h3>
                <p className="text-lg">{asset.metadata.ticker}</p>
              </div>
            )}
            
            {asset.metadata?.purchaseDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Purchase Date</h3>
                <p className="text-lg">{formatDate(asset.metadata.purchaseDate)}</p>
              </div>
            )}
            
            {asset.tags && asset.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Tags</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {asset.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {asset.metadata?.description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-400">Description</h3>
            <p className="text-lg">{asset.metadata.description}</p>
          </div>
        )}
      </div>
      
      {showEditForm && (
        <Modal onClose={() => setShowEditForm(false)}>
          <AssetForm 
            asset={asset} 
            onClose={() => setShowEditForm(false)} 
            onSubmit={handleUpdateAsset} 
          />
        </Modal>
      )}
    </div>
  );
} 