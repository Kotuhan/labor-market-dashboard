import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

/**
 * Payload item from Recharts Tooltip.
 * Recharts passes this structure when hovering a pie slice.
 */
interface RechartsPayloadItem {
  /** Slice name from data entry */
  name: string;
  /** Slice value (percentage) from data entry */
  value: number;
  /** Full data entry payload including custom fields */
  payload: {
    name: string;
    value: number;
    absoluteValue: number;
    color: string;
    isGhost?: boolean;
  };
}

/** Props for ChartTooltip (passed by Recharts Tooltip content prop). */
export interface ChartTooltipProps {
  /** Whether tooltip is currently active (from Recharts) */
  active?: boolean;
  /** Payload array from Recharts (contains data point info) */
  payload?: RechartsPayloadItem[];
}

/**
 * Custom tooltip content for pie chart slices.
 *
 * Displays the slice label, formatted percentage, and formatted absolute value
 * using the established Ukrainian formatting utilities.
 *
 * Returns null when inactive or empty to prevent rendering empty tooltip boxes.
 */
export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const { name, value } = item;
  const { absoluteValue, color, isGhost } = item.payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-700">{name}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-900">
          {formatPercentage(value)}
        </span>
        {!isGhost && (
          <span className="text-xs text-slate-500">
            {formatAbsoluteValue(absoluteValue)}
          </span>
        )}
      </div>
    </div>
  );
}
