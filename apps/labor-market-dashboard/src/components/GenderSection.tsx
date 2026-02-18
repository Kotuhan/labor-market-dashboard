import { INDUSTRY_COLORS } from '@/data/chartColors';
import type { BalanceMode, TreeAction, TreeNode } from '@/types';

import { PieChartPanel } from './PieChartPanel';
import { TreePanel } from './TreePanel';

/** Props for the GenderSection component. */
export interface GenderSectionProps {
  /** Single gender node (male or female) */
  genderNode: TreeNode;
  /** Root-level gender siblings (for gender ratio slider lock logic) */
  genderSiblings: readonly TreeNode[];
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Container component pairing a gender's TreePanel with its industry PieChartPanel.
 *
 * Layout: vertical flex -- TreePanel on top (scrollable industry tree with sliders),
 * PieChartPanel below (industry distribution pie chart).
 * Each gender section (male/female) gets its own GenderSection in the dashboard.
 */
export function GenderSection({
  genderNode,
  genderSiblings,
  balanceMode,
  dispatch,
}: GenderSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <TreePanel
        genderNode={genderNode}
        genderSiblings={genderSiblings}
        balanceMode={balanceMode}
        dispatch={dispatch}
      />
      <PieChartPanel
        nodes={genderNode.children}
        colorMap={INDUSTRY_COLORS}
        ariaLabel={`Розподіл галузей -- ${genderNode.label}`}
        balanceMode={balanceMode}
      />
    </div>
  );
}
