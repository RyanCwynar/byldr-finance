import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import DashboardPage from "./dashboard/page";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Byldr Finance - Forecast your financial life",
  description:
    "Learn how Byldr Finance helps you plan your crypto and personal finances with accurate tracking and forecasting.",
};

export default async function RootPage() {
  const { userId } = await auth();

  if (userId) {
    return <DashboardPage />;
  }

  return <LandingPage />;
}
