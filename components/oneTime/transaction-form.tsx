'use client';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';

interface TransactionFormProps {
  onClose: () => void;
  transaction?: Doc<'oneTimeTransactions'>;
  onSubmit?: (updates: Partial<Doc<'oneTimeTransactions'>>) => Promise<void>;
}

export function TransactionForm({ onClose, transaction, onSubmit }: TransactionFormProps) {
  const [name, setName] = useState(transaction?.name || '');
  const [amount, setAmount] = useState(transaction?.amount.toString() || '');
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [date, setDate] = useState(
    transaction?.date ? new Date(transaction.date).toISOString().slice(0, 10) : ''
  );
  const [tags, setTags] = useState(transaction?.tags ? transaction.tags.join(',') : '');

  const existingTags = useQuery(api.oneTime.listOneTimeTags) ?? [];

  const add = useMutation(api.oneTime.addOneTimeTransaction);
  const update = useMutation(api.oneTime.updateOneTimeTransaction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name,
      amount: Number(amount),
      type,
      date: date ? new Date(date).getTime() : Date.now(),
    };
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
        {transaction ? 'Edit One Time Transaction' : 'Add One Time Transaction'}
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
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tags (comma separated)</label>
          <input
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="travel,gifts"
            list="one-time-tag-options"
          />
          <datalist id="one-time-tag-options">
            {existingTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
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
