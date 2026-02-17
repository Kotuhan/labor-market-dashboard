import { memo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { OVERFLOW_INDICATOR_COLOR } from '@/data/chartColors';
import type { BalanceMode, TreeNode } from '@/types';
import { toChartData } from '@/utils/chartDataUtils';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';

/** Variant controlling chart size and feature set. */
type ChartSize = 'standard' | 'mini';

/** Props for PieChartPanel. */
export interface PieChartPanelProps {
  /**
   * Child tree nodes to visualize as pie slices.
   * Named `nodes` instead of `children` to avoid conflict with React's reserved prop.
   */
  nodes: TreeNode[];
  /** Map of node ID (or kvedCode) to hex color string */
  colorMap: Record<string, string>;
  /** Accessible label for the chart (e.g., "Male industry distribution") */
  ariaLabel: string;
  /** Chart size variant. 'standard' = ~300px, 'mini' = ~200px */
  size?: ChartSize;
  /** Current balance mode -- controls ghost slice visibility */
  balanceMode: BalanceMode;
  /** Whether to show the legend. Default: true */
  showLegend?: boolean;
}

/** Chart dimensions by size variant. */
const SIZE_CONFIG: Record<ChartSize, { height: number; outerRadius: number }> =
  {
    standard: { height: 300, outerRadius: 120 },
    mini: { height: 200, outerRadius: 80 },
  };

/** Animation duration in ms (resolved Q7: 300ms standard UI transition). */
const ANIMATION_DURATION = 300;

/**
 * Pie chart visualization panel for tree node data.
 *
 * Read-only component: receives TreeNode data as props, renders a Recharts
 * pie chart with custom tooltip and optional legend. Does not manage data
 * state or dispatch actions.
 *
 * Wrapped in React.memo to prevent re-renders when parent re-renders
 * but chart data has not changed.
 */
export const PieChartPanel = memo(function PieChartPanel({
  nodes,
  colorMap,
  ariaLabel,
  size = 'standard',
  balanceMode,
  showLegend = true,
}: PieChartPanelProps) {
  const data = toChartData(nodes, colorMap, balanceMode);
  const config = SIZE_CONFIG[size];

  // Calculate sum for overflow detection in free mode
  const sum = nodes.reduce((acc, node) => acc + node.percentage, 0);
  const isOverflow = balanceMode === 'free' && sum > 100.05;

  // Prepare legend items (exclude ghost slices)
  const legendItems = data
    .filter((entry) => !entry.isGhost)
    .map((entry) => ({
      label: entry.name,
      color: entry.color,
    }));

  return (
    <figure role="img" aria-label={ariaLabel}>
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        <div className="relative" style={{ minHeight: `${config.height}px` }}>
          <ResponsiveContainer width="100%" height={config.height}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={config.outerRadius}
                isAnimationActive={true}
                animationDuration={ANIMATION_DURATION}
                animationEasing="ease-out"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.nodeId}
                    fill={entry.color}
                    stroke={
                      entry.isGhost && isOverflow
                        ? OVERFLOW_INDICATOR_COLOR
                        : '#FFFFFF'
                    }
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Overflow indicator badge (free mode, sum > 100%) */}
          {isOverflow && (
            <div className="absolute right-0 top-0 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              {formatPercentage(Math.round(sum * 10) / 10)}
            </div>
          )}
        </div>

        {/* Legend (outside SVG, positioned via flex) */}
        {showLegend && <ChartLegend items={legendItems} />}
      </div>

      {/* Screen-reader-only data table fallback */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Категорія</th>
            <th scope="col">Відсоток</th>
            <th scope="col">Абсолютне значення</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter((entry) => !entry.isGhost)
            .map((entry) => (
              <tr key={entry.nodeId}>
                <td>{entry.name}</td>
                <td>{formatPercentage(entry.value)}</td>
                <td>{formatAbsoluteValue(entry.absoluteValue)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
});
