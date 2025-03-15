'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { DebtForm } from "@/components/forms/debt-form";

type Debt = Doc<"debts">;

interface DebtsCardProps {
  preloadedDebts?: Debt[];
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

export default function DebtsCard({ preloadedDebts }: DebtsCardProps) {
  const debts = useQuery(api.debts.listDebts) ?? preloadedDebts;
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="relative bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4">Debts</h2>
      <AddButton onClick={() => setShowAddForm(true)} />
      
      <div className="space-y-3">
        {debts?.map((debt: Debt) => (
          <div key={debt._id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <div className="flex flex-col">
              <span className="font-medium">{debt.name}</span>
              {debt.metadata?.lender && (
                <span className="text-xs text-gray-400">{debt.metadata.lender}</span>
              )}
            </div>
            <span className="text-red-500">-${debt.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
      
      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)}>
          <DebtForm onClose={() => setShowAddForm(false)} />
        </Modal>
      )}
    </div>
  );
} 