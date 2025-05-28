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
  timeframe: '7d' | '30d' | '90d' | 'all';
  setTimeframe: (tf: '7d' | '30d' | '90d' | 'all') => void;
}

export interface ForecastEmptyStateProps {
  monthlyCost: number;
  setMonthlyCost: (value: number) => void;
  monthlyIncome: number;
  setMonthlyIncome: (value: number) => void;
}

export interface UserPreferences {
  useSimulationData?: boolean;
  monthlyIncome?: number;
  monthlyCost?: number;
  forecastDataView?: "all" | "real" | "projected";
  forecastTimeframe?: '7d' | '30d' | '90d' | 'all';
  theme?: "light" | "dark" | "system";
  dashboardLayout?: string[];
  customSettings?: any;
}

export interface UserPreferencesData {
  userId: string;
  preferences: UserPreferences;
  lastUpdated: number;
}

export interface RecurringTotals {
  monthlyIncome: number;
  monthlyCost: number;
}
