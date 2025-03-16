import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import WalletDetails from "@/components/wallet/wallet-details";
import { preloadQueryWithAuth } from "@/lib/convex";

type Wallet = Doc<"wallets">;
type Holding = Doc<"holdings">;

export default async function WalletPage({ params }: { params: { walletId: string } }) {
  // Convert the string ID to a Convex ID
  const walletId = params.walletId as Id<"wallets">;
  
  // Preload wallet data and holdings with authentication
  const [wallet, holdings] = await Promise.all([
    preloadQueryWithAuth<Wallet>(api.wallets.getWallet, { id: walletId }),
    preloadQueryWithAuth<Holding[]>(api.holdings.getHoldingsByWallet, { walletId })
  ]);

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-6xl mx-auto">
        <WalletDetails wallet={wallet} holdings={holdings} />
      </main>
    </div>
  );
} 