'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Doc } from '@/convex/_generated/dataModel';
import { formatCompactNumber, formatCurrency } from '@/lib/formatters';
import { useMemo } from 'react';

export type DebtHistoryEntry = Doc<'debtHistory'>;

interface DebtHistoryChartProps {
  history: DebtHistoryEntry[];
}

export default function DebtHistoryChart({ history }: DebtHistoryChartProps) {
  if (!history || history.length === 0) {
    return <div className="text-center text-gray-400">No history available</div>;
  }

  const data = history
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(h => ({
      timestamp: h.timestamp,
      value: h.value,
    }));

  const { xDomain, yDomain } = useMemo(() => {
    const timestamps = data.map(d => d.timestamp);
    const values = data.map(d => d.value);
    const minT = Math.min(...timestamps);
    const maxT = Math.max(...timestamps);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);

    const xPadding = (maxT - minT) * 0.05 || 86400000; // 1 day default
    const yPadding = (maxV - minV) * 0.1 || 1;

    return {
      xDomain: [minT - xPadding, maxT + xPadding],
      yDomain: [minV - yPadding, maxV + yPadding]
    };
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={xDomain}
          tickFormatter={(ts) => new Date(ts as number).toLocaleDateString()}
        />
        <YAxis domain={yDomain} tickFormatter={(v) => formatCompactNumber(v as number)} />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          labelFormatter={(ts) => new Date(ts as number).toLocaleString()}
        />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
