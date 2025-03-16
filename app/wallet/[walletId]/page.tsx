import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import WalletDetails from "@/components/wallet/wallet-details";
import { getAuthToken } from "@/app/auth";

type Wallet = Doc<"wallets">;
type Holding = Doc<"holdings">;

export default async function WalletPage({ params }: { params: { walletId: string } }) {
  // Convert the string ID to a Convex ID
  const walletId = params.walletId as Id<"wallets">;
  
  // Get the auth token from Clerk
  const token = await getAuthToken() as string;
  
  // Preload wallet data and holdings
  const [wallet, holdings] = await Promise.all([
    (await preloadQuery(api.wallets.getWallet, { id: walletId }, { token }))._valueJSON as unknown as Wallet,
    (await preloadQuery(api.holdings.getHoldingsByWallet, { walletId }, { token }))._valueJSON as unknown as Holding[]
  ]);

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-6xl mx-auto">
        <WalletDetails wallet={wallet} holdings={holdings} />
      </main>
    </div>
  );
} 