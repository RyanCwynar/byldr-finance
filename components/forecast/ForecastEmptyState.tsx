'use client';

import { ForecastEmptyStateProps } from './types';
import { Slider } from './Slider';

export function ForecastEmptyState({ 
  monthlyCost, 
  setMonthlyCost, 
  monthlyIncome, 
  setMonthlyIncome 
}: ForecastEmptyStateProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-gray-50 dark:bg-gray-800 h-[400px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium mb-2">No financial data available</h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          Add some assets, debts, or wallets to start tracking your net worth and see projections.
        </p>
      </div>
      
      <div className="flex flex-col gap-4 p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Forecast Settings</h3>
        <p className="text-sm text-gray-500 mb-4">
          These settings will be used to generate projections once you have financial data.
        </p>
        
        <Slider
          value={monthlyCost}
          onChange={setMonthlyCost}
          min={0}
          max={50000}
          step={100}
          label="Monthly Costs"
        />

        <Slider
          value={monthlyIncome}
          onChange={setMonthlyIncome}
          min={0}
          max={50000}
          step={100}
          label="Monthly Income"
        />
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
          <a href="/transactions" className="text-sm text-blue-500 hover:underline">
            Manage Transactions
          </a>
        </div>
      </div>
    </div>
  );
}
