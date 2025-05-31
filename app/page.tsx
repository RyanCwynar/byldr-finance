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
        <h1 className="text-4xl font-bold mb-6 text-center">
          Forecast your financial life
        </h1>
        <p className="text-gray-400 text-center max-w-2xl">
          Byldr Finance helps you track the real value of your wallets and plan ahead with powerful forecasting tools.
        </p>
        <ul className="list-disc pl-6 space-y-4 text-left self-start">
          <li>Accurately represent unusual tokens like Aave debt tokens.</li>
          <li>
            Forecast your portfolio by entering future prices in the simulation tab.
          </li>
          <li>Plug in recurring income and expenses on any schedule.</li>
          <li>
            See the daily, weekly, monthly and yearly impact of every expense.
          </li>
          <li>
            Tag and filter expenses to quickly separate controllable and fixed costs.
          </li>
        </ul>
        <Link
          href="/sign-in"
          className="mt-8 text-blue-400 underline hover:text-blue-300"
        >
          Sign in to get started
        </Link>
      </main>
    </div>
  );
}
