'use client';
import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/formatters';

interface InterestEstimateProps {
  assets: number;
}

export default function InterestEstimate({ assets }: InterestEstimateProps) {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('https://yields.llama.fi/pools');
        const data = await res.json();
        const pools = data.data || data;
        const pool = pools.find((p: any) => {
          const project = (p.project || '').toLowerCase();
          return (project.includes('aave') &&
            (p.chain || '').toLowerCase() === 'ethereum' &&
            (p.symbol || '').toUpperCase() === 'USDC');
        });
        if (pool && typeof pool.apyBase === 'number') {
          setRate(pool.apyBase);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch Aave rate', err);
      }
      setRate(4);
    }
    fetchRate();
  }, []);

  const displayedRate = rate ?? 4;
  const yearly = assets * (displayedRate / 100);
  const monthly = yearly / 12;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
      <h3 className="text-lg font-medium mb-1">Interest Estimate</h3>
      <p className="text-sm text-gray-400 mb-2">
        Supply APY from Aave USDC (Ethereum): {displayedRate.toFixed(2)}%
      </p>
      <div className="text-sm space-y-1">
        <div>
          Monthly:&nbsp;
          <span className="text-green-500">
            ${formatNumber(monthly)}
          </span>
        </div>
        <div>
          Yearly:&nbsp;
          <span className="text-green-500">
            ${formatNumber(yearly)}
          </span>
        </div>
      </div>
    </div>
  );
}
