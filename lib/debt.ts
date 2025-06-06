export interface DebtHistoryPoint {
  timestamp: number;
  value: number;
}

export interface DebtChangeRates {
  weeklyChange: number | null;
  monthlyChange: number | null;
}

/**
 * Calculate average change per week and per month for a debt's value history.
 * Returns null for a rate if there isn't enough time span between
 * the first and last data points (7 days for weekly, 30 days for monthly).
*/
import { getLinearRegression } from "recharts/lib/util/DataUtils";

export function calculateChangeRates(history: DebtHistoryPoint[]): DebtChangeRates {
  if (!history || history.length < 2) {
    return { weeklyChange: null, monthlyChange: null };
  }

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const latest = sorted[sorted.length - 1];

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

  const weekStart = latest.timestamp - WEEK_MS;
  const monthStart = latest.timestamp - MONTH_MS;

  const weekHistory = sorted.filter((p) => p.timestamp >= weekStart);
  const monthHistory = sorted.filter((p) => p.timestamp >= monthStart);

  const computeRate = (
    points: DebtHistoryPoint[],
    periodMs: number
  ): number | null => {
    if (points.length < 2) return null;
    const first = points[0];
    const last = points[points.length - 1];
    const diffMs = last.timestamp - first.timestamp;
    if (diffMs === 0) return null;
    const data = points.map((p) => ({ cx: p.timestamp, cy: p.value }));
    const lr = getLinearRegression(data);
    if (!lr) return null;
    return lr.a * periodMs;
  };

  const weeklyChange = computeRate(weekHistory, WEEK_MS);
  const monthlyChange = computeRate(monthHistory, MONTH_MS);

  return { weeklyChange, monthlyChange };
}
