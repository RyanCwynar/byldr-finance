'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Modal } from '@/components/modal';
import { TransactionForm } from './transaction-form';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

type OneTime = Doc<'oneTimeTransactions'>;

interface OneTimePageClientProps {
  initialData: OneTime[];
  initialTags: string[];
}

export default function OneTimePageClient({ initialData, initialTags }: OneTimePageClientProps) {
  const data = useQuery(api.oneTime.listOneTimeTransactions) ?? initialData;
  const allTags = useQuery(api.oneTime.listOneTimeTags) ?? initialTags;
  const remove = useMutation(api.oneTime.deleteOneTimeTransaction);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OneTime | null>(null);
  const [sortField, setSortField] = useState<'amount' | 'date' | 'type' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [tagFilter, setTagFilter] = useState('');

  const filteredData = useMemo(() => {
    const tags = tagFilter
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) return data;
    return data.filter((t) => tags.every((tag) => t.tags?.includes(tag)));
  }, [data, tagFilter]);

  const visibleData = useMemo(() => {
    return filteredData.filter((t) => !t.hidden);
  }, [filteredData]);

  const sortedData = useMemo(() => {
    const arr = [...filteredData];
    if (sortField === 'amount') {
      arr.sort((a, b) => (sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount));
    } else if (sortField === 'date') {
      arr.sort((a, b) => (sortDir === 'asc' ? a.date - b.date : b.date - a.date));
    } else if (sortField === 'type') {
      arr.sort((a, b) => {
        if (a.type === b.type) return 0;
        if (sortDir === 'asc') return a.type === 'income' ? -1 : 1;
        return a.type === 'income' ? 1 : -1;
      });
    } else {
      arr.sort((a, b) => b.date - a.date);
    }
    return arr;
  }, [filteredData, sortField, sortDir]);

  const totals = useMemo(() => {
    const result = visibleData.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
    return {
      ...result,
      net: result.income - result.expense,
    };
  }, [visibleData]);

  const toggleSort = (field: 'amount' | 'date' | 'type') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id: Id<'oneTimeTransactions'>) => {
    await remove({ id });
  };

  const handleEdit = (item: OneTime) => {
    setEditing(item);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto relative">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">One Time Transactions</h1>
        <div className="flex items-center gap-2">
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            list="one-time-tag-filter"
            placeholder="Filter tags"
            className="px-2 py-1 rounded-md border border-gray-600 bg-gray-800"
          />
          <datalist id="one-time-tag-filter">
            {allTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <button
            onClick={() => setShowForm(true)}
            className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-md bg-blue-600 text-white"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add</span>
          </button>
        </div>
      </div>
      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {sortedData.map((t) => (
          <div key={t._id} className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t.name}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(t)}
                  className="p-1 rounded hover:bg-gray-700"
                >
                  <PencilIcon className="w-5 h-5 text-blue-400" />
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="p-1 rounded hover:bg-gray-700"
                >
                  <TrashIcon className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-mono">${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span>{new Date(t.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span>{t.type === 'income' ? 'Income' : 'Expense'}</span>
              </div>
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
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
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
              <th
                className="px-2 py-1 text-left cursor-pointer"
                onClick={() => toggleSort('date')}
              >
                Date
              </th>
              <th
                className="px-2 py-1 text-left cursor-pointer"
                onClick={() => toggleSort('type')}
              >
                Type
              </th>
              <th className="px-2 py-1 text-left">Tags</th>
              <th className="px-2 py-1 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((t) => (
              <tr key={t._id} className="border-t border-gray-700">
                <td className="px-2 py-1">{t.name}</td>
                <td className="px-2 py-1">${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-2 py-1">{new Date(t.date).toLocaleDateString()}</td>
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
                    className="p-1 rounded hover:bg-gray-700"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-1 rounded hover:bg-gray-700"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5 text-red-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col items-end gap-1 text-sm mt-2">
          <div>
            Total Income: <span className="text-green-500">${totals.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div>
            Total Expenses: <span className="text-red-500">${totals.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div>
            Net: <span className={totals.net >= 0 ? 'text-green-500' : 'text-red-500'}>${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => setShowForm(true)}
        className="sm:hidden fixed bottom-4 right-4 p-4 rounded-full bg-blue-600 text-white shadow-lg"
        aria-label="Add one time transaction"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
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
