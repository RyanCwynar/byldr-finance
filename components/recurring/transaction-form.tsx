'use client';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';

interface TransactionFormProps {
  onClose: () => void;
  transaction?: Doc<'recurringTransactions'>;
  onSubmit?: (updates: Partial<Doc<'recurringTransactions'>>) => Promise<void>;
}

export function TransactionForm({ onClose, transaction, onSubmit }: TransactionFormProps) {
  const [name, setName] = useState(transaction?.name || '');
  const [amount, setAmount] = useState(transaction?.amount.toString() || '');
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly' | 'quarterly'>(transaction?.frequency || 'monthly');
  const [daysOfMonth, setDaysOfMonth] = useState(
    transaction?.daysOfMonth ? transaction.daysOfMonth.join(',') : ''
  );
  const [daysOfWeek, setDaysOfWeek] = useState(
    (transaction as any)?.daysOfWeek ? (transaction as any).daysOfWeek.join(',') : ''
  );
  const [month, setMonth] = useState(transaction?.month ? String(transaction.month) : '');
  const [day, setDay] = useState(transaction?.day ? String(transaction.day) : '');
  const [tags, setTags] = useState(transaction?.tags ? transaction.tags.join(',') : '');
  const [hidden, setHidden] = useState(transaction?.hidden || false);

  const existingTags = useQuery(api.recurring.listRecurringTags) ?? [];

  const add = useMutation(api.recurring.addRecurringTransaction);
  const update = useMutation(api.recurring.updateRecurringTransaction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name,
      amount: Number(amount),
      type,
      frequency,
      hidden,
    };
    if (frequency === 'monthly') {
      data.daysOfMonth = daysOfMonth
        ? daysOfMonth.split(',').map((d: string) => Number(d.trim())).filter(Boolean)
        : [1];
    } else if (frequency === 'weekly') {
      data.daysOfWeek = daysOfWeek
        ? daysOfWeek.split(',').map((d: string) => Number(d.trim())).filter(Boolean)
        : [1];
    } else {
      data.month = month ? Number(month) : 1;
      data.day = day ? Number(day) : 1;
    }
    if (tags) {
      data.tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    } else {
      data.tags = [];
    }
    if (transaction) {
      await update({ id: transaction._id, ...data });
      if (onSubmit) await onSubmit(data);
    } else {
      await add(data);
    }
    onClose();
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">
        {transaction ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Amount</label>
          <input
            type="number"
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Type</label>
          <select
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as 'income' | 'expense')}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Frequency</label>
          <select
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
            value={frequency}
            onChange={(e) =>
              setFrequency(
                e.target.value as 'monthly' | 'yearly' | 'weekly' | 'quarterly'
              )
            }
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        {frequency === 'monthly' && (
          <div>
            <label className="block text-sm mb-1">Days of Month (comma separated)</label>
            <input
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
              value={daysOfMonth}
              onChange={(e) => setDaysOfMonth(e.target.value)}
              placeholder="1,15"
            />
          </div>
        )}
        {frequency === 'weekly' && (
          <div>
            <label className="block text-sm mb-1">Days of Week (0-6 comma separated)</label>
            <input
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
              value={daysOfWeek}
              onChange={(e) => setDaysOfWeek(e.target.value)}
              placeholder="1,3,5"
            />
          </div>
        )}
        {(frequency === 'yearly' || frequency === 'quarterly') && (
          <div className="flex space-x-2">
            <div>
              <label className="block text-sm mb-1">Month (1-12)</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                min={1}
                max={12}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Day</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                min={1}
                max={31}
              />
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm mb-1">Tags (comma separated)</label>
          <input
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="rent,utilities"
            list="recurring-tag-options"
          />
          <datalist id="recurring-tag-options">
            {existingTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="hidden"
            type="checkbox"
            checked={hidden}
            onChange={(e) => setHidden(e.target.checked)}
          />
          <label htmlFor="hidden" className="text-sm">
            Hidden
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-700"
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
