'use client';

import { ForecastChartViewProps } from './types';
import NetWorthChart from '../net-worth-chart';

export function ForecastChartView({
  realMetrics,
  projectedMetrics,
  dataView,
  setDataView,
  timeframe,
  setTimeframe
}: ForecastChartViewProps) {
  const filterByTimeframe = (metrics: any[]) => {
    if (timeframe === 'all') return metrics;
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return metrics.filter(m => m.date >= cutoff);
  };

  const filteredReal = filterByTimeframe(realMetrics);
  const filteredProjected = filterByTimeframe(projectedMetrics);
  return (
    <>
      <div className="flex justify-end mb-2">
        <div className="flex rounded-lg border border-gray-700 overflow-hidden">
          <button
            onClick={() => setDataView('all')}
            className={`px-4 py-2 text-sm transition-colors cursor-pointer ${
              dataView === 'all'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-800 dark:hover:bg-gray-700'
            }`}
          >
            All Data
          </button>
          <button
            onClick={() => setDataView('real')}
            className={`px-4 py-2 text-sm transition-colors cursor-pointer ${
              dataView === 'real'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-800 dark:hover:bg-gray-700'
            }`}
          >
            Real Data
          </button>
          <button
            onClick={() => setDataView('projected')}
            className={`px-4 py-2 text-sm transition-colors cursor-pointer ${
              dataView === 'projected'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-800 dark:hover:bg-gray-700'
            }`}
          >
            Projections
          </button>
        </div>
        <select
          className="ml-2 px-3 py-2 text-sm rounded-lg border border-gray-700 bg-gray-900 text-white"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d' | 'all')}
        >
          <option value="7d">7d</option>
          <option value="30d">30d</option>
          <option value="90d">90d</option>
          <option value="all">All</option>
        </select>
      </div>
      
      {/* Display charts based on selected view */}
      {dataView === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <h3 className="text-lg font-medium mb-2">Historical Data</h3>
            <div className="w-full h-[400px]">
              <NetWorthChart metrics={filteredReal} showUncertainty={false} />
            </div>
          </div>
          
          <div className="w-full">
            <h3 className="text-lg font-medium mb-2">Projected Data</h3>
            <div className="w-full h-[400px]">
              <NetWorthChart metrics={filteredProjected} showUncertainty={true} />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[400px]">
          <NetWorthChart 
            metrics={dataView === 'real' ? filteredReal : filteredProjected}
            showUncertainty={dataView === 'projected'}
          />
        </div>
      )}
    </>
  );
} 