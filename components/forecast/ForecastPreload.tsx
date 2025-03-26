import { preloadQueryWithAuth } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { DailyMetric } from './types';
import { ForecastClient } from './ForecastClient';

export default async function ForecastPreload({ metrics: initialMetrics }: { metrics: DailyMetric[] }) {
  // Preload net worth data
  type NetWorthData = {
    netWorth: number;
    assets: number;
    debts: number;
  } | null;
  
  const initialNetWorth = await preloadQueryWithAuth<NetWorthData>(
    api.metrics.getCurrentNetWorth, 
    {}
  );
  
  return (
    <ForecastClient 
      initialMetrics={initialMetrics}
      initialNetWorth={initialNetWorth}
    />
  );
} 