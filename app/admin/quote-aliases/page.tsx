import { currentUser } from '@clerk/nextjs/server';
import QuoteAliasManager from '@/components/admin/quote-alias-manager';

export default async function QuoteAliasesPage() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (email !== 'rtcx86@gmail.com') {
    return <div className="p-8">Not authorized</div>;
  }

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <h1 className="text-3xl font-bold mb-6">Quote Aliases</h1>
      <p className="text-gray-400 mb-8">Map symbols to other quotes or fixed prices.</p>
      <QuoteAliasManager />
    </div>
  );
}
