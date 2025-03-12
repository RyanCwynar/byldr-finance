'use client';

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export interface DailyMetric {
  date: number;
  netWorth: number;
  prices: {
    ethereum: number;
    bitcoin: number;
    solana: number;
    avalanche: number;
  };
  metadata?: {
    dataSource: string;
    lastUpdated: number;
  };
}

interface NetWorthChartProps {
  metrics: DailyMetric[];
}

export default function NetWorthChart({ metrics }: NetWorthChartProps) {
  const chartData = useMemo(() => {
    if (!metrics) return [];

    return metrics.map(m => ({
      date: new Date(m.date).toLocaleDateString(),
      netWorth: m.netWorth
    }));
  }, [metrics]);

  if (!chartData.length) {
    return <div>Loading...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis 
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip 
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Worth']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="netWorth"
          name="Net Worth"
          stroke="#4ade80"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}


