import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { DailyMetric } from "@/components/net-worth-chart";
import ForecastWrapper from "@/components/forecast-wrapper";

export default async function Home() {
    const [metricsPreload, assetsPreload, debtsPreload, walletsPreload] = await Promise.all([
      (await preloadQuery(api.metrics.getDailyMetrics))._valueJSON as unknown as DailyMetric[],
      (await preloadQuery(api.assets.listAssets))._valueJSON,
      (await preloadQuery(api.assets.listDebts))._valueJSON,
      (await preloadQuery(api.wallets.listWallets))._valueJSON
    ]);
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-6xl">
        <h1 className="text-3xl font-bold">Net Worth Over Time</h1>
        
        

        <div className="w-full">
          <ForecastWrapper metrics={metricsPreload} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Assets Section */}
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Assets</h2>
            <div className="space-y-3">
              {assetsPreload.map((asset: any) => (
                <div key={asset._id} className="flex justify-between items-center">
                  <span>{asset.name}</span>
                  <span className="text-green-500">${asset.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Debts Section */}
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Debts</h2>
            <div className="space-y-3">
              {debtsPreload.map((debt: any) => (
                <div key={debt._id} className="flex justify-between items-center">
                  <span>{debt.name}</span>
                  <span className="text-red-500">-${debt.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wallets Section */}
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Crypto Wallets</h2>
            <div className="space-y-3">
              {walletsPreload.wallets?.map((wallet: any) => (
                <div key={wallet._id} className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span>{wallet.name}</span>
                    <span className="text-xs text-gray-400">{wallet.chainType}</span>
                  </div>
                  <span>${wallet.value?.toLocaleString() || '0'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

       
      </main>
      <footer>
      </footer>
    </div>
  );
}
