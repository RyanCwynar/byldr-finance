import { api } from '@/convex/_generated/api';
import { preloadQueryWithAuth } from '@/lib/convex';
import MonthlyCostPieChart from '@/components/costs/MonthlyCostPieChart';

export default async function CostsPage() {
  const data = await preloadQueryWithAuth<{ label: string; amount: number }[]>(
    api.costs.monthlyCostBreakdown,
    {}
  );
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Monthly Cost Breakdown</h1>
      <div className="w-full">
        <MonthlyCostPieChart data={data || []} />
      </div>
    </div>
  );
}
