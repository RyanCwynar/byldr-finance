import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { preloadQueryWithAuth } from '@/lib/convex';
import RecurringPageClient from '@/components/recurring/RecurringPageClient';

export default async function RecurringPage() {
  const initialData = await preloadQueryWithAuth<Doc<'recurringTransactions'>[]>(
    api.recurring.listRecurringTransactions,
    {}
  );
  return (
    <div className="container mx-auto px-4 py-8">
      <RecurringPageClient initialData={initialData || []} />
    </div>
  );
}
