/**
 * Gender split percentages. Both fields are required (resolved Q3).
 * Semantic constraint: male + female = 100 (enforced at runtime, not type level).
 */
export interface GenderSplit {
  /** Percentage of male workers (0-100) */
  male: number;
  /** Percentage of female workers (0-100) */
  female: number;
}

/**
 * Balance mode for slider behavior.
 * - 'auto': siblings rebalance to maintain 100% sum
 * - 'free': each slider operates independently
 */
export type BalanceMode = 'auto' | 'free';

/**
 * A node in the labor market tree structure.
 *
 * Tree levels:
 * - Level 0 (Root): Total employed population. percentage = 100 (convention, resolved Q4).
 * - Level 1 (Gender): Male / Female. percentage = share of root.
 * - Level 2 (Industry): KVED sectors. percentage = share of gender parent.
 * - Level 3 (Subcategory): Detailed breakdowns. percentage = share of industry parent.
 *
 * @example
 * const root: TreeNode = {
 *   id: 'root',
 *   label: 'Total Employed',
 *   percentage: 100,
 *   absoluteValue: 13_500_000,
 *   genderSplit: { male: 52, female: 48 },
 *   children: [maleNode, femaleNode],
 *   defaultPercentage: 100,
 *   isLocked: false,
 * };
 */
export interface TreeNode {
  /** Unique identifier for the node */
  id: string;
  /** Display label for the node */
  label: string;
  /** Share of parent node (0-100). Root node uses 100 by convention. */
  percentage: number;
  /** Computed absolute value: parent.absoluteValue * (percentage / 100) */
  absoluteValue: number;
  /** Gender split percentages. Always required on every node (resolved Q3). */
  genderSplit: GenderSplit;
  /** Child nodes. Empty array for leaf nodes. */
  children: TreeNode[];
  /** Original percentage value for reset functionality */
  defaultPercentage: number;
  /** Whether this node is locked during auto-balance redistribution */
  isLocked: boolean;
  /** Optional KVED sector code (resolved Q1), e.g. "A", "B-E", "G" */
  kvedCode?: string;
}

/**
 * Top-level dashboard state.
 * Contains a single root tree (resolved Q2).
 */
export interface DashboardState {
  /** Total employed population. Default: 13_500_000 */
  totalPopulation: number;
  /** Current slider balance mode */
  balanceMode: BalanceMode;
  /** Single root node of the labor market tree (resolved Q2) */
  tree: TreeNode;
}
