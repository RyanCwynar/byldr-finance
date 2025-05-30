'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface CostData { tag: string; amount: number }

interface Props { data: CostData[] }

export default function MonthlyCostPieChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-center">No expense data.</p>;
  }
  const COLORS = ['#f87171','#fb923c','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#facc15'];
  const chartData = data.map(d => ({ name: d.tag, value: d.amount }));
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={120} label={({name, percent}) => `${name}: ${(percent*100).toFixed(0)}%`}>
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatCurrency(v as number)} />
        <Legend layout="vertical" />
      </PieChart>
    </ResponsiveContainer>
  );
}
