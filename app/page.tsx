import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Byldr Finance - Forecast your financial life",
  description:
    "Learn how Byldr Finance helps you plan your crypto and personal finances with accurate tracking and forecasting.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 text-center">
          <span className="text-blue-600">Forecast</span> Your Financial <span className="text-blue-600 italic">Life</span>
        </h1>
        <p className="text-gray-400 text-lg sm:text-2xl text-center max-w-2xl">
          Byldr Finance helps you track the real value of your wallets and plan ahead with powerful forecasting tools.
        </p>
        <ul className="list-none pl-0 space-y-4 text-left self-start">
          <li className="flex items-start">
            <span className="mr-2">🪙</span>
            <span>Accurately represent unusual tokens like Aave debt tokens.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🔮</span>
            <span>
              Forecast your portfolio by entering future prices in the simulation tab.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">📅</span>
            <span>Plug in recurring income and expenses on any schedule.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">📊</span>
            <span>
              See the daily, weekly, monthly and yearly impact of every expense.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🏷️</span>
            <span>
              Tag and filter expenses to quickly separate controllable and fixed costs.
            </span>
          </li>
        </ul>
        <Link
          href="/sign-in"
          className="mt-8 inline-block rounded-md bg-blue-600 px-6 py-3 text-lg font-medium text-white shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Start for free
        </Link>
        <p className="text-gray-400 text-sm mt-2">
          Sign in now—it’s completely free while we’re in beta.
        </p>
      </main>
    </div>
  );
}
