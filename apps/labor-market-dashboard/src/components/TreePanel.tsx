import { useCallback, useState } from 'react';

import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

import { TreeRow } from './TreeRow';

/** Props for the TreePanel component. */
export interface TreePanelProps {
  /** Root node of the labor market tree */
  tree: TreeNode;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Collect all node IDs that have children (for initial expand state).
 * Walks the tree depth-first, skipping the root and gender nodes
 * (gender nodes are always expanded, not tracked in expandedIds).
 */
function collectExpandableIds(node: TreeNode): string[] {
  const ids: string[] = [];

  function walk(n: TreeNode, depth: number): void {
    // Skip root (depth 0) and gender (depth 1) -- they are not in expandedIds
    // Only track depth 2+ nodes with children (industries with subcategories)
    if (depth >= 2 && n.children.length > 0) {
      ids.push(n.id);
    }
    for (const child of n.children) {
      walk(child, depth + 1);
    }
  }

  walk(node, 0);
  return ids;
}

/**
 * Container component for the labor market tree panel.
 *
 * Manages expand/collapse state locally (UI-only, not in reducer).
 * Renders root header, gender section headers (always expanded),
 * and TreeRow instances for each industry node.
 */
export function TreePanel({ tree, balanceMode, dispatch }: TreePanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(collectExpandableIds(tree)),
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

  return (
    <div className="flex flex-col gap-4">
      {/* Root header */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold text-slate-900">{tree.label}</h1>
        <p className="text-sm text-slate-500">
          {formatAbsoluteValue(tree.absoluteValue)}
        </p>
      </div>

      {/* Gender sections (always expanded, non-collapsible) */}
      {tree.children.map((genderNode) => (
        <section key={genderNode.id} aria-label={genderNode.label}>
          {/* Gender section header */}
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {genderNode.label}
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-700">
                {formatPercentage(genderNode.percentage)}
              </span>
              <span className="text-xs text-slate-500">
                {formatAbsoluteValue(genderNode.absoluteValue)}
              </span>
            </div>
          </div>

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
      ))}
    </div>
  );
}
