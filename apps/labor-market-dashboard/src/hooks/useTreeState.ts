import { useReducer } from 'react';

import { defaultTree, largestRemainder } from '@/data';
import type { DashboardState, TreeAction, TreeNode } from '@/types';
import {
  autoBalance,
  canToggleLock,
  normalizeGroup,
  recalcAbsoluteValues,
} from '@/utils/calculations';
import { slugify } from '@/utils/slugify';
import {
  addChildToParent,
  collectSiblingInfo,
  findNodeById,
  findParentById,
  generateUniqueId,
  removeChildFromParent,
  updateChildrenInTree,
  updateNodeInTree,
} from '@/utils/treeUtils';

/**
 * Initial state for the dashboard.
 * Uses defaultTree from static data and auto balance mode.
 */
export const initialState: DashboardState = {
  totalPopulation: defaultTree.absoluteValue,
  balanceMode: 'auto',
  tree: defaultTree,
};

/**
 * Recursively normalize all sibling groups in the tree.
 * Used when switching from free mode to auto mode.
 * Each parent's children are normalized to sum to exactly 100%.
 *
 * @param node - The node whose children (and descendants) to normalize
 * @returns A new tree with all sibling groups normalized
 */
function normalizeTree(node: TreeNode): TreeNode {
  if (node.children.length === 0) return node;

  const percentages = node.children.map((c) => c.percentage);
  const normalized = normalizeGroup(percentages);

  const newChildren = node.children.map((child, i) => {
    const updated = { ...child, percentage: normalized[i] };
    return normalizeTree(updated);
  });

  return { ...node, children: newChildren };
}

/**
 * Recalculate absolute values for the entire tree from root.
 * Root's absolute value is set to totalPopulation.
 *
 * @param tree - The root node of the tree
 * @param totalPopulation - The total population to use as root absolute value
 * @returns A new tree with all absolute values recalculated
 */
function recalcTreeFromRoot(
  tree: TreeNode,
  totalPopulation: number,
): TreeNode {
  const root = { ...tree, absoluteValue: totalPopulation };
  return {
    ...root,
    children: root.children.map((child) =>
      recalcAbsoluteValues(child, totalPopulation),
    ),
  };
}

/**
 * Reducer function for the dashboard tree state.
 *
 * Handles 9 action types:
 * - SET_PERCENTAGE: Change a node's percentage (auto-balance or free mode)
 * - TOGGLE_LOCK: Toggle a node's lock state (with guard)
 * - SET_BALANCE_MODE: Switch between auto and free mode
 * - SET_TOTAL_POPULATION: Change total population
 * - RESET: Restore to initial state
 * - ADD_INDUSTRY: Add a new industry under a gender node
 * - REMOVE_INDUSTRY: Remove an industry (and all its subcategories)
 * - ADD_SUBCATEGORY: Add a new subcategory under an industry
 * - REMOVE_SUBCATEGORY: Remove a subcategory (industry may become leaf)
 *
 * Exported as a named function for direct unit testing without React rendering.
 *
 * @param state - Current dashboard state
 * @param action - Action to apply
 * @returns New dashboard state
 */
export function treeReducer(
  state: DashboardState,
  action: TreeAction,
): DashboardState {
  switch (action.type) {
    case 'SET_PERCENTAGE': {
      const { nodeId, value } = action;

      // Find the target node -- if locked, no-op
      const targetNode = findNodeById(state.tree, nodeId);
      if (!targetNode || targetNode.isLocked) return state;

      // Find the parent to get sibling context
      const parent = findParentById(state.tree, nodeId);
      if (!parent) {
        // nodeId is root -- root percentage is always 100, no-op
        return state;
      }

      let newTree: TreeNode;

      if (state.balanceMode === 'auto') {
        // Auto-balance siblings
        const siblings = collectSiblingInfo(parent);
        const updates = autoBalance(siblings, nodeId, value);

        // Apply percentage updates to all children of the parent
        newTree = updateChildrenInTree(state.tree, parent.id, (children) =>
          children.map((child) => {
            const update = updates.find((u) => u.id === child.id);
            if (update) {
              return { ...child, percentage: update.percentage };
            }
            return child;
          }),
        );
      } else {
        // Free mode: only update the target node
        newTree = updateNodeInTree(state.tree, nodeId, (node) => ({
          ...node,
          percentage: Math.max(0, Math.min(value, 100)),
        }));
      }

      // Recalculate absolute values from root
      newTree = recalcTreeFromRoot(newTree, state.totalPopulation);

      return { ...state, tree: newTree };
    }

    case 'TOGGLE_LOCK': {
      const { nodeId } = action;

      // Find the parent to get siblings for lock guard
      const parent = findParentById(state.tree, nodeId);
      if (!parent) {
        // Root node cannot be locked
        return state;
      }

      // Check lock guard
      if (!canToggleLock(nodeId, parent.children)) {
        return state;
      }

      // Toggle the lock
      const newTree = updateNodeInTree(state.tree, nodeId, (node) => ({
        ...node,
        isLocked: !node.isLocked,
      }));

      return { ...state, tree: newTree };
    }

    case 'SET_BALANCE_MODE': {
      const { mode } = action;

      if (mode === state.balanceMode) return state;

      if (mode === 'auto') {
        // Normalize all sibling groups and recalculate absolute values
        let newTree = normalizeTree(state.tree);
        newTree = recalcTreeFromRoot(newTree, state.totalPopulation);
        return { ...state, balanceMode: mode, tree: newTree };
      }

      // Switching to free: no value changes
      return { ...state, balanceMode: mode };
    }

    case 'SET_TOTAL_POPULATION': {
      const { value } = action;
      const newTree = recalcTreeFromRoot(state.tree, value);
      return { ...state, totalPopulation: value, tree: newTree };
    }

    case 'ADD_INDUSTRY': {
      const { genderId, label } = action;

      const genderNode = findNodeById(state.tree, genderId);
      if (!genderNode) return state;

      const slug = slugify(label);
      const genderPrefix = genderId.replace('gender-', '');
      const nodeId = generateUniqueId(state.tree, genderPrefix, slug);
      const genderSplit =
        genderPrefix === 'male'
          ? { male: 100, female: 0 }
          : { male: 0, female: 100 };

      const newNode: TreeNode = {
        id: nodeId,
        label,
        percentage: 0,
        defaultPercentage: 0,
        absoluteValue: 0,
        genderSplit,
        isLocked: false,
        children: [],
      };

      let newTree = addChildToParent(state.tree, genderId, newNode);
      newTree = recalcTreeFromRoot(newTree, state.totalPopulation);

      return { ...state, tree: newTree };
    }

    case 'REMOVE_INDUSTRY': {
      const { nodeId } = action;

      const parent = findParentById(state.tree, nodeId);
      if (!parent) return state;

      const newTree = removeChildFromParent(state.tree, parent.id, nodeId);
      if (newTree === state.tree) return state;

      const recalced = recalcTreeFromRoot(newTree, state.totalPopulation);
      return { ...state, tree: recalced };
    }

    case 'ADD_SUBCATEGORY': {
      const { industryId, label } = action;

      const industryNode = findNodeById(state.tree, industryId);
      if (!industryNode) return state;

      const slug = slugify(label);
      const nodeId = generateUniqueId(state.tree, industryId, slug);

      const newNode: TreeNode = {
        id: nodeId,
        label,
        percentage: 0,
        defaultPercentage: 0,
        absoluteValue: 0,
        genderSplit: { ...industryNode.genderSplit },
        isLocked: false,
        children: [],
      };

      let newTree = addChildToParent(state.tree, industryId, newNode);
      newTree = recalcTreeFromRoot(newTree, state.totalPopulation);

      return { ...state, tree: newTree };
    }

    case 'REMOVE_SUBCATEGORY': {
      const { nodeId } = action;

      const parent = findParentById(state.tree, nodeId);
      if (!parent) return state;

      const newTree = updateChildrenInTree(
        state.tree,
        parent.id,
        (children) => {
          const remaining = children.filter((c) => c.id !== nodeId);
          if (remaining.length === children.length) return children;
          if (remaining.length === 0) return [];

          const n = remaining.length;
          const rawPercentages = Array.from({ length: n }, () => 100 / n);
          const rounded = largestRemainder(rawPercentages, 100, 1);
          return remaining.map((child, i) => ({
            ...child,
            percentage: rounded[i],
          }));
        },
      );

      if (newTree === state.tree) return state;

      const recalced = recalcTreeFromRoot(newTree, state.totalPopulation);
      return { ...state, tree: recalced };
    }

    case 'RESET': {
      return initialState;
    }
  }
}

/**
 * Custom hook wrapping React useReducer for the dashboard tree state.
 *
 * Returns the current state and a dispatch function for TreeAction.
 * The hook is intentionally thin -- UI components compose actions as needed.
 *
 * @returns Object with `state` (DashboardState) and `dispatch` (React.Dispatch<TreeAction>)
 */
export function useTreeState(): {
  state: DashboardState;
  dispatch: React.Dispatch<TreeAction>;
} {
  const [state, dispatch] = useReducer(treeReducer, initialState);
  return { state, dispatch };
}
