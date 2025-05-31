import "@/app/globals.css";

import ConvexClientProvider from "./ConvexProvider";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/header";
import UserTracker from "@/components/user-tracker";
import { ThemeProvider } from "@/lib/theme-context";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Byldr Finance",
  description:
    "Plan and forecast your finances across crypto and traditional assets. Track unusual tokens, simulate future prices and break down spending.",
  keywords: [
    "crypto",
    "finance",
    "budgeting",
    "forecasting",
    "net worth",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased bg-white text-black dark:bg-black dark:text-white">
          <ThemeProvider>
            <ConvexClientProvider>
              <UserTracker />
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
} 