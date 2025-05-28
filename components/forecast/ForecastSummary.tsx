'use client';

import { ForecastSummaryProps } from './types';

export function ForecastSummary({
  currentNetWorth,
  projectedNetWorth,
  prevNetWorth
}: ForecastSummaryProps) {
  // Calculate difference and percentage change
  const difference = projectedNetWorth - currentNetWorth;
  // Avoid division by zero
  const percentChange = currentNetWorth ? ((difference / currentNetWorth) * 100).toFixed(1) : '0.0';

  const hasPrev = typeof prevNetWorth === 'number';
  const dayChange = hasPrev ? currentNetWorth - (prevNetWorth as number) : 0;
  const dayPercent = hasPrev && prevNetWorth ? ((dayChange / prevNetWorth) * 100).toFixed(1) : '0.0';
  const dayUp = dayChange >= 0;

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-4 p-4 border rounded-lg">
      <div className="text-center sm:text-left">
        <div className="text-sm text-gray-500">
          <span className="sm:hidden">Current</span>
          <span className="hidden sm:inline">Current Net Worth</span>
        </div>
        <div className="text-xl sm:text-2xl font-bold">
          ${(currentNetWorth || 0).toLocaleString()}
        </div>
        {hasPrev && (
          <div className={`text-sm ${dayUp ? 'text-green-600' : 'text-red-600'}`}> 
            {dayUp ? '+' : '-'}${Math.abs(dayChange).toLocaleString()} ({dayPercent}% )
            <span className="text-gray-500"> since yesterday</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center">
        <div className="text-sm text-gray-500">Projected Change</div>
        <div className="text-xl sm:text-2xl font-bold text-green-600">
          <span>+{percentChange}%</span>
          <span className="hidden sm:inline"> (+${difference.toLocaleString()})</span>
        </div>
      </div>
      <div className="text-center sm:text-right">
        <div className="text-sm text-gray-500">
          <span className="sm:hidden">Projected (1yr)</span>
          <span className="hidden sm:inline">Projected Net Worth (1 Year)</span>
        </div>
        <div className="text-xl sm:text-2xl font-bold">
          ${(projectedNetWorth || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
} 
