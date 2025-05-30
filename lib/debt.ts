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
export function calculateChangeRates(history: DebtHistoryPoint[]): DebtChangeRates {
  if (!history || history.length < 2) {
    return { weeklyChange: null, monthlyChange: null };
  }

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const last = sorted[sorted.length - 1];

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

  function calc(windowMs: number): number | null {
    const startTime = last.timestamp - windowMs;
    const points = sorted.filter((p) => p.timestamp >= startTime);
    if (points.length < 2) return null;
    const first = points[0];
    const diffValue = last.value - first.value;
    const diffMs = last.timestamp - first.timestamp;
    if (diffMs < windowMs) return null;
    return diffValue / (diffMs / windowMs);
  }

  const weeklyChange = calc(WEEK_MS);
  const monthlyChange = calc(MONTH_MS);

  return { weeklyChange, monthlyChange };
}
