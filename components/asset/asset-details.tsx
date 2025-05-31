'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Modal } from '@/components/modal';
import { AssetForm } from '@/components/forms/asset-form';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/formatters';

interface AssetDetailsProps {
  asset: Doc<"assets">;
}

export default function AssetDetails({ asset: initialAsset }: AssetDetailsProps) {
  const router = useRouter();
  const liveAsset =
    useQuery(api.assets.getAsset, { id: initialAsset._id }) ?? initialAsset;
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const updateAsset = useMutation(api.assets.updateAsset);
  const deleteAsset = useMutation(api.assets.deleteAsset);
  
  const handleUpdateAsset = async (updatedData: Partial<Doc<"assets">>) => {
    if (!liveAsset) return;

    await updateAsset({
      id: liveAsset._id,
      ...updatedData,
    });
    
    setShowEditForm(false);
  };
  
  const handleDeleteAsset = async () => {
    if (!liveAsset) return;
    
    setIsDeleting(true);
    try {
      await deleteAsset({ id: liveAsset._id });
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
  
  if (!liveAsset) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <Link href="/" className="mr-4 p-2 rounded-full hover:bg-gray-800">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{liveAsset.name}</h1>
      </div>
      
      <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">Asset Details</h2>
            <p className=" text-sm">Last updated: {formatDate(liveAsset.metadata?.lastUpdated)}</p>
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
              <h3 className="text-sm font-medium">Type</h3>
              <p className="text-lg capitalize">{liveAsset.type.replace('_', ' ')}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Value</h3>
              <p className="text-lg text-green-500">{formatCurrency(liveAsset.value)}</p>
            </div>
            
            {liveAsset.metadata?.purchasePrice !== undefined && (
              <div>
                <h3 className="text-sm font-medium">Purchase Price</h3>
                <p className="text-lg">{formatCurrency(liveAsset.metadata.purchasePrice)}</p>
              </div>
            )}
            
            {liveAsset.metadata?.location && (
              <div>
                <h3 className="text-sm font-medium">Location</h3>
                <p className="text-lg">{liveAsset.metadata.location}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {liveAsset.metadata?.ticker && (
              <div>
                <h3 className="text-sm font-medium">Ticker</h3>
                <p className="text-lg">{liveAsset.metadata.ticker}</p>
              </div>
            )}
            
            {liveAsset.metadata?.purchaseDate && (
              <div>
                <h3 className="text-sm font-medium">Purchase Date</h3>
                <p className="text-lg">{formatDate(liveAsset.metadata.purchaseDate)}</p>
              </div>
            )}
            
            {liveAsset.tags && liveAsset.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium">Tags</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {liveAsset.tags.map((tag, index) => (
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
        
        {liveAsset.metadata?.description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium">Description</h3>
            <p className="text-lg">{liveAsset.metadata.description}</p>
          </div>
        )}
      </div>
      
      {showEditForm && (
        <Modal onClose={() => setShowEditForm(false)}>
          <AssetForm
            asset={liveAsset}
            onClose={() => setShowEditForm(false)}
            onSubmit={handleUpdateAsset}
          />
        </Modal>
      )}
    </div>
  );
} 