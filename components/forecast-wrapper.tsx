'use client';

import { useState, useMemo } from 'react';
import NetWorthChart from './net-worth-chart';
import { Doc } from "@/convex/_generated/dataModel";

type DailyMetric = Doc<'dailyMetrics'> & {
    isProjected?: boolean;
};

interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    label: string;
}

function Slider({ value, onChange, min, max, step, label }: SliderProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <label>{label}</label>
                <span>${value.toLocaleString()}</span>
            </div>
            <input
                type="range"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full"
            />
        </div>
    );
}

export default function ForecastWrapper({ metrics }: { metrics: DailyMetric[] }) {
    const [monthlyCost, setMonthlyCost] = useState(10000);
    const [monthlyIncome, setMonthlyIncome] = useState(18000);

    const forecastedMetrics = useMemo(() => {
        if (!metrics?.length) return metrics;

        const lastMetric = metrics[metrics.length - 1];
        const lastDate = new Date(lastMetric.date);

        // Start forecast from first of next month
        const forecastStart = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);

        const monthlyNet = monthlyIncome - monthlyCost;

        const forecastPoints = Array.from({ length: 12 }, (_, i) => {
            const forecastDate = new Date(forecastStart);
            forecastDate.setMonth(forecastStart.getMonth() + i);

            return {
                _id: lastMetric._id, // Use the same ID as the last metric
                _creationTime: Date.now(),
                date: forecastDate.getTime(),
                netWorth: lastMetric.netWorth + (monthlyNet * (i + 1)),
                assets: lastMetric.assets || 0,
                debts: lastMetric.debts || 0,
                prices: lastMetric.prices,
                metadata: lastMetric.metadata,
                isProjected: true // Mark as projected
            } as DailyMetric & { isProjected: boolean };
        });

        // Mark all original points as not projected
        const realPoints = metrics.map(m => ({ ...m, isProjected: false }));

        return [...realPoints, ...forecastPoints];
    }, [metrics, monthlyCost, monthlyIncome]);

    const [dataView, setDataView] = useState<'all' | 'real' | 'projected'>('all');

    const realMetrics = useMemo(() => {
        return forecastedMetrics.filter(m => !m.isProjected);
    }, [forecastedMetrics]);

    const projectedMetrics = useMemo(() => {
        // Include last real point with projections for continuity
        const lastRealPoint = forecastedMetrics.filter(m => !m.isProjected).sort((a, b) => b.date - a.date)[0];
        const projectedPoints = forecastedMetrics.filter(m => m.isProjected);
        return lastRealPoint ? [lastRealPoint, ...projectedPoints] : projectedPoints;
    }, [forecastedMetrics]);

    return (
        <div className="flex flex-col gap-4 w-full">
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
            
            <div className="flex justify-between p-4 border rounded-lg">
                <div>
                    <div className="text-sm text-gray-500">Current Net Worth</div>
                    <div className="text-2xl font-bold">
                        ${metrics[metrics.length-1].netWorth.toLocaleString()}
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-sm text-gray-500">Projected Change</div>
                    <div className="text-2xl font-bold text-green-600">
                        {(() => {
                            const currentValue = metrics[metrics.length-1].netWorth;
                            const projectedValue = forecastedMetrics[forecastedMetrics.length-1].netWorth;
                            const difference = projectedValue - currentValue;
                            const percentChange = ((difference / currentValue) * 100).toFixed(1);
                            return `+${percentChange}% (+$${difference.toLocaleString()})`;
                        })()}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Projected Net Worth (1 Year)</div>
                    <div className="text-2xl font-bold">
                        ${forecastedMetrics[forecastedMetrics.length-1].netWorth.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 p-4 border rounded-lg">
                <Slider
                    value={monthlyCost}
                    onChange={setMonthlyCost}
                    min={0}
                    max={50000}
                    step={100}
                    label="Monthly Costs"
                />

                <Slider
                    value={monthlyIncome}
                    onChange={setMonthlyIncome}
                    min={0}
                    max={50000}
                    step={100}
                    label="Monthly Income"
                />
            </div>
        </div>
    );
}