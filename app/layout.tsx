import "@/app/globals.css";

import ConvexClientProvider from "./ConvexProvider";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/header";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mastermind Finance",
  description: "Track your net worth and financial assets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased bg-black text-white">
          <ConvexClientProvider>
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