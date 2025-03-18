'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DailyMetric } from './types';
import { ForecastEmptyState } from './ForecastEmptyState';
import { ForecastControls } from './ForecastControls';
import { ForecastSummary } from './ForecastSummary';
import { ForecastChartView } from './ForecastChartView';

export default function ForecastWrapper({ metrics: initialMetrics }: { metrics: DailyMetric[] }) {
  const [monthlyCost, setMonthlyCost] = useState(10000);
  const [monthlyIncome, setMonthlyIncome] = useState(18000);
  
  // Fetch metrics and current net worth in real-time
  const liveMetrics = useQuery(api.metrics.getDailyMetrics) ?? initialMetrics;
  const currentNetWorth = useQuery(api.metrics.getCurrentNetWorth);
  
  // Use live metrics if available, otherwise fall back to initial metrics
  const metrics = liveMetrics || initialMetrics || [];
  
  // Check if we have any metrics data
  const hasData = metrics && metrics.length > 0;

  const forecastedMetrics = useMemo(() => {
    if (!hasData) return [];

    // Use current net worth if available, otherwise use last metric
    const lastMetric = metrics[metrics.length - 1];
    const startingNetWorth = currentNetWorth?.netWorth ?? lastMetric.netWorth;
    const lastDate = new Date(lastMetric.date);

    // Start forecast from first of next month
    const forecastStart = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);

    const monthlyNet = monthlyIncome - monthlyCost;

    const forecastPoints = Array.from({ length: 12 }, (_, i) => {
      const forecastDate = new Date(forecastStart);
      forecastDate.setMonth(forecastStart.getMonth() + i);

      return {
        _id: lastMetric._id, // Use the same ID as the last metric
        _creationTime: Date.now(),
        date: forecastDate.getTime(),
        netWorth: startingNetWorth + (monthlyNet * (i + 1)),
        assets: currentNetWorth?.assets || lastMetric.assets || 0,
        debts: currentNetWorth?.debts || lastMetric.debts || 0,
        prices: lastMetric.prices,
        metadata: lastMetric.metadata,
        isProjected: true // Mark as projected
      } as DailyMetric & { isProjected: boolean };
    });

    // Mark all original points as not projected
    const realPoints = metrics.map(m => ({ ...m, isProjected: false }));

    return [...realPoints, ...forecastPoints];
  }, [metrics, monthlyCost, monthlyIncome, hasData, currentNetWorth]);

  const [dataView, setDataView] = useState<'all' | 'real' | 'projected'>('all');

  const realMetrics = useMemo(() => {
    return forecastedMetrics.filter(m => !m.isProjected);
  }, [forecastedMetrics]);

  const projectedMetrics = useMemo(() => {
    if (!hasData) return [];
    
    // Include last real point with projections for continuity
    const lastRealPoint = forecastedMetrics.filter(m => !m.isProjected).sort((a, b) => b.date - a.date)[0];
    const projectedPoints = forecastedMetrics.filter(m => m.isProjected);
    return lastRealPoint ? [lastRealPoint, ...projectedPoints] : projectedPoints;
  }, [forecastedMetrics, hasData]);

  // If there's no data, show the empty state
  if (!hasData) {
    return (
      <ForecastEmptyState
        monthlyCost={monthlyCost}
        setMonthlyCost={setMonthlyCost}
        monthlyIncome={monthlyIncome}
        setMonthlyIncome={setMonthlyIncome}
      />
    );
  }

  // Get the current and projected net worth values
  const currentValue = currentNetWorth?.netWorth ?? metrics[metrics.length-1].netWorth;
  const projectedValue = forecastedMetrics[forecastedMetrics.length-1].netWorth;

  return (
    <div className="flex flex-col gap-4 w-full">
      <ForecastSummary
        currentNetWorth={currentValue}
        projectedNetWorth={projectedValue}
      />
      
      <ForecastChartView
        realMetrics={realMetrics}
        projectedMetrics={projectedMetrics}
        dataView={dataView}
        setDataView={setDataView}
      />
      
      <ForecastControls
        monthlyCost={monthlyCost}
        setMonthlyCost={setMonthlyCost}
        monthlyIncome={monthlyIncome}
        setMonthlyIncome={setMonthlyIncome}
      />
    </div>
  );
} 