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
  
  // Fetch metrics in real-time
  const liveMetrics = useQuery(api.metrics.getDailyMetrics) ?? initialMetrics;
  
  // Use live metrics if available, otherwise fall back to initial metrics
  const metrics = liveMetrics || initialMetrics || [];
  
  // Check if we have any metrics data
  const hasData = metrics && metrics.length > 0;

  const forecastedMetrics = useMemo(() => {
    if (!hasData) return [];

    const lastMetric = metrics[metrics.length - 1];
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
        netWorth: lastMetric.netWorth + (monthlyNet * (i + 1)),
        assets: lastMetric.assets || 0,
        debts: lastMetric.debts || 0,
        prices: lastMetric.prices,
        metadata: lastMetric.metadata,
        isProjected: true // Mark as projected
      } as DailyMetric & { isProjected: boolean };
    });

    // Mark all original points as not projected
    const realPoints = metrics.map(m => ({ ...m, isProjected: false }));

    return [...realPoints, ...forecastPoints];
  }, [metrics, monthlyCost, monthlyIncome, hasData]);

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

  return (
    <div className="flex flex-col gap-4 w-full">
      <ForecastSummary
        currentNetWorth={metrics[metrics.length-1].netWorth}
        projectedNetWorth={forecastedMetrics[forecastedMetrics.length-1].netWorth}
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