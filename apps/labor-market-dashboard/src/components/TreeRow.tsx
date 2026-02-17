import { memo } from 'react';

import { DEFAULT_NODE_COLOR, INDUSTRY_COLORS } from '@/data/chartColors';
import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { canToggleLock, getSiblingDeviation } from '@/utils/calculations';
import { generateSubcategoryColors } from '@/utils/chartDataUtils';
import { formatPercentage } from '@/utils/format';

import { PieChartPanel } from './PieChartPanel';
import { Slider } from './Slider';

/** Props for the TreeRow component. */
export interface TreeRowProps {
  /** The tree node to render */
  node: TreeNode;
  /** Sibling nodes (children of the same parent) for canToggleLock computation */
  siblings: readonly TreeNode[];
  /** Nesting depth (0 = top-level industry under gender) */
  depth: number;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
  /** Set of currently expanded node IDs */
  expandedIds: ReadonlySet<string>;
  /** Callback to toggle expand/collapse state of a node */
  onToggleExpand: (id: string) => void;
}

/**
 * Build a color map for subcategory nodes based on parent's industry color.
 * Uses generateSubcategoryColors to create opacity-based shades.
 */
function buildSubcategoryColorMap(
  node: TreeNode,
): Record<string, string> {
  const baseColor =
    node.kvedCode && node.kvedCode in INDUSTRY_COLORS
      ? INDUSTRY_COLORS[node.kvedCode]
      : DEFAULT_NODE_COLOR;

  const colors = generateSubcategoryColors(baseColor, node.children.length);
  const colorMap: Record<string, string> = {};

  node.children.forEach((child, index) => {
    colorMap[child.id] = colors[index];
  });

  return colorMap;
}

/**
 * Recursive tree row component.
 *
 * Renders a single node with optional expand/collapse chevron, indentation,
 * and an embedded Slider. When expanded, recursively renders child nodes,
 * a mini subcategory pie chart, and (in free mode) a deviation warning.
 *
 * Wrapped in React.memo to prevent re-renders during sibling slider interactions.
 */
export const TreeRow = memo(function TreeRow({
  node,
  siblings,
  depth,
  balanceMode,
  dispatch,
  expandedIds,
  onToggleExpand,
}: TreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const canLock = canToggleLock(node.id, siblings);

  // Compute subcategory deviation for expanded nodes in free mode
  const showDeviation =
    isExpanded && hasChildren && balanceMode === 'free';
  const deviation = showDeviation ? getSiblingDeviation(node) : 0;

  return (
    <div>
      <div
        className="flex items-center gap-1"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        {/* Chevron toggle button -- only for nodes with children */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ) : (
          /* Spacer to maintain alignment when no chevron */
          <div className="h-11 w-11 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <Slider
            nodeId={node.id}
            label={node.label}
            percentage={node.percentage}
            absoluteValue={node.absoluteValue}
            isLocked={node.isLocked}
            canLock={canLock}
            balanceMode={balanceMode}
            dispatch={dispatch}
          />
        </div>
      </div>

      {/* Recursively render children when expanded */}
      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            siblings={node.children}
            depth={depth + 1}
            balanceMode={balanceMode}
            dispatch={dispatch}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}

      {/* Subcategory deviation warning (free mode, expanded nodes with children) */}
      {showDeviation && deviation !== 0 && (
        <p
          className="text-sm font-medium text-amber-600"
          style={{ paddingLeft: `${(depth + 1) * 24}px` }}
          role="status"
        >
          Сума: {formatPercentage(100 + deviation)} ({deviation > 0 ? '+' : ''}{formatPercentage(deviation)})
        </p>
      )}

      {/* Mini subcategory pie chart (expanded nodes with children) */}
      {isExpanded && hasChildren && (
        <div style={{ paddingLeft: `${(depth + 1) * 24}px` }}>
          <PieChartPanel
            nodes={node.children}
            colorMap={buildSubcategoryColorMap(node)}
            ariaLabel={`Розподіл підкатегорій -- ${node.label}`}
            size="mini"
            balanceMode={balanceMode}
            showLegend={false}
          />
        </div>
      )}
    </div>
  );
});
