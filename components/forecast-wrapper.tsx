'use client';

import { useState, useMemo } from 'react';
import { DailyMetric } from './NetWorthChart';
import NetWorthChart from './NetWorthChart';

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

interface ForecastWrapperProps {
    metrics: DailyMetric[];
}

export default function ForecastWrapper({ metrics }: ForecastWrapperProps) {
    const [monthlyCost, setMonthlyCost] = useState(10000);
    const [monthlyIncome, setMonthlyIncome] = useState(18000);

    const forecastedMetrics = useMemo(() => {
        if (!metrics?.length) return metrics;

        const lastMetric = metrics[metrics.length - 1];
        const lastDate = new Date(lastMetric.date);

        // Start forecast from first of next month
        const forecastStart = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);

        const monthlyNet = monthlyIncome - monthlyCost;

        const forecastPoints: DailyMetric[] = Array.from({ length: 12 }, (_, i) => {
            const forecastDate = new Date(forecastStart);
            forecastDate.setMonth(forecastStart.getMonth() + i);

            return {
                date: forecastDate.getTime(),
                netWorth: lastMetric.netWorth + (monthlyNet * (i + 1)),
                prices: lastMetric.prices,
            };
        });

        return [...metrics, ...forecastPoints];
    }, [metrics, monthlyCost, monthlyIncome]);

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="w-full h-[400px]">
                <NetWorthChart metrics={forecastedMetrics} />
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