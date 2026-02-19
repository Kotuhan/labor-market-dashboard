import { useCallback, useEffect, useRef, useState } from 'react';

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
  /** When true, chevrons appear on the right and indentation is from the right */
  mirrored: boolean;
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
 * Renders gender heading (<h2>) with a toggle chevron, percentage + absolute value,
 * optional deviation warning (free mode), and TreeRow instances
 * for each industry node.
 *
 * The industry list starts collapsed by default. IT subcategories also start collapsed.
 */
export function TreePanel({ genderNode, genderSiblings, balanceMode, dispatch, mirrored }: TreePanelProps) {
  // Industry-level expand/collapse (IT subcategories) -- all start collapsed
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Track IDs we have already auto-expanded so we don't re-expand
  // after the user explicitly collapses them.
  const seenExpandableRef = useRef<Set<string>>(new Set());

  // Auto-expand industries that gain children (e.g., first subcategory added
  // on the config page). Only expands IDs we haven't seen before to respect
  // user collapse actions.
  useEffect(() => {
    const newExpandable = genderNode.children
      .filter((child) => child.children.length > 0)
      .filter((child) => !seenExpandableRef.current.has(child.id));
    if (newExpandable.length > 0) {
      newExpandable.forEach((n) => seenExpandableRef.current.add(n.id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        newExpandable.forEach((n) => next.add(n.id));
        return next;
      });
    }
  }, [genderNode.children]);

  // Whether the industry list itself is visible
  const [isIndustriesExpanded, setIsIndustriesExpanded] = useState(false);

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

  const handleToggleIndustries = useCallback(() => {
    setIsIndustriesExpanded((prev) => !prev);
  }, []);

  const deviation = balanceMode === 'free' ? getSiblingDeviation(genderNode) : 0;
  const canLockGender = canToggleLock(genderNode.id, genderSiblings);

  return (
    <section aria-label={genderNode.label}>
      {/* Heading with collapse/expand toggle */}
      <button
        type="button"
        onClick={handleToggleIndustries}
        aria-expanded={isIndustriesExpanded}
        aria-label={
          isIndustriesExpanded
            ? `Collapse ${genderNode.label}`
            : `Expand ${genderNode.label}`
        }
        className={`mb-1 flex w-full items-center gap-2 text-left ${mirrored ? 'flex-row-reverse text-right' : ''}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-600">
          {isIndustriesExpanded ? (
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
        </span>
        <h2 className="text-lg font-semibold text-slate-800">
          {genderNode.label}
        </h2>
      </button>

      {/* Gender ratio slider -- always visible */}
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

      {/* Collapsible industry list */}
      {isIndustriesExpanded && (
        <>
          {/* Deviation warning (free mode only) */}
          {deviation !== 0 && (
            <p
              className={`mb-2 text-sm font-medium text-amber-600 ${mirrored ? 'text-right' : ''}`}
              role="status"
            >
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
                mirrored={mirrored}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
