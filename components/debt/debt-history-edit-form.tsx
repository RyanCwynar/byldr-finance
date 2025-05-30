'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';

interface DebtHistoryEditFormProps {
  entry: Doc<'debtHistory'>;
  onClose: () => void;
}

export default function DebtHistoryEditForm({ entry, onClose }: DebtHistoryEditFormProps) {
  const [value, setValue] = useState(entry.value.toString());
  const [date, setDate] = useState(new Date(entry.timestamp).toISOString().split('T')[0]);

  const updateEntry = useMutation(api.debts.updateDebtHistoryEntry);
  const deleteEntry = useMutation(api.debts.deleteDebtHistoryEntry);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateEntry({
      id: entry._id,
      value: Number(value),
      timestamp: new Date(date).getTime(),
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteEntry({ id: entry._id });
    onClose();
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Edit History Entry</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="value">
            Value (USD)
          </label>
          <input
            id="value"
            type="number"
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="mt-5 flex justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-red-500 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
