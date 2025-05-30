'use client';

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

  const data = history
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(h => ({
      timestamp: h.timestamp,
      value: h.value,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          tickFormatter={(ts) => new Date(ts as number).toLocaleDateString()}
        />
        <YAxis tickFormatter={(v) => formatCurrency(v as number)} />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          labelFormatter={(ts) => new Date(ts as number).toLocaleString()}
        />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
