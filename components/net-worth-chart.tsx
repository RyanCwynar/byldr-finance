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

type DailyMetric = Doc<'dailyMetrics'> & {
  isProjected?: boolean;
};

export default function NetWorthChart({ metrics }: { metrics: DailyMetric[] }) {
  const [uncertaintyPercent, setUncertaintyPercent] = useState(10);

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

    const data = sortedMetrics.map((m, index) => {
      const isProjection = m.isProjected === true;
      
      let upperProjection = m.netWorth;
      let lowerProjection = m.netWorth;

      if (isProjection) {
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

      minValue = Math.min(minValue, lowerProjection);
      maxValue = Math.max(maxValue, upperProjection);

      return {
        timestamp: m.date,
        date: new Date(m.date).toLocaleDateString(),
        netWorth: m.netWorth,
        upperProjection,
        lowerProjection,
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
    console.assert(projectionCount > 0, 'Should have at least one projection point');
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
  }, [metrics, uncertaintyPercent]);

  // Add logging when uncertainty changes
  useEffect(() => {
    console.log('Uncertainty changed:', uncertaintyPercent);
  }, [uncertaintyPercent]);

  if (!chartData.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
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
      
      <ResponsiveContainer width="100%" height="90%">
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
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            tickCount={8} // Suggest number of ticks
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              const label = {
                netWorth: 'Net Worth',
                upperProjection: 'Optimistic Projection',
                lowerProjection: 'Conservative Projection'
              }[name] || name;
              return [`$${value.toLocaleString()}`, label];
            }}
            labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
          />
          <Legend />
          
          {/* Upper projection line - only show for projected points */}
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
          
          {/* Main line */}
          <Line
            type="monotone"
            dataKey="netWorth"
            name="Net Worth"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />

          {/* Lower projection line - only show for projected points */}
          <Line
            type="monotone"
            dataKey="lowerProjection"
            name="Conservative Projection"
            stroke="#22c55e"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            connectNulls={true}
            data={chartData.map((point, index) => ({
              ...point,
              lowerProjection: index >= firstProjectedIndex ? point.lowerProjection : null
            }))}
          />
          
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


