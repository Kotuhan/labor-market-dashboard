import { useMemo } from 'react';

import { DYNAMIC_COLOR_PALETTE, INDUSTRY_COLORS } from '@/data/chartColors';
import { useThrottledValue } from '@/hooks';
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
  /** When true, chevrons appear on the right and indentation is from the right */
  mirrored: boolean;
}

/** Maximum chart update frequency (ms). */
const CHART_THROTTLE_MS = 300;

/**
 * Container component pairing a gender's TreePanel with its industry PieChartPanel.
 *
 * Layout: vertical flex -- TreePanel on top (scrollable industry tree with sliders),
 * PieChartPanel below (industry distribution pie chart).
 * Each gender section (male/female) gets its own GenderSection in the dashboard.
 *
 * Throttles genderNode before passing to PieChartPanel so that
 * memo sees stable references between throttle ticks. TreePanel
 * receives the real-time node for responsive slider interaction.
 */
export function GenderSection({
  genderNode,
  genderSiblings,
  balanceMode,
  dispatch,
  mirrored,
}: GenderSectionProps) {
  // Throttled ref for pie chart -- memo sees same reference between ticks
  const throttledGenderNode = useThrottledValue(genderNode, CHART_THROTTLE_MS);

  // Derive colorMap from throttled node so it's also stable between ticks
  const colorMap = useMemo(() => {
    const merged: Record<string, string> = { ...INDUSTRY_COLORS };

    let dynamicIndex = 0;
    for (const child of throttledGenderNode.children) {
      if (!child.kvedCode && !(child.id in merged)) {
        merged[child.id] =
          DYNAMIC_COLOR_PALETTE[dynamicIndex % DYNAMIC_COLOR_PALETTE.length];
        dynamicIndex++;
      }
    }

    return merged;
  }, [throttledGenderNode.children]);

  return (
    <div className="flex flex-col gap-4">
      <TreePanel
        genderNode={genderNode}
        genderSiblings={genderSiblings}
        balanceMode={balanceMode}
        dispatch={dispatch}
        mirrored={mirrored}
      />
      <PieChartPanel
        nodes={throttledGenderNode.children}
        colorMap={colorMap}
        ariaLabel={`Розподіл галузей -- ${genderNode.label}`}
        balanceMode={balanceMode}
      />
    </div>
  );
}
