'use client';
import { useState } from 'react';
import RecurringPageClient from '@/components/recurring/RecurringPageClient';
import OneTimePageClient from '@/components/oneTime/OneTimePageClient';
import { Doc } from '@/convex/_generated/dataModel';

interface Props {
  initialRecurring: Doc<'recurringTransactions'>[];
  initialRecurringTags: string[];
  initialOneTime: Doc<'oneTimeTransactions'>[];
  initialOneTimeTags: string[];
}

export default function TransactionsPageClient({
  initialRecurring,
  initialRecurringTags,
  initialOneTime,
  initialOneTimeTags,
}: Props) {
  const [view, setView] = useState<'all' | 'recurring' | 'one-time'>('all');

  const pillClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm cursor-pointer ${active ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <button onClick={() => setView('all')} className={pillClass(view === 'all')}>
          All
        </button>
        <button onClick={() => setView('recurring')} className={pillClass(view === 'recurring')}>
          Recurring
        </button>
        <button onClick={() => setView('one-time')} className={pillClass(view === 'one-time')}>
          One Time
        </button>
      </div>
      {(view === 'all' || view === 'recurring') && (
        <RecurringPageClient initialData={initialRecurring} initialTags={initialRecurringTags} />
      )}
      {(view === 'all' || view === 'one-time') && (
        <OneTimePageClient initialData={initialOneTime} initialTags={initialOneTimeTags} />
      )}
    </div>
  );
}
