import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { preloadQueryWithAuth } from '@/lib/convex';
import { preloadForecastData } from '@/components/forecast/ForecastPreload';
import { ForecastClient } from '@/components/forecast/ForecastClient';
import { DailyMetric, UserPreferencesData } from '@/components/forecast/types';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/lib/i18n-config';

import WalletsCard from '@/components/cards/wallets-card';
import AssetsCard from '@/components/cards/assets-card';
import DebtsCard from '@/components/cards/debts-card';

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  // Preload all data with authentication
  const [forecastData, assetsPreload, debtsPreload, walletsPreload] = await Promise.all([
    preloadForecastData(),
    preloadQueryWithAuth<Doc<'assets'>[]>(api.assets.listAssets, {}),
    preloadQueryWithAuth<Doc<'debts'>[]>(api.debts.listDebts, {}),
    preloadQueryWithAuth<Doc<'wallets'>[]>(api.wallets.listWallets, {}),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">{dict.dashboard}</h1>

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
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <WalletsCard wallets={walletsPreload || []} />
          <AssetsCard assets={assetsPreload || []} />
          <DebtsCard debts={debtsPreload || []} />
        </div>
      </div>
    </div>
  );
}
