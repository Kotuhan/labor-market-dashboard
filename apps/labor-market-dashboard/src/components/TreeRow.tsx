import { memo } from 'react';

import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { canToggleLock, getSiblingDeviation } from '@/utils/calculations';
import { formatPercentage } from '@/utils/format';

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
  /** When true, chevrons appear on the right and indentation is from the right */
  mirrored: boolean;
}

/**
 * Recursive tree row component.
 *
 * Renders a single node with optional expand/collapse chevron, indentation,
 * and an embedded Slider. When expanded, recursively renders child nodes
 * and (in free mode) a deviation warning.
 *
 * When `mirrored` is true, the chevron appears on the right side of the slider
 * and indentation grows from the right (paddingRight instead of paddingLeft).
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
  mirrored,
}: TreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const canLock = canToggleLock(node.id, siblings);

  // Compute subcategory deviation for expanded nodes in free mode
  const showDeviation =
    isExpanded && hasChildren && balanceMode === 'free';
  const deviation = showDeviation ? getSiblingDeviation(node) : 0;

  const indentPx = `${depth * 24}px`;
  const indentStyle = mirrored
    ? { paddingRight: indentPx }
    : { paddingLeft: indentPx };

  const deviationIndentPx = `${(depth + 1) * 24}px`;
  const deviationIndentStyle = mirrored
    ? { paddingRight: deviationIndentPx }
    : { paddingLeft: deviationIndentPx };

  return (
    <div>
      <div
        className={`flex items-center gap-1 ${mirrored ? 'flex-row-reverse' : ''}`}
        style={indentStyle}
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
                {mirrored ? (
                  <path
                    fillRule="evenodd"
                    d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                )}
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
            mirrored={mirrored}
          />
        ))}

      {/* Subcategory deviation warning (free mode, expanded nodes with children) */}
      {showDeviation && deviation !== 0 && (
        <p
          className={`text-sm font-medium text-amber-600 ${mirrored ? 'text-right' : ''}`}
          style={deviationIndentStyle}
          role="status"
        >
          Сума: {formatPercentage(100 + deviation)} ({deviation > 0 ? '+' : ''}{formatPercentage(deviation)})
        </p>
      )}
    </div>
  );
});
