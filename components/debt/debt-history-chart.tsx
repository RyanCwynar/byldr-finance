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
    return <div className="text-center">No history available</div>;
  }

  const data = history
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(h => ({
      ...h,
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
          contentStyle={{
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            color: '#f3f4f6',
            borderRadius: '0.375rem',
            boxShadow:
              '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
          }}
          itemStyle={{ color: '#f3f4f6' }}
          labelStyle={{ color: '#d1d5db' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          dot
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
