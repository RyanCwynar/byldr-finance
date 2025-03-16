import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import WalletDetails from "@/components/wallet/wallet-details";
import { preloadQueryWithAuth } from "@/lib/convex";

type Wallet = Doc<"wallets">;
type Holding = Doc<"holdings">;

export default async function WalletPage({
  params,
}: {
  params: Promise<{ walletId: string }>;
}) {
  // Get the walletId from params Promise
  const { walletId } = await params;
  
  // Convert the string ID to a Convex ID
  const walletIdObj = walletId as Id<"wallets">;
  
  // Preload wallet data and holdings with authentication
  const [wallet, holdings] = await Promise.all([
    preloadQueryWithAuth<Wallet>(api.wallets.getWallet, { id: walletIdObj }),
    preloadQueryWithAuth<Holding[]>(api.holdings.getHoldingsByWallet, { walletId: walletIdObj })
  ]);

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-6xl mx-auto">
        <WalletDetails wallet={wallet} holdings={holdings} />
      </main>
    </div>
  );
} 