import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { preloadQueryWithAuth } from "@/lib/convex";
import { preloadForecastData } from "@/components/forecast/ForecastPreload";
import { ForecastClient } from "@/components/forecast/ForecastClient";
import { DailyMetric, UserPreferencesData } from "@/components/forecast/types";

type Asset = Doc<'assets'>;
type Debt = Doc<'debts'>;
type Wallet = Doc<'wallets'>;

import AssetsCard from "@/components/cards/assets-card";
import DebtsCard from "@/components/cards/debts-card";

export default async function Home() {
  // Preload all data with authentication
  const [forecastData, assetsPreload, debtsPreload, walletsPreload] = await Promise.all([
    preloadForecastData(),
    preloadQueryWithAuth<Asset[]>(api.assets.listAssets, {}),
    preloadQueryWithAuth<Debt[]>(api.debts.listDebts, {}),
    preloadQueryWithAuth<Wallet[]>(api.wallets.listWallets, {})
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="w-full">
          <ForecastClient 
            initialMetrics={forecastData.initialMetrics as DailyMetric[]} 
          initialNetWorth={forecastData.initialNetWorth as {
            netWorth: number;
            assets: number;
            debts: number;
          } | null}
          initialPreferences={forecastData.initialPreferences as UserPreferencesData | null}
          initialRecurring={forecastData.initialRecurring as { monthlyIncome: number; monthlyCost: number } | null}
          initialOneTimeTotals={forecastData.initialOneTimeTotals as { income: number; expense: number } | null}
        />
      </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          <div className="lg:col-span-2">
            <AssetsCard assets={assetsPreload || []} wallets={walletsPreload || []} />
          </div>
          <div className="lg:col-span-2">
            <DebtsCard debts={debtsPreload || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
