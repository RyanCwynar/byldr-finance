import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { preloadQueryWithAuth } from '@/lib/convex';
import OneTimePageClient from '@/components/oneTime/OneTimePageClient';

export default async function OneTimePage() {
  const initialData = await preloadQueryWithAuth<Doc<'oneTimeTransactions'>[]>(
    api.oneTime.listOneTimeTransactions,
    {}
  );
  const initialTags = await preloadQueryWithAuth<string[]>(
    api.oneTime.listOneTimeTags,
    {}
  );
  return (
    <div className="container mx-auto px-4 py-8">
      <OneTimePageClient initialData={initialData || []} initialTags={initialTags || []} />
    </div>
  );
}
