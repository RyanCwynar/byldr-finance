'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

type Wallet = Doc<"wallets">;

interface CryptoAccountsCardProps {
  wallets: Wallet[];
}

export default function CryptoAccountsCard({ wallets: initialWallets }: CryptoAccountsCardProps) {
  const wallets = useQuery(api.wallets.listWallets) ?? initialWallets;

  return (
    <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4">Crypto Wallets</h2>
      <div className="space-y-4">
        {wallets?.map((wallet: Wallet) => (
          <div key={wallet._id} className="flex flex-col gap-2 p-3 rounded-lg bg-white/5">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-medium">{wallet.name}</span>
                <span className="text-xs text-gray-400">{wallet.chainType}</span>
              </div>
              <span className={`font-medium ${wallet.value && wallet.value > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                ${(wallet.value || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Assets:</span>
                <span className="text-green-500">
                  ${(wallet.assets || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Debts:</span>
                <span className="text-red-500">
                  ${(wallet.debts || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}