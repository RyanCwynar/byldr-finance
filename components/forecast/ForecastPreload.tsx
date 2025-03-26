import { preloadQueryWithAuth } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { DailyMetric, UserPreferencesData } from './types';
import { ForecastClient } from './ForecastClient';

interface ForecastPreloadProps {
  initialMetrics: DailyMetric[];
  initialNetWorth: {
    netWorth: number;
    assets: number;
    debts: number;
  } | null;
}

// This component handles server-side data loading
export function ForecastPreload({ 
  initialMetrics, 
  initialNetWorth 
}: ForecastPreloadProps) {
  // We will handle user preferences on the client-side via useQuery
  // This ensures we always have the latest preferences
  return (
    <ForecastClient 
      initialMetrics={initialMetrics} 
      initialNetWorth={initialNetWorth} 
      initialPreferences={null}
    />
  );
}

// Preload query for forecasting data on the server
export async function preloadForecastData() {
  // Preload both metrics and current net worth in parallel
  const [metricsPromise, netWorthPromise, preferencesPromise] = await Promise.all([
    preloadQueryWithAuth(api.metrics.getDailyMetrics, {}),
    preloadQueryWithAuth(api.metrics.getCurrentNetWorth, {}),
    preloadQueryWithAuth(api.userPreferences.getUserPreferences, {})
  ]);

  try {
    const [metrics, netWorth, preferences] = await Promise.all([
      metricsPromise,
      netWorthPromise,
      preferencesPromise
    ]);

    return {
      initialMetrics: metrics || [],
      initialNetWorth: netWorth || null,
      initialPreferences: preferences || null
    };
  } catch (error) {
    console.error('Error preloading forecast data:', error);
    
    // Return empty data on error
    return {
      initialMetrics: [],
      initialNetWorth: null,
      initialPreferences: null
    };
  }
} 