'use client';

import { useState } from 'react';
import { Doc } from '@/convex/_generated/dataModel';
import { formatCurrency } from '@/lib/formatters';
import { PencilIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export type DebtHistoryEntry = Doc<'debtHistory'>;

interface DebtHistoryListProps {
  history: DebtHistoryEntry[];
  currentValue: number;
  onEdit: (entry: DebtHistoryEntry) => void;
}

export default function DebtHistoryList({ history, currentValue, onEdit }: DebtHistoryListProps) {
  const [open, setOpen] = useState(false);
  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);

  // Find the history entry closest to today
  const now = Date.now();
  const closest = sorted.reduce((prev, curr) =>
    Math.abs(curr.timestamp - now) < Math.abs(prev.timestamp - now) ? curr : prev,
  sorted[0]);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center text-sm font-medium hover:underline"
      >
        {open ? (
          <ChevronDownIcon className="w-4 h-4 mr-1" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 mr-1" />
        )}
        History Entries
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {sorted.map((entry) => (
            <li
              key={entry._id}
              className={`flex justify-between items-center rounded-md px-3 py-2 ${
                entry._id === closest._id ? 'bg-blue-900/40' : 'bg-white/5'
              }`}
            >
              <span className="text-sm">
                {new Date(entry.timestamp).toLocaleDateString()}
              </span>
              <span className="text-sm">{formatCurrency(entry.value)}</span>
              <span className="text-sm text-gray-400">
                {formatCurrency(currentValue)}
              </span>
              <button
                onClick={() => onEdit(entry)}
                className="p-1 rounded hover:bg-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
