'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Doc } from '@/convex/_generated/dataModel';
import { formatCurrency } from '@/lib/formatters';

export type DebtHistoryEntry = Doc<'debtHistory'>;

interface DebtHistoryChartProps {
  history: DebtHistoryEntry[];
}

export default function DebtHistoryChart({ history }: DebtHistoryChartProps) {
  if (!history || history.length === 0) {
    return <div className="text-center text-gray-400">No history available</div>;
  }

  const { data, xDomain, yDomain } = useMemo(() => {
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const data = sorted.map(h => ({ timestamp: h.timestamp, value: h.value }));

    const timestamps = data.map(d => d.timestamp);
    const values = data.map(d => d.value);

    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const timeRange = Math.max(maxTs - minTs, 24 * 60 * 60 * 1000); // at least 1 day
    const xPadding = timeRange * 0.05;
    const xDomain: [number, number] = [minTs - xPadding, maxTs + xPadding];

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valueRange = Math.max(maxVal - minVal, 1);
    const yPadding = valueRange * 0.1;
    const yDomain: [number, number] = [minVal - yPadding, maxVal + yPadding];

    return { data, xDomain, yDomain };
  }, [history]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={xDomain}
          tickFormatter={(ts) => new Date(ts as number).toLocaleDateString()}
        />
        <YAxis
          domain={yDomain}
          tickFormatter={(v) => formatCurrency(v as number)}
        />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          labelFormatter={(ts) => new Date(ts as number).toLocaleString()}
        />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
