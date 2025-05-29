'use client';
import { useState, useMemo } from 'react';
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
  const [editing, setEditing] = useState<Recurring | null>(null);
  const totals = useMemo(() => {
    return data.reduce(
      (acc, t) => {
        const monthly =
          t.frequency === 'monthly'
            ? t.amount * (t.daysOfMonth ? t.daysOfMonth.length : 1)
            : t.amount / 12;
        if (t.type === 'income') acc.income += monthly;
        else acc.expense += monthly;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [data]);

  const handleDelete = async (id: Id<'recurringTransactions'>) => {
    await remove({ id });
  };

  const handleEdit = (item: Recurring) => {
    setEditing(item);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recurring Transactions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Add
        </button>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1 text-left">Amount</th>
            <th className="px-2 py-1 text-left">Type</th>
            <th className="px-2 py-1 text-left">Frequency</th>
            <th className="px-2 py-1 text-right">Actions</th>
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
              <td className="px-2 py-1 text-right space-x-2">
                <button
                  onClick={() => handleEdit(t)}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </button>
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
      <div className="flex justify-end gap-6 text-sm mt-2">
        <div>
          Total Income: <span className="text-green-500">${totals.income.toFixed(2)}</span>
        </div>
        <div>
          Total Expenses: <span className="text-red-500">${totals.expense.toFixed(2)}</span>
        </div>
      </div>
      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditing(null); }}>
          <TransactionForm
            onClose={() => { setShowForm(false); setEditing(null); }}
            transaction={editing || undefined}
          />
        </Modal>
      )}
    </div>
  );
}
