'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DailyMetric, UserPreferences, UserPreferencesData, RecurringTotals } from './types';
import { ForecastEmptyState } from './ForecastEmptyState';
import { ForecastControls } from './ForecastControls';
import { ForecastSummary } from './ForecastSummary';
import { ForecastChartView } from './ForecastChartView';

// Local storage key for simulation data - still used for simulation data only
const SIMULATION_STORAGE_KEY = 'simulation_portfolio_summary';

interface SimulationData {
  originalValue: number;
  adjustedValue: number;
  originalAssets: number;
  adjustedAssets: number;
  originalDebts: number;
  adjustedDebts: number;
  percentChange: number;
}

interface ForecastClientProps {
  initialMetrics: DailyMetric[];
  initialNetWorth: {
    netWorth: number;
    assets: number;
    debts: number;
  } | null;
  initialPreferences: UserPreferencesData | null;
  initialRecurring: { monthlyIncome: number; monthlyCost: number } | null;
}

export function ForecastClient({
  initialMetrics,
  initialNetWorth,
  initialPreferences,
  initialRecurring
}: ForecastClientProps) {
  // Initialize state from server-side preferences, falling back to defaults
  const defaultPrefs = initialPreferences?.preferences || {};
  
  const [monthlyCost, setMonthlyCost] = useState(
    initialRecurring?.monthlyCost ?? 0
  );
  const [monthlyIncome, setMonthlyIncome] = useState(
    initialRecurring?.monthlyIncome ?? 0
  );
  const [useSimulationData, setUseSimulationData] = useState(defaultPrefs.useSimulationData || false);
  const [dataView, setDataView] = useState<'all' | 'real' | 'projected'>(
    (defaultPrefs.forecastDataView as 'all' | 'real' | 'projected') || 'all'
  );
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>(
    (defaultPrefs.forecastTimeframe as '7d' | '30d' | '90d' | 'all') || 'all'
  );
  
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  
  // Add state to control when to activate real-time queries
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isStableState, setIsStableState] = useState(false);
  
  // Get the preference update mutation
  const updatePreferences = useMutation(api.userPreferences.updatePreferences);
  const setPreference = useMutation(api.userPreferences.setPreference);
  
  // Custom setters that update server preferences
  const updateMonthlyCost = (value: number) => {
    setMonthlyCost(value);
    setPreference({ key: "monthlyCost", value });
  };
  
  const updateMonthlyIncome = (value: number) => {
    setMonthlyIncome(value);
    setPreference({ key: "monthlyIncome", value });
  };
  
  const updateUseSimulationData = (value: boolean) => {
    setUseSimulationData(value);
    setPreference({ key: "useSimulationData", value });
  };
  
  const updateDataView = (value: 'all' | 'real' | 'projected') => {
    setDataView(value);
    setPreference({ key: "forecastDataView", value });
  };

  const updateTimeframe = (value: '7d' | '30d' | '90d' | 'all') => {
    setTimeframe(value);
    setPreference({ key: 'forecastTimeframe', value });
  };
  
  // Load simulation data from local storage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedSimulation = localStorage.getItem(SIMULATION_STORAGE_KEY);
        if (savedSimulation) {
          try {
            const parsed = JSON.parse(savedSimulation);
            setSimulationData(parsed);
            console.log('Loaded simulation data from local storage:', parsed);
          } catch (e) {
            console.error('Failed to parse simulation data:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading simulation data from local storage:', error);
    }
  }, []);
  
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
  
  // Fetch user preferences in real-time to stay updated with changes from other sessions
  const realtimePreferences = useQuery(
    api.userPreferences.getUserPreferences,
    shouldFetch ? {} : "skip"
  );

  const realtimeRecurring = useQuery(
    api.recurring.getMonthlyTotals,
    shouldFetch ? {} : "skip"
  );

  const recurringTotals = useMemo(() => {
    if (shouldFetch && realtimeRecurring) return realtimeRecurring;
    return initialRecurring || { monthlyIncome: 0, monthlyCost: 0 };
  }, [realtimeRecurring, initialRecurring, shouldFetch]);

  // Keep monthly values in sync with recurring totals
  useEffect(() => {
    setMonthlyCost(recurringTotals.monthlyCost);
    setMonthlyIncome(recurringTotals.monthlyIncome);
  }, [recurringTotals.monthlyCost, recurringTotals.monthlyIncome]);
  
  // Always start with initial values, then optionally use real-time values once stable
  const metrics = useMemo(() => {
    if (initialMetrics?.length > 0 && 
        (!shouldFetch || 
         !realtimeMetrics || 
         (realtimeMetrics.length === 0 && initialMetrics.length > 0) ||
         !isStableState)
       ) {
      return initialMetrics;
    }
    
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
    
    // Safely access assets/debts with fallbacks
    const startingAssets = (currentNetWorth?.assets !== undefined && currentNetWorth?.assets !== null)
      ? currentNetWorth.assets
      : (lastMetric.assets || 0);
    
    const startingDebts = (currentNetWorth?.debts !== undefined && currentNetWorth?.debts !== null)
      ? currentNetWorth.debts
      : (lastMetric.debts || 0);
    
    const lastDate = new Date(lastMetric.date);
    
    // Start forecast from first of next month
    const forecastStart = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);
    
    const combinedIncome = monthlyIncome + recurringTotals.monthlyIncome;
    const combinedCost = monthlyCost + recurringTotals.monthlyCost;
    const monthlyNet = combinedIncome - combinedCost;
    
    // Calculate simulation-based projections if enabled and data is available
    // 
    // IMPORTANT NOTE ON ASSET/DEBT HANDLING:
    // - Asset values may increase or decrease based on simulation
    // - Debt values can only decrease or stay the same (we don't simulate debt growth)
    // - This reflects reality where asset appreciation is common, but debt growth
    //   is typically a conscious decision rather than a natural market effect
    let simulationTargetNetWorth = startingNetWorth;
    let simulationTargetAssets = startingAssets;
    let simulationTargetDebts = startingDebts;
    let simulationMonthlyChangeNetWorth = 0;
    let simulationMonthlyChangeAssets = 0;
    let simulationMonthlyChangeDebts = 0;
    
    if (useSimulationData && simulationData) {
      // Calculate the target values from simulation
      simulationTargetNetWorth = simulationData.adjustedValue;
      simulationTargetAssets = simulationData.adjustedAssets;
      
      // For debts, we either keep them the same or decrease them
      // We don't want to simulate increasing debts
      simulationTargetDebts = Math.min(startingDebts, simulationData.adjustedDebts);
      
      // Calculate monthly change to reach the simulation target over 12 months
      simulationMonthlyChangeNetWorth = (simulationTargetNetWorth - startingNetWorth) / 12;
      simulationMonthlyChangeAssets = (simulationTargetAssets - startingAssets) / 12;
      
      // For debts, calculate decrease if the simulation shows lower debts
      // Otherwise, keep debts constant (no change)
      simulationMonthlyChangeDebts = simulationTargetDebts < startingDebts 
        ? (simulationTargetDebts - startingDebts) / 12 
        : 0;
      
      console.log('Simulation Monthly Changes:', {
        netWorth: simulationMonthlyChangeNetWorth,
        assets: simulationMonthlyChangeAssets,
        debts: simulationMonthlyChangeDebts,
        starting: { startingNetWorth, startingAssets, startingDebts },
        target: { simulationTargetNetWorth, simulationTargetAssets, simulationTargetDebts }
      });
    }

    const forecastPoints = Array.from({ length: 12 }, (_, i) => {
      const forecastDate = new Date(forecastStart);
      forecastDate.setMonth(forecastStart.getMonth() + i);
      
      // Calculate projected values based on monthly cash flow
      const cashFlowNetWorth = startingNetWorth + (monthlyNet * (i + 1));
      
      // Calculate simulation-based projection values
      const simulationNetWorth = startingNetWorth + (simulationMonthlyChangeNetWorth * (i + 1));
      const simulationAssets = startingAssets + (simulationMonthlyChangeAssets * (i + 1));
      
      // For debts, we either keep them constant or apply the decrease
      // The decrease will be a negative number, so we add it
      const simulationDebts = startingDebts + (simulationMonthlyChangeDebts * (i + 1));
      
      // Combine simulation and cash flow effects when simulation is enabled
      // When simulation is enabled, we:
      // 1. Apply the asset/debt changes from the simulation (market-based changes)
      // 2. PLUS the monthly cash flow impact (income minus expenses)
      // This gives a more accurate projection that factors in both market performance 
      // and personal financial decisions
      const projectedNetWorth = useSimulationData && simulationData 
        ? startingNetWorth + simulationMonthlyChangeNetWorth * (i + 1) + (monthlyNet * (i + 1))
        : cashFlowNetWorth;
      
      const projectedAssets = useSimulationData && simulationData
        ? simulationAssets
        : startingAssets;
      
      const projectedDebts = useSimulationData && simulationData
        ? simulationDebts
        : startingDebts;

      return {
        _id: lastMetric._id, // Use the same ID as the last metric
        _creationTime: Date.now(),
        date: forecastDate.getTime(),
        netWorth: projectedNetWorth,
        assets: projectedAssets,
        debts: projectedDebts,
        prices: lastMetric.prices,
        metadata: {
          ...lastMetric.metadata,
          forecastType: useSimulationData ? 'simulation' : 'cashflow'
        },
        isProjected: true // Mark as projected
      } as DailyMetric & { isProjected: boolean };
    });

    // Mark all original points as not projected
    const realPoints = metrics.map(m => ({ ...m, isProjected: false }));

    return [...realPoints, ...forecastPoints];
  }, [metrics, monthlyCost, monthlyIncome, hasData, currentNetWorth, useSimulationData, simulationData]);

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
        setMonthlyCost={updateMonthlyCost}
        monthlyIncome={monthlyIncome}
        setMonthlyIncome={updateMonthlyIncome}
      />
    );
  }

  // Safely get the current and projected net worth values
  const lastMetric = metrics.length > 0 ? metrics[metrics.length-1] : null;
  const currentValue = (currentNetWorth?.netWorth !== undefined)
    ? currentNetWorth.netWorth
    : (lastMetric?.netWorth || 0);

  const yesterdayAverage = useMemo(() => {
    if (!metrics.length) return undefined;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yMetrics = metrics.filter(m => m.date >= start && m.date < end);
    if (!yMetrics.length) return undefined;
    const sum = yMetrics.reduce((acc, m) => acc + m.netWorth, 0);
    return sum / yMetrics.length;
  }, [metrics]);
  
  const lastForecastedMetric = forecastedMetrics.length > 0 
    ? forecastedMetrics[forecastedMetrics.length-1] 
    : null;
  const projectedValue = lastForecastedMetric?.netWorth || currentValue;

  return (
    <div className="flex flex-col gap-4 w-full">
      <ForecastSummary
        currentNetWorth={currentValue}
        projectedNetWorth={projectedValue}
        prevNetWorth={yesterdayAverage}
      />
      
      <div className="flex flex-col mb-4 bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="useSimulationData"
            checked={useSimulationData}
            onChange={(e) => updateUseSimulationData(e.target.checked)}
            className="mr-2 h-4 w-4"
            disabled={!simulationData}
          />
          <label htmlFor="useSimulationData" className={`text-sm ${!simulationData ? 'text-gray-500' : 'text-gray-300'}`}>
            {simulationData 
              ? `Use portfolio simulation data (${Math.round(simulationData.percentChange)}% change in asset values) + monthly cash flow`
              : "No simulation data available - run a simulation first"}
          </label>
        </div>
        {simulationData && (
          <p className="text-xs text-gray-400 mt-1 ml-6">
            This preference will be saved with your account
          </p>
        )}
      </div>
      
      <ForecastChartView
        realMetrics={realMetrics}
        projectedMetrics={projectedMetrics}
        dataView={dataView}
        setDataView={updateDataView}
        timeframe={timeframe}
        setTimeframe={updateTimeframe}
      />
      
      <ForecastControls
        monthlyCost={monthlyCost}
        setMonthlyCost={updateMonthlyCost}
        monthlyIncome={monthlyIncome}
        setMonthlyIncome={updateMonthlyIncome}
      />
    </div>
  );
} 