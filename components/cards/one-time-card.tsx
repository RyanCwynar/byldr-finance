'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { Modal } from '@/components/modal';
import { TransactionForm } from '@/components/oneTime/transaction-form';
import { formatNumber } from '@/lib/formatters';

type OneTime = Doc<'oneTimeTransactions'>;

interface OneTimeCardProps {
  items: OneTime[];
}

export default function OneTimeCard({ items: initialItems }: OneTimeCardProps) {
  const items = useQuery(api.oneTime.listOneTimeTransactions) ?? initialItems;
  const [showAddForm, setShowAddForm] = useState(false);

  const currentYear = new Date().getFullYear();

  const total = useMemo(() => {
    if (!items) return 0;
    return items
      .filter(
        (i) =>
          !i.hidden &&
          new Date(i.date).getFullYear() === currentYear &&
          i.type === 'expense'
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [items, currentYear]);

  const sorted = useMemo(() => {
    if (!items) return [];
    return [...items]
      .filter((i) => new Date(i.date).getFullYear() === currentYear && !i.hidden)
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
  }, [items, currentYear]);

  return (
    <div className="relative bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-1">One Time Expenses ({currentYear})</h2>
      <span className="block text-red-500 font-mono mb-4">
        {`Total: $${formatNumber(total)}`}
      </span>
      <button
        onClick={() => setShowAddForm(true)}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <PlusIcon className="w-5 h-5" />
      </button>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No expenses added.</p>
        ) : (
          sorted.map((t) => (
            <div key={t._id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span>{t.name}</span>
              <span className="font-mono">${formatNumber(t.amount)}</span>
            </div>
          ))
        )}
      </div>

      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)}>
          <TransactionForm onClose={() => setShowAddForm(false)} />
        </Modal>
      )}
    </div>
  );
}
