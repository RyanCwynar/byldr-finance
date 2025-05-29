'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Modal } from '@/components/modal';
import { TransactionForm } from './transaction-form';
import { monthlyAmount } from '@/lib/recurring';

type Recurring = Doc<'recurringTransactions'>;

interface RecurringPageClientProps {
  initialData: Recurring[];
}

export default function RecurringPageClient({ initialData }: RecurringPageClientProps) {
  const data = useQuery(api.recurring.listRecurringTransactions) ?? initialData;
  const remove = useMutation(api.recurring.deleteRecurringTransaction);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [sortField, setSortField] = useState<'amount' | 'type' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const sortedData = useMemo(() => {
    const arr = [...data];
    if (sortField === 'amount') {
      arr.sort((a, b) =>
        sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount,
      );
    } else if (sortField === 'type') {
      arr.sort((a, b) => {
        if (a.type === b.type) return 0;
        if (sortDir === 'asc') return a.type === 'income' ? -1 : 1;
        return a.type === 'income' ? 1 : -1;
      });
    } else {
      arr.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'income' ? -1 : 1;
        }
        return b.amount - a.amount;
      });
    }
    return arr;
  }, [data, sortField, sortDir]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, t) => {
        const monthly = monthlyAmount(t);
        if (t.type === 'income') acc.income += monthly;
        else acc.expense += monthly;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [data]);

  const toggleSort = (field: 'amount' | 'type') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

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
            <th
              className="px-2 py-1 text-left cursor-pointer"
              onClick={() => toggleSort('amount')}
            >
              Amount
            </th>
            <th className="px-2 py-1 text-left">Monthly Total</th>
            <th
              className="px-2 py-1 text-left cursor-pointer"
              onClick={() => toggleSort('type')}
            >
              Type
            </th>
            <th className="px-2 py-1 text-left">Frequency</th>
            <th className="px-2 py-1 text-left">Tags</th>
            <th className="px-2 py-1 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((t) => (
            <tr key={t._id} className="border-t border-gray-700">
              <td className="px-2 py-1">{t.name}</td>
              <td className="px-2 py-1">${t.amount}</td>
              <td className="px-2 py-1">${monthlyAmount(t)}</td>
              <td className="px-2 py-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    t.type === 'income'
                      ? 'bg-green-700 text-green-200'
                      : 'bg-red-700 text-red-200'
                  }`}
                >
                  {t.type === 'income' ? 'Income' : 'Expense'}
                </span>
              </td>
              <td className="px-2 py-1">
                {t.frequency === 'monthly'
                  ? `Monthly on ${t.daysOfMonth?.join(', ')}`
                  : `Yearly on ${t.month}/${t.day}`}
              </td>
              <td className="px-2 py-1">
                {t.tags && t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
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
