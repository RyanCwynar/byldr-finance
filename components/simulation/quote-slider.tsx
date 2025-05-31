'use client';

import { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { formatNumber } from '@/lib/formatters';

interface QuoteSliderProps {
  symbol: string;
  originalPrice: number;
  adjustedPrice: number;
  percentChange: number;
  onChange: (value: number) => void;
}

export default function QuoteSlider({
  symbol,
  originalPrice,
  adjustedPrice,
  percentChange,
  onChange
}: QuoteSliderProps) {
  // Calculate min and max values for the slider (50% to 200% of original price)
  const minValue = Math.max(originalPrice * 0.5, 0.01);
  const maxValue = originalPrice * 2;
  
  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 0) {
      onChange(value);
    }
  };
  
  // Handle reset
  const handleReset = () => {
    onChange(originalPrice);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium">{symbol}</span>
          <span className={`ml-3 flex items-center text-sm ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {percentChange >= 0 ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
            {Math.abs(percentChange).toFixed(2)}%
          </span>
        </div>
        <button 
          onClick={handleReset}
          className="text-xs text-blue-400 hover:text-blue-300"
          disabled={adjustedPrice === originalPrice}
        >
          Reset
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="range"
            min={minValue}
            max={maxValue}
            step={(maxValue - minValue) / 100}
            value={adjustedPrice}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="w-24">
          <input
            type="number"
            value={adjustedPrice}
            onChange={handleInputChange}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right"
            step={0.01}
            min={0}
          />
        </div>
      </div>
      
      <div className="flex justify-between text-xs">
        <span>${formatNumber(originalPrice)}</span>
        <span>${formatNumber(adjustedPrice)}</span>
      </div>
    </div>
  );
} 