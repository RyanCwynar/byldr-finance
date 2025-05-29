import { preloadQueryWithAuth } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { DailyMetric, UserPreferencesData, RecurringTotals, OneTimeTotals } from './types';
import { ForecastClient } from './ForecastClient';

interface ForecastPreloadProps {
  initialMetrics: DailyMetric[];
  initialNetWorth: {
    netWorth: number;
    assets: number;
    debts: number;
  } | null;
  initialRecurring: RecurringTotals | null;
  initialOneTimeTotals: OneTimeTotals | null;
}

// This component handles server-side data loading
export function ForecastPreload({
  initialMetrics,
  initialNetWorth,
  initialRecurring,
  initialOneTimeTotals
}: ForecastPreloadProps) {
  // We will handle user preferences on the client-side via useQuery
  // This ensures we always have the latest preferences
  return (
    <ForecastClient
      initialMetrics={initialMetrics}
      initialNetWorth={initialNetWorth}
      initialPreferences={null}
      initialRecurring={initialRecurring}
      initialOneTimeTotals={initialOneTimeTotals}
    />
  );
}

// Preload query for forecasting data on the server
export async function preloadForecastData() {
  // Preload both metrics and current net worth in parallel
  const [metricsPromise, netWorthPromise, preferencesPromise, recurringPromise, oneTimePromise] = await Promise.all([
    preloadQueryWithAuth(api.metrics.getDailyMetrics, {}),
    preloadQueryWithAuth(api.metrics.getCurrentNetWorth, {}),
    preloadQueryWithAuth(api.userPreferences.getUserPreferences, {}),
    preloadQueryWithAuth(api.recurring.getMonthlyTotals, {}),
    preloadQueryWithAuth(api.oneTime.getFutureTotals, {})
  ]);

  try {
    const [metrics, netWorth, preferences, recurring, oneTimeTotals] = await Promise.all([
      metricsPromise,
      netWorthPromise,
      preferencesPromise,
      recurringPromise,
      oneTimePromise
    ]);

    return {
      initialMetrics: metrics || [],
      initialNetWorth: netWorth || null,
      initialPreferences: preferences || null,
      initialRecurring: recurring || null,
      initialOneTimeTotals: oneTimeTotals || null
    };
  } catch (error) {
    console.error('Error preloading forecast data:', error);
    
    // Return empty data on error
    return {
      initialMetrics: [],
      initialNetWorth: null,
      initialPreferences: null,
      initialRecurring: null,
      initialOneTimeTotals: null
    };
  }
}
