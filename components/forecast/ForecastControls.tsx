'use client';

import { ForecastControlsProps } from './types';
import { Slider } from './Slider';

export function ForecastControls({ 
  monthlyCost, 
  setMonthlyCost, 
  monthlyIncome, 
  setMonthlyIncome 
}: ForecastControlsProps) {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
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
        <a href="/recurring" className="text-sm text-blue-500 hover:underline">
          Manage Recurring Transactions
        </a>
        <a href="/one-time" className="text-sm text-blue-500 hover:underline">
          Manage One Time Transactions
        </a>
      </div>
    </div>
  );
}
