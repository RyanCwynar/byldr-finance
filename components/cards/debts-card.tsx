'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import { Modal } from "@/components/modal";
import { DebtForm } from "@/components/forms/debt-form";
import Link from "next/link";
import { formatNumber } from "@/lib/formatters";
import { useDictionary } from "@/components/TranslationsProvider";

type Debt = Doc<"debts">;

interface DebtsCardProps {
  debts: Debt[];
}

export default function DebtsCard({ debts: initialDebts }: DebtsCardProps) {
  const dict = useDictionary();
  const debts = useQuery(api.debts.listDebts) ?? initialDebts;
  const [showAddForm, setShowAddForm] = useState(false);

  // Sort debts by value in descending order
  const sortedDebts = useMemo(() => {
    if (!debts) return [];
    return [...debts].sort((a, b) => b.value - a.value);
  }, [debts]);

  const totalDebts = useMemo(() => {
    if (!debts) return 0;
    return debts.reduce((sum, debt) => sum + debt.value, 0);
  }, [debts]);

  // Helper function to get icon based on debt type
  const getDebtTypeIcon = (type: string) => {
    switch (type) {
      case 'mortgage':
        return '🏠';
      case 'loan':
        return '💰';
      case 'credit_card':
        return '💳';
      case 'crypto':
        return '₿';
      default:
        return '📝';
    }
  };

  return (
    <div className="relative bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-1">{dict.cards.debts.title}</h2>
      <span className="block text-red-500 font-mono mb-4">
        {`${dict.cards.debts.total}: $${formatNumber(totalDebts)}`}
      </span>
      <button
        onClick={() => setShowAddForm(true)}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
      
      <div className="space-y-3">
        {sortedDebts.length === 0 ? (
          <p className="text-gray-400 text-center py-4">{dict.cards.debts.empty}</p>
        ) : (
          sortedDebts.map((debt: Debt) => (
            <Link 
              href={`/debt/${debt._id}`} 
              key={debt._id}
              className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <span className="mr-3 text-xl" aria-hidden="true">{getDebtTypeIcon(debt.type)}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{debt.name}</span>
                  <span className="text-xs text-gray-400 capitalize">{debt.type.replace('_', ' ')}</span>
                </div>
              </div>
              <span className="text-red-500 font-mono">
                ${formatNumber(debt.value)}
              </span>
            </Link>
          ))
        )}
      </div>
      
      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)}>
          <DebtForm onClose={() => setShowAddForm(false)} />
        </Modal>
      )}
    </div>
  );
} 