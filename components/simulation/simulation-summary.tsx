import { formatNumber } from '@/lib/formatters';

interface SimulationSummaryProps {
  summary: {
    originalValue: number;
    adjustedValue: number;
    originalAssets: number;
    adjustedAssets: number;
    originalDebts: number;
    adjustedDebts: number;
    percentChange: number;
  };
  onReset: () => void;
}

export default function SimulationSummary({ summary, onReset }: SimulationSummaryProps) {
  const {
    originalValue,
    adjustedValue,
    originalAssets,
    adjustedAssets,
    originalDebts,
    adjustedDebts,
    percentChange
  } = summary;
  
  const isPositiveChange = percentChange >= 0;
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Portfolio Impact</h2>
        <button
          onClick={onReset}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          disabled={percentChange === 0}
        >
          Reset All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h3 className="text-gray-400 text-sm">Net Worth</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">${formatNumber(adjustedValue)}</span>
            <span className={`text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
              {isPositiveChange ? '+' : ''}{percentChange.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Original: ${formatNumber(originalValue)}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-gray-400 text-sm">Assets</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-500">${formatNumber(adjustedAssets)}</span>
            <span className={`text-sm ${adjustedAssets >= originalAssets ? 'text-green-500' : 'text-red-500'}`}>
              {adjustedAssets >= originalAssets ? '+' : ''}
              {originalAssets ? ((adjustedAssets - originalAssets) / originalAssets * 100).toFixed(2) : 0}%
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Original: ${formatNumber(originalAssets)}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-gray-400 text-sm">Debts</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-500">${formatNumber(adjustedDebts)}</span>
            <span className={`text-sm ${adjustedDebts <= originalDebts ? 'text-green-500' : 'text-red-500'}`}>
              {adjustedDebts <= originalDebts ? '-' : '+'}
              {originalDebts ? (Math.abs(adjustedDebts - originalDebts) / originalDebts * 100).toFixed(2) : 0}%
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Original: ${formatNumber(originalDebts)}
          </div>
        </div>
      </div>
    </div>
  );
} 