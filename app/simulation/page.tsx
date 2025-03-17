import { api } from "@/convex/_generated/api";
import { preloadQueryWithAuth } from "@/lib/convex";
import SimulationView from "@/components/simulation/simulation-view";
import { Doc } from "@/convex/_generated/dataModel";

export default async function SimulationPage() {
  // Preload quotes, holdings, wallets, manual assets, and manual debts data
  const [quotes, holdings, wallets, manualAssets, manualDebts] = await Promise.all([
    preloadQueryWithAuth(api.quotes.listQuotes, {}) as Promise<Doc<"quotes">[]>,
    preloadQueryWithAuth(api.holdings.listHoldings, { filter: { includeDebts: true } }) as Promise<Doc<"holdings">[]>,
    preloadQueryWithAuth(api.wallets.listWallets, {}) as Promise<Doc<"wallets">[]>,
    preloadQueryWithAuth(api.assets.listAssets, {}) as Promise<Doc<"assets">[]>,
    preloadQueryWithAuth(api.assets.listDebts, {}) as Promise<Doc<"debts">[]>
  ]);

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-6xl mx-auto">
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-6">Portfolio Simulation</h1>
          <p className="text-gray-400 mb-8">
            Adjust the price of assets to see how it would affect your portfolio value.
          </p>
          
          <SimulationView 
            initialQuotes={quotes} 
            initialHoldings={holdings} 
            initialWallets={wallets}
            manualAssets={manualAssets}
            manualDebts={manualDebts}
          />
        </div>
      </main>
    </div>
  );
} 