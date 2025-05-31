import "@/app/globals.css";

import ConvexClientProvider from "./ConvexProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Header from "@/components/header";
import UserTracker from "@/components/user-tracker";

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
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body className="min-h-screen antialiased bg-black text-white">
          <ConvexClientProvider>
            <UserTracker />
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
} 