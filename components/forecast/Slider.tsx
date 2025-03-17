'use client';

import { SliderProps } from './types';

export function Slider({ value, onChange, min, max, step, label }: SliderProps) {
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