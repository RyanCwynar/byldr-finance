'use client';

import { useState } from 'react';
import { Doc } from '@/convex/_generated/dataModel';
import { formatCurrency } from '@/lib/formatters';
import { PencilIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export type DebtHistoryEntry = Doc<'debtHistory'>;

interface DebtHistoryListProps {
  history: DebtHistoryEntry[];
  onEdit: (entry: DebtHistoryEntry) => void;
}

export default function DebtHistoryList({ history, onEdit }: DebtHistoryListProps) {
  const [open, setOpen] = useState(false);
  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);

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
            <li key={entry._id} className="flex justify-between items-center rounded-md bg-white/5 px-3 py-2">
              <span className="text-sm">{new Date(entry.timestamp).toLocaleDateString()}</span>
              <span className="text-sm">{formatCurrency(entry.value)}</span>
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
