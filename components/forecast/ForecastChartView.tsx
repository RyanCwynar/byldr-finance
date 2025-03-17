'use client';

import { ForecastChartViewProps } from './types';
import NetWorthChart from '../net-worth-chart';

export function ForecastChartView({ 
  realMetrics, 
  projectedMetrics, 
  dataView, 
  setDataView 
}: ForecastChartViewProps) {
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
      </div>
      
      {/* Display charts based on selected view */}
      {dataView === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <h3 className="text-lg font-medium mb-2">Historical Data</h3>
            <div className="w-full h-[400px]">
              <NetWorthChart metrics={realMetrics} showUncertainty={false} />
            </div>
          </div>
          
          <div className="w-full">
            <h3 className="text-lg font-medium mb-2">Projected Data</h3>
            <div className="w-full h-[400px]">
              <NetWorthChart metrics={projectedMetrics} showUncertainty={true} />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[400px]">
          <NetWorthChart 
            metrics={dataView === 'real' ? realMetrics : projectedMetrics} 
            showUncertainty={dataView === 'projected'}
          />
        </div>
      )}
    </>
  );
} 