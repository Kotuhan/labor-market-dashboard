import { useCallback, useState } from 'react';

import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { canToggleLock, getSiblingDeviation } from '@/utils/calculations';
import { formatPercentage } from '@/utils/format';

import { Slider } from './Slider';
import { TreeRow } from './TreeRow';

/** Props for the TreePanel component. */
export interface TreePanelProps {
  /** Single gender node to render (male or female) */
  genderNode: TreeNode;
  /** Root-level gender siblings (for gender ratio slider lock logic) */
  genderSiblings: readonly TreeNode[];
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Collect all node IDs that have children (for initial expand state).
 * Walks a single gender node's children depth-first.
 * Only tracks nodes with children (industries with subcategories).
 */
function collectExpandableIds(genderNode: TreeNode): string[] {
  const ids: string[] = [];

  function walk(n: TreeNode): void {
    if (n.children.length > 0) {
      ids.push(n.id);
    }
    for (const child of n.children) {
      walk(child);
    }
  }

  // Walk industry-level children of the gender node
  for (const industry of genderNode.children) {
    walk(industry);
  }

  return ids;
}

/**
 * Format a deviation value for display.
 * Returns a string like "Сума: 95.0% (-5.0%)" or "Сума: 108.3% (+8.3%)".
 *
 * @param deviation - Deviation from 100% (positive = over, negative = under)
 */
function formatDeviation(deviation: number): string {
  const sum = 100 + deviation;
  const sign = deviation > 0 ? '+' : '';
  return `Сума: ${formatPercentage(sum)} (${sign}${formatPercentage(deviation)})`;
}

/**
 * Container component for a single gender's industry tree.
 *
 * Manages expand/collapse state locally (UI-only, not in reducer).
 * Renders gender heading (<h2>), percentage + absolute value,
 * optional deviation warning (free mode), and TreeRow instances
 * for each industry node.
 */
export function TreePanel({ genderNode, genderSiblings, balanceMode, dispatch }: TreePanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(collectExpandableIds(genderNode)),
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const deviation = balanceMode === 'free' ? getSiblingDeviation(genderNode) : 0;
  const canLockGender = canToggleLock(genderNode.id, genderSiblings);

  return (
    <section aria-label={genderNode.label}>
      <h2 className="mb-1 text-lg font-semibold text-slate-800">
        {genderNode.label}
      </h2>

      {/* Gender ratio slider */}
      <div className="mb-2">
        <Slider
          nodeId={genderNode.id}
          label={genderNode.label}
          percentage={genderNode.percentage}
          absoluteValue={genderNode.absoluteValue}
          isLocked={genderNode.isLocked}
          canLock={canLockGender}
          balanceMode={balanceMode}
          dispatch={dispatch}
        />
      </div>

      {/* Deviation warning (free mode only) */}
      {deviation !== 0 && (
        <p className="mb-2 text-sm font-medium text-amber-600" role="status">
          {formatDeviation(deviation)}
        </p>
      )}

      {/* Industry nodes */}
      <div className="flex flex-col gap-1">
        {genderNode.children.map((industry) => (
          <TreeRow
            key={industry.id}
            node={industry}
            siblings={genderNode.children}
            depth={0}
            balanceMode={balanceMode}
            dispatch={dispatch}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </section>
  );
}
