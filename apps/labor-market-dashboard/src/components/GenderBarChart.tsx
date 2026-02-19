import { memo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { GENDER_COLORS } from '@/data/chartColors';
import type { TreeNode } from '@/types';
import { toBarChartData } from '@/utils/chartDataUtils';
import { formatAbsoluteValue } from '@/utils/format';

import { BarChartTooltip } from './BarChartTooltip';

/** Props for GenderBarChart. */
export interface GenderBarChartProps {
  /** Male gender tree node */
  maleNode: TreeNode;
  /** Female gender tree node */
  femaleNode: TreeNode;
}

/** Truncate a label to `max` characters, appending ellipsis if needed. */
function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/**
 * Grouped bar chart comparing male vs female employment by industry.
 *
 * Read-only visualization component following the PieChartPanel pattern:
 * - React.memo for render optimization
 * - No internal state, no dispatch
 * - figure wrapper with sr-only data table for accessibility
 */
export const GenderBarChart = memo(function GenderBarChart({
  maleNode,
  femaleNode,
}: GenderBarChartProps) {
  const data = toBarChartData(maleNode, femaleNode);

  return (
    <figure
      role="img"
      aria-label="Порівняння зайнятості за статтю та галузями"
      className="mb-6"
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="industry"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 11 }}
            tickFormatter={(label: string) => truncate(label, 12)}
          />
          <YAxis tickFormatter={(value: number) => formatAbsoluteValue(value)} />
          <Tooltip content={<BarChartTooltip />} />
          <Legend />
          <Bar dataKey="male" name="Чоловіки" fill={GENDER_COLORS.male} />
          <Bar dataKey="female" name="Жінки" fill={GENDER_COLORS.female} />
        </BarChart>
      </ResponsiveContainer>

      {/* Screen reader accessible data table */}
      <table className="sr-only">
        <caption>Порівняння зайнятості за статтю та галузями</caption>
        <thead>
          <tr>
            <th scope="col">Галузь</th>
            <th scope="col">Чоловіки</th>
            <th scope="col">Жінки</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.kvedCode}>
              <td>{entry.industry}</td>
              <td>{formatAbsoluteValue(entry.male)}</td>
              <td>{formatAbsoluteValue(entry.female)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
});
