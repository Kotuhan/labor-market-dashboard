import { GENDER_COLORS } from '@/data/chartColors';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

/** Payload item structure from Recharts bar tooltip. */
interface RechartsBarPayloadItem {
  /** Data key name (e.g., "male", "female") */
  name: string;
  /** Absolute value for this bar */
  value: number;
  /** Hex fill color of the bar */
  color: string;
  /** Full data entry from the bar chart data array */
  payload: {
    industry: string;
    kvedCode: string;
    male: number;
    female: number;
    malePercentage: number;
    femalePercentage: number;
  };
}

/** Props for BarChartTooltip (passed by Recharts Tooltip content prop). */
export interface BarChartTooltipProps {
  /** Whether tooltip is currently active (from Recharts) */
  active?: boolean;
  /** Payload array from Recharts (contains bar data) */
  payload?: RechartsBarPayloadItem[];
  /** X-axis label (industry name, may be truncated) */
  label?: string;
}

/**
 * Custom tooltip for the gender comparison bar chart.
 *
 * Shows the full industry name (not truncated) with both male and female
 * values and percentages in a styled card.
 */
export function BarChartTooltip({ active, payload }: BarChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-sm font-medium text-slate-700">
        {data.industry}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: GENDER_COLORS.male }}
          aria-hidden="true"
        />
        <span className="text-sm text-slate-600">Чоловіки:</span>
        <span className="text-sm font-semibold text-slate-900">
          {formatAbsoluteValue(data.male)}
        </span>
        <span className="text-xs text-slate-500">
          {formatPercentage(data.malePercentage)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: GENDER_COLORS.female }}
          aria-hidden="true"
        />
        <span className="text-sm text-slate-600">Жінки:</span>
        <span className="text-sm font-semibold text-slate-900">
          {formatAbsoluteValue(data.female)}
        </span>
        <span className="text-xs text-slate-500">
          {formatPercentage(data.femalePercentage)}
        </span>
      </div>
    </div>
  );
}
