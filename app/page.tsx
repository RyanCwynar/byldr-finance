import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

type DailyMetric = Doc<'dailyMetrics'>;
type Asset = Doc<'assets'>;
type Debt = Doc<'debts'>;
type Wallet = Doc<'wallets'>;

import ForecastWrapper from "@/components/forecast-wrapper";
import CryptoWalletsCard from "@/components/cards/crypto-wallets-card";
import AssetsCard from "@/components/cards/assets-card";
import DebtsCard from "@/components/cards/debts-card";

export default async function Home() {
  const [metricsPreload, assetsPreload, debtsPreload, walletsPreload] = await Promise.all([
    (await preloadQuery(api.metrics.getDailyMetrics))._valueJSON as unknown as DailyMetric[],
    (await preloadQuery(api.assets.listAssets))._valueJSON as unknown as Asset[],
    (await preloadQuery(api.debts.listDebts))._valueJSON as unknown as Debt[],
    (await preloadQuery(api.wallets.listWallets))._valueJSON as unknown as Wallet[]
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="w-full">
          <ForecastWrapper metrics={metricsPreload} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <AssetsCard assets={assetsPreload} />
          <DebtsCard debts={debtsPreload} />
          <CryptoWalletsCard wallets={walletsPreload} />
        </div>
      </div>
    </div>
  );
}
