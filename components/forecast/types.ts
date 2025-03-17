import { Doc } from "@/convex/_generated/dataModel";

export type DailyMetric = Doc<'dailyMetrics'> & {
  isProjected?: boolean;
};

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
}

export interface ForecastControlsProps {
  monthlyCost: number;
  setMonthlyCost: (value: number) => void;
  monthlyIncome: number;
  setMonthlyIncome: (value: number) => void;
}

export interface ForecastSummaryProps {
  currentNetWorth: number;
  projectedNetWorth: number;
}

export interface ForecastChartViewProps {
  realMetrics: DailyMetric[];
  projectedMetrics: DailyMetric[];
  dataView: 'all' | 'real' | 'projected';
  setDataView: (view: 'all' | 'real' | 'projected') => void;
}

export interface ForecastEmptyStateProps {
  monthlyCost: number;
  setMonthlyCost: (value: number) => void;
  monthlyIncome: number;
  setMonthlyIncome: (value: number) => void;
} 