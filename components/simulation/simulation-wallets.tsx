import { Doc } from "@/convex/_generated/dataModel";
import { formatNumber } from '@/lib/formatters';

interface AdjustedWallet extends Doc<"wallets"> {
  originalValue: number;
  adjustedValue: number;
  adjustedAssets: number;
  adjustedDebts: number;
  percentChange: number;
}

interface SimulationWalletsProps {
  wallets: AdjustedWallet[];
}

export default function SimulationWallets({ wallets }: SimulationWalletsProps) {
  // Sort wallets by adjusted value (descending)
  const sortedWallets = [...wallets].sort((a, b) => b.adjustedValue - a.adjustedValue);
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Wallet Impact</h2>
      
      {sortedWallets.length === 0 ? (
        <p className=" text-center py-4">No wallets found.</p>
      ) : (
        <div className="space-y-4">
          {sortedWallets.map(wallet => (
            <div key={wallet._id} className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{wallet.name}</h3>
                <span className={`text-sm ${wallet.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {wallet.percentChange >= 0 ? '+' : ''}{wallet.percentChange.toFixed(2)}%
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs">Original Value</div>
                  <div className="font-medium">${formatNumber(wallet.originalValue)}</div>
                </div>
                <div>
                  <div className="text-xs">Adjusted Value</div>
                  <div className="font-medium">${formatNumber(wallet.adjustedValue)}</div>
                </div>
                <div>
                  <div className="text-xs">Assets</div>
                  <div className="font-medium text-green-500">${formatNumber(wallet.adjustedAssets)}</div>
                </div>
                <div>
                  <div className="text-xs">Debts</div>
                  <div className="font-medium text-red-500">${formatNumber(wallet.adjustedDebts)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 