'use client';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Modal } from '@/components/modal';
import { TransactionForm } from './transaction-form';

type Recurring = Doc<'recurringTransactions'>;

interface RecurringPageClientProps {
  initialData: Recurring[];
}

export default function RecurringPageClient({ initialData }: RecurringPageClientProps) {
  const data = useQuery(api.recurring.listRecurringTransactions) ?? initialData;
  const remove = useMutation(api.recurring.deleteRecurringTransaction);
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id: Id<'recurringTransactions'>) => {
    await remove({ id });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Recurring Transactions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Add
        </button>
      </div>
      <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1 text-left">Amount</th>
            <th className="px-2 py-1 text-left">Type</th>
            <th className="px-2 py-1 text-left">Frequency</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((t) => (
            <tr key={t._id} className="border-t border-gray-700">
              <td className="px-2 py-1">{t.name}</td>
              <td className="px-2 py-1">${t.amount}</td>
              <td className="px-2 py-1">{t.type}</td>
              <td className="px-2 py-1">
                {t.frequency === 'monthly'
                  ? `Monthly on ${t.daysOfMonth?.join(', ')}`
                  : `Yearly on ${t.month}/${t.day}`}
              </td>
              <td className="px-2 py-1 text-right">
                <button
                  onClick={() => handleDelete(t._id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <TransactionForm onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
