import { api } from "@/convex/_generated/api";
import { preloadQueryWithAuth } from "@/lib/convex";
import { Doc } from "@/convex/_generated/dataModel";
import DebtOverviewClient from "@/components/debt/debt-overview-client";

export default async function DebtOverviewPage() {
  const [metrics, debts, wallets] = await Promise.all([
    preloadQueryWithAuth<Doc<'dailyMetrics'>[]>(api.metrics.getDailyMetrics, {}),
    preloadQueryWithAuth<Doc<'debts'>[]>(api.debts.listDebts, {}),
    preloadQueryWithAuth<Doc<'wallets'>[]>(api.wallets.listWallets, {})
  ]);

  const manualTotal = (debts || []).reduce((sum, d) => sum + d.value, 0);
  const walletTotal = (wallets || []).reduce((sum, w) => sum + (w.debts || 0), 0);

  const history = (metrics || []).map(m => ({ timestamp: m.date, value: m.debts }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Debt Overview</h1>
      <DebtOverviewClient
        history={history}
        manualTotal={manualTotal}
        walletTotal={walletTotal}
      />
    </div>
  );
}
