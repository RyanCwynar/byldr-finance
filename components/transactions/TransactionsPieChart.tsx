'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface DataItem {
  label: string;
  amount: number;
}

interface Props {
  data: DataItem[];
}

export default function TransactionsPieChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <p className=" text-center">No transaction data.</p>;
  }
  const COLORS = ['#f87171','#fb923c','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#facc15','#4ade80','#fca5a5'];
  const chartData = data.map(d => ({ name: d.label, value: Math.abs(d.amount) }));
  return (
    <ResponsiveContainer width="100%" height={480}>
      <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={144}
        >
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatCurrency(v as number)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
