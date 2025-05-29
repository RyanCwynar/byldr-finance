'use client';

import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area
} from 'recharts';

import { Doc } from "@/convex/_generated/dataModel";
import { formatCurrency } from '@/lib/formatters';

type DailyMetric = Doc<'dailyMetrics'> & {
  isProjected?: boolean;
};

interface NetWorthChartProps {
  metrics: DailyMetric[];
  showUncertainty?: boolean;
}

// Empty state component to display when no data is available
function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full border border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm text-gray-500">No chart data available</p>
    </div>
  );
}

export default function NetWorthChart({ metrics, showUncertainty = true }: NetWorthChartProps) {
  const [uncertaintyPercent, setUncertaintyPercent] = useState(10);
  const [showMovingAverage, setShowMovingAverage] = useState(false);

  const { chartData, yAxisDomain, firstProjectedIndex } = useMemo(() => {
    if (!metrics || !metrics.length) return { chartData: [], yAxisDomain: [0, 0], firstProjectedIndex: -1 };

    const sortedMetrics = metrics.sort((a, b) => a.date - b.date);
    
    // Find the index where projections start
    const firstProjectedIndex = sortedMetrics.findIndex(m => m.isProjected);
    const lastRealPoint = firstProjectedIndex >= 0 ? 
      sortedMetrics[firstProjectedIndex - 1] : 
      sortedMetrics[sortedMetrics.length - 1];

    const lastRealDate = sortedMetrics[sortedMetrics.length - 1].date;
    const lastRealValue = sortedMetrics[sortedMetrics.length - 1].netWorth;

    console.log('Initial setup:', {
      totalPoints: sortedMetrics.length,
      lastRealDate: new Date(lastRealDate).toISOString(),
      lastRealValue,
      uncertaintyPercent
    });

    // Validation
    console.assert(lastRealValue > 0, 'Last real value should be positive');
    console.assert(uncertaintyPercent >= 0 && uncertaintyPercent <= 50, 'Uncertainty should be between 0 and 50');

    let minValue = Infinity;
    let maxValue = -Infinity;
    let projectionCount = 0;

    // Calculate moving average using a 30-day window
    const MA_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
    let windowStart = 0;
    let windowSum = 0;

    const data = sortedMetrics.map((m, index) => {
      const isProjection = m.isProjected === true;

      let upperProjection = m.netWorth;
      let lowerProjection = m.netWorth;

      if (isProjection && showUncertainty) {
        projectionCount++;
        const daysFromLastReal = (m.date - lastRealPoint.date) / (24 * 60 * 60 * 1000);
        const monthsFromLastReal = daysFromLastReal / 30;
        
        // Base projection is the actual projected net worth from ForecastWrapper
        const baseProjection = m.netWorth;
        
        // Calculate how much total change is projected
        const totalChange = baseProjection - lastRealPoint.netWorth;
        
        // Apply uncertainty to the change amount, not the total value
        const uncertaintyAmount = totalChange * (uncertaintyPercent / 100);
        
        // Create upper and lower bounds by adding/subtracting the uncertainty
        upperProjection = baseProjection + uncertaintyAmount;
        lowerProjection = baseProjection - uncertaintyAmount;

        console.log(`Projection point ${projectionCount}:`, {
          date: new Date(m.date).toISOString(),
          monthsFromLastReal,
          baseProjection,
          totalChange,
          uncertaintyAmount,
          upperProjection,
          lowerProjection,
          difference: upperProjection - lowerProjection
        });

        // Assertions for projection values
        console.assert(daysFromLastReal > 0, 'Days from last real should be positive');
        console.assert(upperProjection > lowerProjection, 'Upper projection should be higher than lower');
        console.assert(
          Math.abs(upperProjection - baseProjection) === Math.abs(lowerProjection - baseProjection),
          'Projections should be symmetrical around base projection'
        );
      }

      // Update moving average window
      while (sortedMetrics[windowStart].date < m.date - MA_WINDOW_MS) {
        windowSum -= sortedMetrics[windowStart].netWorth;
        windowStart++;
      }
      windowSum += m.netWorth;
      const windowSize = index - windowStart + 1;
      const movingAverage = windowSum / windowSize;

      minValue = Math.min(minValue, lowerProjection, movingAverage);
      maxValue = Math.max(maxValue, upperProjection, movingAverage);

      return {
        timestamp: m.date,
        date: new Date(m.date).toLocaleDateString(),
        netWorth: m.netWorth,
        upperProjection,
        lowerProjection,
        movingAverage,
        isProjection
      };
    });

    // Summary logging
    console.log('Projection summary:', {
      totalPoints: data.length,
      projectionPoints: projectionCount,
      valueRanges: {
        min: minValue,
        max: maxValue,
        spread: maxValue - minValue
      }
    });

    // Verify we have some projections
    console.assert(projectionCount > 0 || !showUncertainty, 'Should have at least one projection point when showing uncertainty');
    console.assert(maxValue > minValue, 'Should have different max and min values');

    // Calculate Y-axis domain with padding
    const valueRange = maxValue - minValue;
    const yMin = Math.floor(minValue - (valueRange * 0.1));
    const yMax = Math.ceil(maxValue + (valueRange * 0.1));

    const roundToNearestThousand = (num: number) => 
      Math.round(num / 1000) * 1000;

    const domain = [
      roundToNearestThousand(Math.max(0, yMin)),
      roundToNearestThousand(yMax)
    ];

    // Final validation
    console.log('Y-axis domain:', {
      raw: [yMin, yMax],
      rounded: domain,
      padding: valueRange * 0.1
    });

    return {
      chartData: data,
      yAxisDomain: domain,
      firstProjectedIndex
    };
  }, [metrics, uncertaintyPercent, showUncertainty]);

  // Add logging when uncertainty changes
  useEffect(() => {
    console.log('Uncertainty changed:', uncertaintyPercent);
  }, [uncertaintyPercent]);

  if (!chartData.length) {
    return <EmptyChartState />;
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {showUncertainty && (
        <div className="flex items-center gap-2">
          <span>Uncertainty Range: ±{uncertaintyPercent}%</span>
          <input
            type="range"
            min="0"
            max="50"
            value={uncertaintyPercent}
            onChange={(e) => setUncertaintyPercent(Number(e.target.value))}
            className="w-48"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showMovingAverage"
          checked={showMovingAverage}
          onChange={(e) => setShowMovingAverage(e.target.checked)}
          className="mr-1 h-4 w-4"
        />
        <label htmlFor="showMovingAverage" className="text-sm">
          Show 30d Moving Avg
        </label>
      </div>

      <ResponsiveContainer width="100%" height={showUncertainty ? "90%" : "100%"}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp"
            scale="time"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
          />
          <YAxis
            domain={yAxisDomain}
            tickFormatter={(value) => formatCurrency(value)}
            tickCount={8} // Suggest number of ticks
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              const label = {
                netWorth: 'Net Worth',
                upperProjection: 'Optimistic Projection',
                lowerProjection: 'Pessimistic Projection'
              }[name] || name;
              return [formatCurrency(value), label];
            }}
            labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
            contentStyle={{ 
              backgroundColor: '#1f2937', // Dark gray background
              borderColor: '#374151', // Darker border
              color: '#f3f4f6', // Light text
              borderRadius: '0.375rem', // Rounded corners
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            itemStyle={{ color: '#f3f4f6' }} // Light text for items
            labelStyle={{ color: '#d1d5db' }} // Slightly darker text for label
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '10px',
              color: '#f3f4f6' // Light text
            }}
          />
          
          {/* Upper projection line - only show for projected points and when showUncertainty is true */}
          {showUncertainty && (
            <Line
              type="monotone"
              dataKey="upperProjection"
              name="Optimistic Projection"
              stroke="#22c55e"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={true}
              data={chartData.map((point, index) => ({
                ...point,
                upperProjection: index >= firstProjectedIndex ? point.upperProjection : null
              }))}
            />
          )}
          
          {/* Main line */}
          <Line
            type="monotone"
            dataKey="netWorth"
            name="Net Worth"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />

          {showMovingAverage && (
            <Line
              type="monotone"
              dataKey="movingAverage"
              name="30d Moving Avg"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          )}

          {/* Lower projection line - only show for projected points and when showUncertainty is true */}
          {showUncertainty && (
            <Line
              type="monotone"
              dataKey="lowerProjection"
              name="Pessimistic Projection"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={true}
              data={chartData.map((point, index) => ({
                ...point,
                lowerProjection: index >= firstProjectedIndex ? point.lowerProjection : null
              }))}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


