'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RecurringTotals } from '@/components/forecast/types';
import Link from 'next/link';
import { formatNumber } from '@/lib/formatters';

interface RecurringTotalsCardProps {
  initialTotals: RecurringTotals;
}

export default function RecurringTotalsCard({ initialTotals }: RecurringTotalsCardProps) {
  const totals = useQuery(api.recurring.getMonthlyTotals) ?? initialTotals;

  return (
    <div className="flex flex-col gap-2 bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-2">Recurring Totals</h3>
      <div className="flex justify-between">
        <span className="text-sm text-gray-400">Monthly Income</span>
        <span className="text-green-500 font-mono">${formatNumber(totals.monthlyIncome)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-400">Monthly Costs</span>
        <span className="text-red-500 font-mono">${formatNumber(totals.monthlyCost)}</span>
      </div>
      <Link href="/recurring" className="text-blue-400 hover:underline text-sm mt-2">
        Manage Recurring
      </Link>
    </div>
  );
}
