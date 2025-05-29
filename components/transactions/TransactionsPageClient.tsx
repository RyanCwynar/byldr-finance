'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { monthlyAmount } from '@/lib/recurring';
import { formatCurrency } from '@/lib/formatters';
import { Modal } from '@/components/modal';
import { TransactionForm as RecurringForm } from '@/components/recurring/transaction-form';
import { TransactionForm as OneTimeForm } from '@/components/oneTime/transaction-form';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Props {
  initialRecurring: Doc<'recurringTransactions'>[];
  initialRecurringTags: string[];
  initialOneTime: Doc<'oneTimeTransactions'>[];
  initialOneTimeTags: string[];
}

type Recurring = Doc<'recurringTransactions'> & { kind: 'recurring' };
type OneTime = Doc<'oneTimeTransactions'> & { kind: 'one-time' };
type Item = Recurring | OneTime;

export default function TransactionsPageClient({
  initialRecurring,
  initialRecurringTags,
  initialOneTime,
  initialOneTimeTags,
}: Props) {
  const recurring =
    useQuery(api.recurring.listRecurringTransactions) ?? initialRecurring;
  const recurringTags =
    useQuery(api.recurring.listRecurringTags) ?? initialRecurringTags;
  const oneTime = useQuery(api.oneTime.listOneTimeTransactions) ?? initialOneTime;
  const oneTimeTags = useQuery(api.oneTime.listOneTimeTags) ?? initialOneTimeTags;

  const removeRecurring = useMutation(api.recurring.deleteRecurringTransaction);
  const removeOneTime = useMutation(api.oneTime.deleteOneTimeTransaction);

  const [view, setView] = useState<'all' | 'recurring' | 'one-time'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showOneTimeForm, setShowOneTimeForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<Recurring | null>(null);
  const [editingOneTime, setEditingOneTime] = useState<OneTime | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set([...recurringTags, ...oneTimeTags])),
    [recurringTags, oneTimeTags],
  );

  const tagList = useMemo(
    () =>
      tagFilter
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagFilter],
  );

  const filteredRecurring = useMemo(() => {
    if (tagList.length === 0) return recurring;
    return recurring.filter((t) => tagList.every((tag) => t.tags?.includes(tag)));
  }, [recurring, tagList]);

  const filteredOneTime = useMemo(() => {
    if (tagList.length === 0) return oneTime;
    return oneTime.filter((t) => tagList.every((tag) => t.tags?.includes(tag)));
  }, [oneTime, tagList]);

  const combined = useMemo<Item[]>(() => {
    const recItems: Recurring[] = filteredRecurring.map((r) => ({ ...r, kind: 'recurring' }));
    const oneItems: OneTime[] = filteredOneTime.map((o) => ({ ...o, kind: 'one-time' }));
    let arr: Item[] = [...recItems, ...oneItems];
    if (view === 'recurring') arr = arr.filter((i) => i.kind === 'recurring');
    else if (view === 'one-time') arr = arr.filter((i) => i.kind === 'one-time');
    arr.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
      const amta = a.kind === 'recurring' ? monthlyAmount(a) : a.amount;
      const amtb = b.kind === 'recurring' ? monthlyAmount(b) : b.amount;
      return amtb - amta;
    });
    return arr;
  }, [filteredRecurring, filteredOneTime, view]);

  const totals = useMemo(() => {
    return combined.reduce(
      (acc, t) => {
        const amt = t.kind === 'recurring' ? monthlyAmount(t) : t.amount;
        if (t.type === 'income') acc.income += amt;
        else acc.expense += amt;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [combined]);

  const handleDelete = async (item: Item) => {
    if (item.kind === 'recurring') await removeRecurring({ id: item._id as Id<'recurringTransactions'> });
    else await removeOneTime({ id: item._id as Id<'oneTimeTransactions'> });
  };

  const handleEdit = (item: Item) => {
    if (item.kind === 'recurring') {
      setEditingRecurring(item);
      setShowRecurringForm(true);
    } else {
      setEditingOneTime(item);
      setShowOneTimeForm(true);
    }
  };

  const pillClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm cursor-pointer ${active ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`;

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto relative">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex items-center gap-2">
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            list="transaction-tag-filter"
            placeholder="Filter tags"
            className="px-2 py-1 rounded-md border border-gray-600 bg-gray-800"
          />
          <datalist id="transaction-tag-filter">
            {allTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <button
            onClick={() => {
              setEditingRecurring(null);
              setShowRecurringForm(true);
            }}
            className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-md bg-blue-600 text-white"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Recurring</span>
          </button>
          <button
            onClick={() => {
              setEditingOneTime(null);
              setShowOneTimeForm(true);
            }}
            className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-md bg-blue-600 text-white"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add One Time</span>
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setView('all')} className={pillClass(view === 'all')}>All</button>
        <button onClick={() => setView('recurring')} className={pillClass(view === 'recurring')}>Recurring</button>
        <button onClick={() => setView('one-time')} className={pillClass(view === 'one-time')}>One Time</button>
      </div>
      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {combined.map((t) => (
          <div key={t._id} className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t.name}</span>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(t)} className="p-1 rounded hover:bg-gray-700">
                  <PencilIcon className="w-5 h-5 text-blue-400" />
                </button>
                <button onClick={() => handleDelete(t)} className="p-1 rounded hover:bg-gray-700">
                  <TrashIcon className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-mono">{formatCurrency(t.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly</span>
                <span className="font-mono">
                  {t.kind === 'recurring' ? formatCurrency(monthlyAmount(t)) : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span>{t.type === 'income' ? 'Income' : 'Expense'}</span>
              </div>
              <div className="flex justify-between">
                <span>Frequency</span>
                <span>
                  {t.kind === 'recurring'
                    ? t.frequency === 'monthly'
                      ? `Monthly on ${t.daysOfMonth?.join(', ')}`
                      : t.frequency === 'weekly'
                      ? `Weekly on ${t.daysOfWeek?.join(', ')}`
                      : t.frequency === 'quarterly'
                      ? `Quarterly starting ${t.month}/${t.day}`
                      : `Yearly on ${t.month}/${t.day}`
                    : '-'}
                </span>
              </div>
              {t.kind === 'one-time' && (
                <div className="flex justify-between">
                  <span>Date</span>
                  <span>{new Date(t.date).toLocaleDateString()}</span>
                </div>
              )}
              {t.tags && t.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-700 rounded-full text-xs">
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
              <th className="px-2 py-1 text-left">Amount</th>
              <th className="px-2 py-1 text-left">Monthly Total</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">Frequency</th>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Tags</th>
              <th className="px-2 py-1 text-right w-20 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {combined.map((t) => (
              <tr key={t._id} className="border-t border-gray-700">
                <td className="px-2 py-1">{t.name}</td>
                <td className="px-2 py-1">{formatCurrency(t.amount)}</td>
                <td className="px-2 py-1">
                  {t.kind === 'recurring' ? formatCurrency(monthlyAmount(t)) : '-'}
                </td>
                <td className="px-2 py-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      t.type === 'income' ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'
                    }`}
                  >
                    {t.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className="px-2 py-1">
                  {t.kind === 'recurring'
                    ? t.frequency === 'monthly'
                      ? `Monthly on ${t.daysOfMonth?.join(', ')}`
                      : t.frequency === 'weekly'
                      ? `Weekly on ${t.daysOfWeek?.join(', ')}`
                      : t.frequency === 'quarterly'
                      ? `Quarterly starting ${t.month}/${t.day}`
                      : `Yearly on ${t.month}/${t.day}`
                    : '-'}
                </td>
                <td className="px-2 py-1">
                  {t.kind === 'one-time' ? new Date(t.date).toLocaleDateString() : '-'}
                </td>
                <td className="px-2 py-1">
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1 text-right space-x-2 w-20 whitespace-nowrap">
                  <button onClick={() => handleEdit(t)} className="p-1 rounded hover:bg-gray-700" title="Edit">
                    <PencilIcon className="w-5 h-5 text-blue-400" />
                  </button>
                  <button onClick={() => handleDelete(t)} className="p-1 rounded hover:bg-gray-700" title="Delete">
                    <TrashIcon className="w-5 h-5 text-red-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col items-end gap-1 text-sm mt-2">
          <div>
            Income Total: <span className="text-green-500">{formatCurrency(totals.income)}</span>
          </div>
          <div>
            Expense Total: <span className="text-red-500">{formatCurrency(totals.expense)}</span>
          </div>
          <div>
            Net: <span className={totals.income - totals.expense >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(totals.income - totals.expense)}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          setEditingRecurring(null);
          setShowRecurringForm(true);
        }}
        className="sm:hidden fixed bottom-20 right-4 p-4 rounded-full bg-blue-600 text-white shadow-lg"
        aria-label="Add recurring transaction"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
      <button
        onClick={() => {
          setEditingOneTime(null);
          setShowOneTimeForm(true);
        }}
        className="sm:hidden fixed bottom-4 right-4 p-4 rounded-full bg-blue-600 text-white shadow-lg"
        aria-label="Add one time transaction"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
      {showRecurringForm && (
        <Modal onClose={() => { setShowRecurringForm(false); setEditingRecurring(null); }}>
          <RecurringForm
            onClose={() => { setShowRecurringForm(false); setEditingRecurring(null); }}
            transaction={editingRecurring || undefined}
          />
        </Modal>
      )}
      {showOneTimeForm && (
        <Modal onClose={() => { setShowOneTimeForm(false); setEditingOneTime(null); }}>
          <OneTimeForm
            onClose={() => { setShowOneTimeForm(false); setEditingOneTime(null); }}
            transaction={editingOneTime || undefined}
          />
        </Modal>
      )}
    </div>
  );
}
