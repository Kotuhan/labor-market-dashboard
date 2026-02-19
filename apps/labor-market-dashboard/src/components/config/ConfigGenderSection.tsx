import { useCallback, useEffect, useRef, useState } from 'react';

import type { TreeAction, TreeNode } from '@/types';

import { AddNodeForm } from './AddNodeForm';
import { ConfigIndustryRow } from './ConfigIndustryRow';
import { ConfirmDialog } from './ConfirmDialog';

/** Props for the ConfigGenderSection component. */
export interface ConfigGenderSectionProps {
  /** Gender tree node (male or female) */
  genderNode: TreeNode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Config page section for a single gender.
 *
 * Renders industry rows with expand/collapse, add/remove controls,
 * and a shared ConfirmDialog for removal confirmations.
 */
export function ConfigGenderSection({
  genderNode,
  dispatch,
}: ConfigGenderSectionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Track IDs we have already auto-expanded so we don't re-expand
  // after the user explicitly collapses them.
  const seenExpandableRef = useRef<Set<string>>(new Set());

  const [pendingRemoval, setPendingRemoval] = useState<{
    nodeId: string;
    label: string;
    hasChildren: boolean;
  } | null>(null);

  // Auto-expand industries that gain children (e.g., first subcategory added).
  // Only expands IDs we haven't seen before to respect user collapse actions.
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

  function handleRemoveRequest(
    nodeId: string,
    label: string,
    hasChildren: boolean,
  ) {
    setPendingRemoval({ nodeId, label, hasChildren });
  }

  function handleConfirmRemoval() {
    if (!pendingRemoval) return;

    const isIndustry = genderNode.children.some(
      (child) => child.id === pendingRemoval.nodeId,
    );

    if (isIndustry) {
      dispatch({ type: 'REMOVE_INDUSTRY', nodeId: pendingRemoval.nodeId });
    } else {
      dispatch({ type: 'REMOVE_SUBCATEGORY', nodeId: pendingRemoval.nodeId });
    }
    setPendingRemoval(null);
  }

  function handleCancelRemoval() {
    setPendingRemoval(null);
  }

  const confirmMessage = pendingRemoval
    ? pendingRemoval.hasChildren
      ? `"${pendingRemoval.label}" та всі підкатегорії будуть видалені. Відсотки перерозподіляться рівномірно.`
      : `"${pendingRemoval.label}" буде видалено. Відсотки перерозподіляться рівномірно.`
    : '';

  return (
    <section aria-label={genderNode.label}>
      <h2 className="mb-3 text-lg font-semibold text-slate-800">
        {genderNode.label}
      </h2>
      <div className="space-y-1">
        {genderNode.children.map((industry) => (
          <ConfigIndustryRow
            key={industry.id}
            node={industry}
            dispatch={dispatch}
            onRemoveRequest={handleRemoveRequest}
            isExpanded={expandedIds.has(industry.id)}
            onToggleExpand={handleToggleExpand}
            isRemoveBlocked={genderNode.children.length <= 1}
          />
        ))}
      </div>
      <div className="mt-3">
        <AddNodeForm
          parentId={genderNode.id}
          actionType="ADD_INDUSTRY"
          dispatch={dispatch}
          placeholder="Назва галузі"
        />
      </div>
      <ConfirmDialog
        isOpen={pendingRemoval !== null}
        title="Видалити?"
        message={confirmMessage}
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelRemoval}
      />
    </section>
  );
}
