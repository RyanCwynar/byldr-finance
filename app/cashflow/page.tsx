import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { preloadQueryWithAuth } from '@/lib/convex';
import CashflowPageClient from '@/components/cashflow/CashflowPageClient';

export default async function TransactionsPage() {
  const [recurringData, recurringTags, oneTimeData, oneTimeTags] = await Promise.all([
    preloadQueryWithAuth<Doc<'recurringTransactions'>[]>(api.recurring.listRecurringTransactions, {}),
    preloadQueryWithAuth<string[]>(api.recurring.listRecurringTags, {}),
    preloadQueryWithAuth<Doc<'oneTimeTransactions'>[]>(api.oneTime.listOneTimeTransactions, {}),
    preloadQueryWithAuth<string[]>(api.oneTime.listOneTimeTags, {}),
  ]);
  return (
    <div className="container mx-auto px-4 py-8">
      <CashflowPageClient
        initialRecurring={recurringData || []}
        initialRecurringTags={recurringTags || []}
        initialOneTime={oneTimeData || []}
        initialOneTimeTags={oneTimeTags || []}
      />
    </div>
  );
}
