import '@/app/globals.css';
import ConvexClientProvider from './ConvexProvider';
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/header';
import UserTracker from '@/components/user-tracker';
import { TranslationsProvider } from '@/components/TranslationsProvider';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/lib/i18n-config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Byldr Finance',
  description: 'Track your net worth and financial assets.',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(params.locale);
  return (
    <ClerkProvider>
      <html lang={params.locale}>
        <body className="min-h-screen antialiased bg-black text-white">
          <ConvexClientProvider>
            <UserTracker />
            <TranslationsProvider dictionary={dictionary}>
              <Header />
              <main className="flex-1">{children}</main>
            </TranslationsProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
