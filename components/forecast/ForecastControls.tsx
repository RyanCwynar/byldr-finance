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
    </div>
  );
} 