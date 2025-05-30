'use client';

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/modal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DebtForm } from '@/components/forms/debt-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/formatters';
import DebtHistoryChart from './debt-history-chart';
import DebtHistoryList, { DebtHistoryEntry } from './debt-history-list';
import DebtHistoryForm from './debt-history-form';
import DebtHistoryEditForm from './debt-history-edit-form';

type Debt = Doc<"debts">;

interface DebtDetailsProps {
  debt: Debt;
}

export default function DebtDetails({ debt: initialDebt }: DebtDetailsProps) {
  const router = useRouter();
  const liveDebt =
    useQuery(api.debts.getDebt, { id: initialDebt._id }) ?? initialDebt;
  const history = useQuery(api.debts.getDebtHistory, { debtId: initialDebt._id }) ?? [];
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddHistoryForm, setShowAddHistoryForm] = useState(false);
  const [editHistoryEntry, setEditHistoryEntry] = useState<DebtHistoryEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const updateDebt = useMutation(api.debts.updateDebt);
  const deleteDebt = useMutation(api.debts.deleteDebt);
  
  const handleUpdateDebt = async (updatedData: Partial<Doc<"debts">>) => {
    if (!liveDebt) return;
    
    await updateDebt({
      id: liveDebt._id,
      ...updatedData,
    });
    
    setShowEditForm(false);
  };
  
  const handleDeleteDebt = async () => {
    if (!liveDebt) return;
    
    setIsDeleting(true);
    try {
      await deleteDebt({ id: liveDebt._id });
      router.push('/');
    } catch (error) {
      console.error('Failed to delete debt:', error);
      setIsDeleting(false);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };
  
  if (!liveDebt) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <Link href="/" className="mr-4 p-2 rounded-full hover:bg-gray-800">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{liveDebt.name}</h1>
      </div>
      
      <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">Debt Details</h2>
            <p className="text-gray-400 text-sm">Last updated: {formatDate(liveDebt.metadata?.lastUpdated)}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowEditForm(true)}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDeleteDebt}
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
              <p className="text-lg capitalize">{liveDebt.type.replace('_', ' ')}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400">Value</h3>
              <p className="text-lg text-red-500">{formatCurrency(liveDebt.value)}</p>
            </div>
            
            {liveDebt.metadata?.originalAmount && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Original Amount</h3>
                <p className="text-lg">{formatCurrency(liveDebt.metadata.originalAmount)}</p>
              </div>
            )}
            
            {liveDebt.metadata?.lender && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Lender</h3>
                <p className="text-lg">{liveDebt.metadata.lender}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {liveDebt.metadata?.interestRate !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Interest Rate</h3>
                <p className="text-lg">{liveDebt.metadata.interestRate}%</p>
              </div>
            )}
            
            {liveDebt.metadata?.startDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Start Date</h3>
                <p className="text-lg">{formatDate(liveDebt.metadata.startDate)}</p>
              </div>
            )}
            
            {liveDebt.metadata?.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Due Date</h3>
                <p className="text-lg">{formatDate(liveDebt.metadata.dueDate)}</p>
              </div>
            )}
            
            {liveDebt.metadata?.minimumPayment !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Minimum Payment</h3>
                <p className="text-lg">{formatCurrency(liveDebt.metadata.minimumPayment)}</p>
              </div>
            )}
          </div>
        </div>
        
        {liveDebt.metadata?.description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-400">Description</h3>
            <p className="text-lg">{liveDebt.metadata.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Value History</h2>
          <button
            onClick={() => setShowAddHistoryForm(true)}
            className="p-2 rounded-full hover:bg-gray-800"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <DebtHistoryChart history={history} />
        <DebtHistoryList history={history} onEdit={(entry) => setEditHistoryEntry(entry)} />
      </div>

      {showAddHistoryForm && (
        <Modal onClose={() => setShowAddHistoryForm(false)}>
          <DebtHistoryForm
            debtId={liveDebt._id}
            onClose={() => setShowAddHistoryForm(false)}
          />
        </Modal>
      )}
      
      {showEditForm && (
        <Modal onClose={() => setShowEditForm(false)}>
          <DebtForm
            debt={liveDebt}
            onClose={() => setShowEditForm(false)}
            onSubmit={handleUpdateDebt}
          />
        </Modal>
      )}

      {editHistoryEntry && (
        <Modal onClose={() => setEditHistoryEntry(null)}>
          <DebtHistoryEditForm
            entry={editHistoryEntry}
            onClose={() => setEditHistoryEntry(null)}
          />
        </Modal>
      )}
    </div>
  );
} 