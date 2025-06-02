'use client';

import TotalDebtHistoryChart, { DebtPoint } from './total-debt-history-chart';
import { formatCurrency } from '@/lib/formatters';
import { calculateChangeRates } from '@/lib/debt';

interface DebtOverviewClientProps {
  history: DebtPoint[];
  manualTotal: number;
  walletTotal: number;
}

export default function DebtOverviewClient({ history, manualTotal, walletTotal }: DebtOverviewClientProps) {
  const combinedTotal = manualTotal + walletTotal;
  const { weeklyChange, monthlyChange } = calculateChangeRates(history);

  const formatChange = (value: number | null) => {
    if (value === null) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatCurrency(Math.abs(value))}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
          <h3 className="text-sm text-gray-400">Manual Debts</h3>
          <p className="text-xl font-mono text-red-500">{formatCurrency(manualTotal)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
          <h3 className="text-sm text-gray-400">Wallet Debts</h3>
          <p className="text-xl font-mono text-red-500">{formatCurrency(walletTotal)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
          <h3 className="text-sm text-gray-400">Total Debt</h3>
          <p className="text-xl font-mono text-red-500">{formatCurrency(combinedTotal)}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
        <TotalDebtHistoryChart history={history} />
        {(weeklyChange !== null || monthlyChange !== null) && (
          <div className="mt-4 text-sm text-gray-300 space-y-1">
            {weeklyChange !== null && (
              <p>
                Avg change per week:{' '}
                <span className={weeklyChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatChange(weeklyChange)}
                </span>
              </p>
            )}
            {monthlyChange !== null && (
              <p>
                Avg change per month:{' '}
                <span className={monthlyChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatChange(monthlyChange)}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
