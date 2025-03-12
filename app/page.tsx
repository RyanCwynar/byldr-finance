import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { DailyMetric } from "@/components/NetWorthChart";
import ForecastWrapper from "@/components/forecast-wrapper";

export default async function Home() {
    const preloaded = await preloadQuery(api.metrics.getDailyMetrics);
    const metricsPreload = preloaded._valueJSON as unknown as DailyMetric[];
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-6xl">
        <h1 className="text-3xl font-bold">Net Worth Over Time</h1>
        
        

        <div className="w-full h-[400px]">
          <ForecastWrapper metrics={metricsPreload} />
        </div>

       
      </main>
      <footer>
      </footer>
    </div>
  );
}
