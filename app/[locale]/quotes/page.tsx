import { api } from '@/convex/_generated/api';
import { preloadQueryWithAuth } from '@/lib/convex';
import QuotesManager from '@/components/quotes/quotes-manager';
import { Doc } from '@/convex/_generated/dataModel';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/lib/i18n-config';

export default async function QuotesPage({ params }: { params: { locale: Locale } }) {
  const dict = await getDictionary(params.locale);
  const quotes = await (await preloadQueryWithAuth(api.quotes.listQuotes, {})) as Array<Doc<'quotes'>>;

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-6xl mx-auto">
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-6">{dict.header.quotes} Management</h1>
          <p className="text-gray-400 mb-8">
            Manage which quotes appear in the ticker and are updated automatically.
          </p>

          <QuotesManager initialQuotes={quotes} />
        </div>
      </main>
    </div>
  );
}
