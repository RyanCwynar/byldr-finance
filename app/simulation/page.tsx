import { api } from "@/convex/_generated/api";
import { preloadQueryWithAuth } from "@/lib/convex";
import SimulationView from "@/components/simulation/simulation-view";
import { Doc, Id } from "@/convex/_generated/dataModel";

export default async function SimulationPage() {
  // Preload quotes, holdings, wallets, manual assets, and manual debts data
  const [quotes, holdings, wallets, manualAssets, manualDebts] = await Promise.all([
    preloadQueryWithAuth(api.quotes.listQuotes, {}) as Promise<Array<Doc<"quotes">>>,
    preloadQueryWithAuth(api.holdings.listHoldings, { filter: { includeDebts: true } }) as Promise<Array<Doc<"holdings">>>,
    preloadQueryWithAuth(api.wallets.listWallets, {}) as Promise<Array<Doc<"wallets">>>,
    preloadQueryWithAuth(api.assets.listAssets, {}) as Promise<Array<Doc<"assets">>>,
    preloadQueryWithAuth(api.debts.listDebts, {}) as Promise<Array<Doc<"debts">>>
  ]);

  return (
    <div className="min-h-screen p-4 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-6xl mx-auto">
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-6">Portfolio Simulation</h1>
          <p className="mb-8">
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
