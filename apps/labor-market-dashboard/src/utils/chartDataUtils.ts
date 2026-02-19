/**
 * Data transformation utilities for Recharts chart consumption.
 *
 * Converts TreeNode children into chart-compatible data arrays:
 * - PieDataEntry for pie charts (with color mapping, ghost slice logic)
 * - BarChartDataEntry for grouped bar charts (male/female industry comparison)
 * - Subcategory color generation for mini pie charts
 */

import { DEFAULT_NODE_COLOR, GHOST_SLICE_COLOR } from '@/data/chartColors';
import type { BalanceMode, TreeNode } from '@/types';

/** Single data point for Recharts Pie component. */
export interface PieDataEntry {
  /** Display name (node label) */
  name: string;
  /** Percentage value (drives slice size) */
  value: number;
  /** Hex color for the slice */
  color: string;
  /** Absolute value (for tooltip display) */
  absoluteValue: number;
  /** Original node ID */
  nodeId: string;
  /** Whether this entry is a ghost slice (unallocated in free mode) */
  isGhost?: boolean;
}

/**
 * Get the color for a node from the color map.
 * Uses kvedCode if available, falls back to node ID, then to defaultColor.
 *
 * @param node - The tree node to get a color for
 * @param colorMap - Mapping of kvedCode or nodeId to hex color
 * @param defaultColor - Fallback color if no mapping found
 * @returns Hex color string
 */
export function getNodeColor(
  node: TreeNode,
  colorMap: Record<string, string>,
  defaultColor: string = DEFAULT_NODE_COLOR,
): string {
  if (node.kvedCode && node.kvedCode in colorMap) {
    return colorMap[node.kvedCode];
  }
  if (node.id in colorMap) {
    return colorMap[node.id];
  }
  return defaultColor;
}

/**
 * Transform TreeNode children into Recharts-compatible data array.
 *
 * Maps each child to a PieDataEntry using the provided color map.
 * In free mode, appends a ghost slice if percentages sum to less than 100%.
 * When sum exceeds 100% in free mode, Recharts normalizes proportionally
 * (no ghost slice needed).
 *
 * @param nodes - Child TreeNode array to transform
 * @param colorMap - Mapping of kvedCode or nodeId to hex color
 * @param balanceMode - Current balance mode (controls ghost slice)
 * @param defaultColor - Fallback color for unmapped nodes
 * @returns Array of PieDataEntry for Recharts consumption
 */
export function toChartData(
  nodes: TreeNode[],
  colorMap: Record<string, string>,
  balanceMode: BalanceMode,
  defaultColor: string = DEFAULT_NODE_COLOR,
): PieDataEntry[] {
  const entries: PieDataEntry[] = nodes.map((node) => ({
    name: node.label,
    value: node.percentage,
    color: getNodeColor(node, colorMap, defaultColor),
    absoluteValue: node.absoluteValue,
    nodeId: node.id,
  }));

  // In free mode, add ghost slice if percentages sum to less than 100%
  if (balanceMode === 'free') {
    const sum = nodes.reduce((acc, node) => acc + node.percentage, 0);
    const remainder = 100 - sum;

    // Use small epsilon to avoid floating-point ghost slices
    if (remainder > 0.05) {
      entries.push({
        name: 'Нерозподілено',
        value: Math.round(remainder * 10) / 10,
        color: GHOST_SLICE_COLOR,
        absoluteValue: 0,
        nodeId: 'ghost',
        isGhost: true,
      });
    }
  }

  return entries;
}

/** Single data point for the gender comparison bar chart. */
export interface BarChartDataEntry {
  /** Ukrainian industry label (for X-axis) */
  industry: string;
  /** KVED code (for stable identification) */
  kvedCode: string;
  /** Male absolute value */
  male: number;
  /** Female absolute value */
  female: number;
  /** Male percentage of male gender total */
  malePercentage: number;
  /** Female percentage of female gender total */
  femalePercentage: number;
}

/**
 * Transform two gender nodes into bar chart data by matching industries via KVED code.
 *
 * Iterates male industries first (preserving default ordering), then appends any
 * female-only industries. Missing KVED matches get 0 value/percentage fallbacks.
 *
 * @param maleNode - Male gender tree node
 * @param femaleNode - Female gender tree node
 * @returns Array of BarChartDataEntry for Recharts BarChart consumption
 */
export function toBarChartData(
  maleNode: TreeNode,
  femaleNode: TreeNode,
): BarChartDataEntry[] {
  // Build female lookup by KVED code
  const femaleByKved = new Map<string, TreeNode>();
  for (const child of femaleNode.children) {
    if (child.kvedCode) {
      femaleByKved.set(child.kvedCode, child);
    }
  }

  const entries: BarChartDataEntry[] = [];
  const usedKvedCodes = new Set<string>();

  // Iterate male industries (primary ordering)
  for (const maleChild of maleNode.children) {
    const kved = maleChild.kvedCode ?? maleChild.id;
    usedKvedCodes.add(kved);
    const femaleChild = maleChild.kvedCode
      ? femaleByKved.get(maleChild.kvedCode)
      : undefined;

    entries.push({
      industry: maleChild.label,
      kvedCode: kved,
      male: maleChild.absoluteValue,
      female: femaleChild?.absoluteValue ?? 0,
      malePercentage: maleChild.percentage,
      femalePercentage: femaleChild?.percentage ?? 0,
    });
  }

  // Append any female-only industries
  for (const femaleChild of femaleNode.children) {
    const kved = femaleChild.kvedCode ?? femaleChild.id;
    if (!usedKvedCodes.has(kved)) {
      entries.push({
        industry: femaleChild.label,
        kvedCode: kved,
        male: 0,
        female: femaleChild.absoluteValue,
        malePercentage: 0,
        femalePercentage: femaleChild.percentage,
      });
    }
  }

  return entries;
}

/**
 * Generate opacity-based color shades for subcategory mini charts.
 *
 * Creates `count` hex color strings from full opacity to 40% opacity
 * of the base color, blended against white (#FFFFFF).
 *
 * @param baseColor - Hex color string (e.g., "#14B8A6")
 * @param count - Number of shades to generate
 * @returns Array of hex color strings
 */
export function generateSubcategoryColors(
  baseColor: string,
  count: number,
): string[] {
  if (count <= 0) return [];
  if (count === 1) return [baseColor];

  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);

  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    // Opacity ranges from 1.0 (first) to 0.4 (last)
    const opacity = 1.0 - (i * 0.6) / (count - 1);

    // Blend with white background
    const blendedR = Math.round(r * opacity + 255 * (1 - opacity));
    const blendedG = Math.round(g * opacity + 255 * (1 - opacity));
    const blendedB = Math.round(b * opacity + 255 * (1 - opacity));

    const hex = `#${blendedR.toString(16).padStart(2, '0')}${blendedG.toString(16).padStart(2, '0')}${blendedB.toString(16).padStart(2, '0')}`;
    colors.push(hex.toUpperCase());
  }

  return colors;
}
