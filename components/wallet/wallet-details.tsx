'use client';

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/modal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HoldingForm from "./holding-form";

type Wallet = Doc<"wallets">;
type Holding = Doc<"holdings">;

interface WalletDetailsProps {
  wallet: Wallet;
  holdings: Holding[];
}

export default function WalletDetails({ wallet, holdings: initialHoldings }: WalletDetailsProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddHoldingModalOpen, setIsAddHoldingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditHoldingModalOpen, setIsEditHoldingModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [editedName, setEditedName] = useState(wallet.name);
  const [showIgnoredHoldings, setShowIgnoredHoldings] = useState(false);
  
  // Use the preloaded holdings as initial data, but keep it updated with real-time changes
  const liveHoldings = useQuery(api.holdings.getHoldingsByWallet, { walletId: wallet._id }) ?? initialHoldings;
  
  // Separate active and ignored holdings
  const activeHoldings = liveHoldings.filter(holding => !holding.ignore);
  const ignoredHoldings = liveHoldings.filter(holding => holding.ignore);
  
  const updateWallet = useMutation(api.wallets.updateWallet);
  const deleteWallet = useMutation(api.wallets.deleteWallet);
  
  const handleUpdateWallet = async () => {
    await updateWallet({
      id: wallet._id,
      name: editedName
    });
    setIsEditModalOpen(false);
  };
  
  const handleDeleteWallet = async () => {
    await deleteWallet({ id: wallet._id });
    router.push('/');
  };
  
  const handleEditHolding = (holding: Holding) => {
    setSelectedHolding(holding);
    setIsEditHoldingModalOpen(true);
  };
  
  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{wallet.name}</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-md bg-red-800 hover:bg-red-700 text-gray-200"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="ml-2">{wallet.name}</span>
            </div>
            <div>
              <span className="text-gray-400">Chain Type:</span>
              <span className="ml-2">{wallet.chainType}</span>
            </div>
            <div>
              <span className="text-gray-400">Address:</span>
              <span className="ml-2 break-all">{wallet.address}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Value:</span>
              <span className="ml-2">${(wallet.value || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Assets:</span>
              <span className="ml-2 text-green-500">${(wallet.assets || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Debts:</span>
              <span className="ml-2 text-red-500">${(wallet.debts || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Last Updated:</span>
              <span className="ml-2">
                {wallet.metadata?.lastUpdated 
                  ? new Date(wallet.metadata.lastUpdated).toLocaleString() 
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Holdings</h2>
            <button 
              onClick={() => setIsAddHoldingModalOpen(true)}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          
          {activeHoldings.length === 0 && ignoredHoldings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No holdings found for this wallet.</p>
          ) : (
            <div className="space-y-4">
              {/* Active Holdings */}
              {activeHoldings.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No active holdings found.</p>
              ) : (
                <div className="space-y-3">
                  {activeHoldings.map(holding => (
                    <div 
                      key={holding._id} 
                      className="flex justify-between items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleEditHolding(holding)}
                    >
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-xs text-gray-400">{holding.chain}</div>
                      </div>
                      <div className="text-right">
                        <div className={holding.isDebt ? "text-red-500" : "text-green-500"}>
                          {holding.isDebt ? "-" : ""}{holding.quantity.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {holding.isDebt ? "Debt" : "Asset"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Ignored Holdings (Collapsible) */}
              {ignoredHoldings.length > 0 && (
                <div className="mt-6 border-t border-gray-700 pt-4">
                  <button 
                    onClick={() => setShowIgnoredHoldings(!showIgnoredHoldings)}
                    className="flex items-center justify-between w-full text-left text-gray-300 hover:text-white py-2"
                  >
                    <span className="flex items-center">
                      {showIgnoredHoldings ? 
                        <ChevronDownIcon className="w-4 h-4 mr-2" /> : 
                        <ChevronRightIcon className="w-4 h-4 mr-2" />
                      }
                      Ignored Holdings ({ignoredHoldings.length})
                    </span>
                  </button>
                  
                  {showIgnoredHoldings && (
                    <div className="space-y-3 mt-3 pl-2 border-l-2 border-gray-700">
                      {ignoredHoldings.map(holding => (
                        <div 
                          key={holding._id} 
                          className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                          onClick={() => handleEditHolding(holding)}
                        >
                          <div>
                            <div className="font-medium text-gray-400">{holding.symbol}</div>
                            <div className="text-xs text-gray-500">{holding.chain}</div>
                          </div>
                          <div className="text-right">
                            <div className={`${holding.isDebt ? "text-red-500/70" : "text-green-500/70"}`}>
                              {holding.isDebt ? "-" : ""}{holding.quantity.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center justify-end gap-2">
                              {holding.isDebt ? "Debt" : "Asset"}
                              <span className="px-1.5 py-0.5 bg-yellow-800/50 text-yellow-200/70 rounded-full text-[10px]">Ignored</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Wallet Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-100 mb-4">
            Edit Wallet
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Wallet Name
              </label>
              <input
                type="text"
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateWallet}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Update Wallet
              </button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Delete Wallet Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-100 mb-4">
            Delete Wallet
          </h3>
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete this wallet? This action cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteWallet}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete Wallet
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Add Holding Modal */}
      <Modal isOpen={isAddHoldingModalOpen} onClose={() => setIsAddHoldingModalOpen(false)}>
        <HoldingForm 
          walletId={wallet._id} 
          onClose={() => setIsAddHoldingModalOpen(false)} 
        />
      </Modal>
      
      {/* Edit Holding Modal */}
      <Modal isOpen={isEditHoldingModalOpen} onClose={() => setIsEditHoldingModalOpen(false)}>
        {selectedHolding && (
          <HoldingForm 
            walletId={wallet._id} 
            onClose={() => setIsEditHoldingModalOpen(false)} 
            holding={selectedHolding}
          />
        )}
      </Modal>
    </div>
  );
} 