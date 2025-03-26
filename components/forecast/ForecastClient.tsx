'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DailyMetric } from './types';
import { ForecastEmptyState } from './ForecastEmptyState';
import { ForecastControls } from './ForecastControls';
import { ForecastSummary } from './ForecastSummary';
import { ForecastChartView } from './ForecastChartView';

interface ForecastClientProps {
  initialMetrics: DailyMetric[];
  initialNetWorth: {
    netWorth: number;
    assets: number;
    debts: number;
  } | null;
}

export function ForecastClient({ initialMetrics, initialNetWorth }: ForecastClientProps) {
  const [monthlyCost, setMonthlyCost] = useState(10000);
  const [monthlyIncome, setMonthlyIncome] = useState(18000);
  
  // Add state to control when to activate real-time queries
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isStableState, setIsStableState] = useState(false);
  
  // Set up a timer to activate queries after a short delay
  useEffect(() => {
    // Don't activate queries immediately to prevent flash during auth
    const timer = setTimeout(() => {
      setShouldFetch(true);
    }, 2000); // 2-second delay before activating queries
    
    return () => clearTimeout(timer);
  }, []);
  
  // Set up another timer to mark the state as stable after querying
  useEffect(() => {
    if (shouldFetch) {
      const stabilityTimer = setTimeout(() => {
        setIsStableState(true);
      }, 1000); // 1-second after queries activate
      
      return () => clearTimeout(stabilityTimer);
    }
  }, [shouldFetch]);
  
  // Fetch metrics and current net worth in real-time, but only if shouldFetch is true
  const realtimeMetrics = useQuery(
    api.metrics.getDailyMetrics, 
    shouldFetch ? {} : "skip"
  );
  
  const realtimeNetWorth = useQuery(
    api.metrics.getCurrentNetWorth, 
    shouldFetch ? {} : "skip"
  );
  
  // Always start with initial values, then optionally use real-time values once stable
  const metrics = useMemo(() => {
    // If we have initial metrics and either:
    // 1. We're not fetching yet, or 
    // 2. Real-time data isn't loaded, or
    // 3. Real-time data is empty and initial data isn't
    // Then use initial metrics
    if (initialMetrics?.length > 0 && 
        (!shouldFetch || 
         !realtimeMetrics || 
         (realtimeMetrics.length === 0 && initialMetrics.length > 0) ||
         !isStableState)
       ) {
      return initialMetrics;
    }
    
    // Otherwise use real-time metrics, falling back to initial
    return realtimeMetrics ?? initialMetrics;
  }, [initialMetrics, realtimeMetrics, shouldFetch, isStableState]);
  
  // Same logic for net worth
  const currentNetWorth = useMemo(() => {
    if (initialNetWorth && 
        (!shouldFetch || 
         !realtimeNetWorth || 
         !realtimeNetWorth.netWorth ||
         !isStableState)
       ) {
      return initialNetWorth;
    }
    
    return realtimeNetWorth ?? initialNetWorth;
  }, [initialNetWorth, realtimeNetWorth, shouldFetch, isStableState]);
  
  // Check if we have any metrics data
  const hasData = metrics && metrics.length > 0;

  const forecastedMetrics = useMemo(() => {
    if (!hasData) return [];

    // Use current net worth if available, otherwise use last metric
    const lastMetric = metrics[metrics.length - 1];
    if (!lastMetric) return []; // Safety check
    
    // Safely access current net worth, falling back to the last metric
    const startingNetWorth = (currentNetWorth?.netWorth !== undefined && currentNetWorth?.netWorth !== null) 
      ? currentNetWorth.netWorth 
      : lastMetric.netWorth;
    
    const lastDate = new Date(lastMetric.date);

    // Start forecast from first of next month
    const forecastStart = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);

    const monthlyNet = monthlyIncome - monthlyCost;

    const forecastPoints = Array.from({ length: 12 }, (_, i) => {
      const forecastDate = new Date(forecastStart);
      forecastDate.setMonth(forecastStart.getMonth() + i);

      // Safely access assets/debts with fallbacks
      const assets = (currentNetWorth?.assets !== undefined && currentNetWorth?.assets !== null)
        ? currentNetWorth.assets
        : (lastMetric.assets || 0);
      
      const debts = (currentNetWorth?.debts !== undefined && currentNetWorth?.debts !== null)
        ? currentNetWorth.debts
        : (lastMetric.debts || 0);

      return {
        _id: lastMetric._id, // Use the same ID as the last metric
        _creationTime: Date.now(),
        date: forecastDate.getTime(),
        netWorth: startingNetWorth + (monthlyNet * (i + 1)),
        assets: assets,
        debts: debts,
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
    if (!hasData || !forecastedMetrics.length) return [];
    
    // Include last real point with projections for continuity
    const nonProjectedPoints = forecastedMetrics.filter(m => !m.isProjected);
    if (!nonProjectedPoints.length) return [];
    
    const lastRealPoint = nonProjectedPoints.sort((a, b) => b.date - a.date)[0];
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

  // Safely get the current and projected net worth values
  const lastMetric = metrics.length > 0 ? metrics[metrics.length-1] : null;
  const currentValue = (currentNetWorth?.netWorth !== undefined) 
    ? currentNetWorth.netWorth 
    : (lastMetric?.netWorth || 0);
  
  const lastForecastedMetric = forecastedMetrics.length > 0 
    ? forecastedMetrics[forecastedMetrics.length-1] 
    : null;
  const projectedValue = lastForecastedMetric?.netWorth || currentValue;

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