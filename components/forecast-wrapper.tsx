'use client';

import ForecastWrapper from './forecast/ForecastWrapper';
import { DailyMetric } from './forecast/types';

export default function LegacyForecastWrapper({ metrics }: { metrics: DailyMetric[] }) {
  return <ForecastWrapper metrics={metrics} />;
}