import { largestRemainder } from '@/data/dataHelpers';
import type { TreeNode } from '@/types';

/**
 * Minimal sibling info extracted from tree nodes for auto-balance calculations.
 */
export interface SiblingInfo {
  /** Node ID */
  id: string;
  /** Current percentage (0-100) */
  percentage: number;
  /** Whether the node is locked */
  isLocked: boolean;
}

/**
 * Find a node by its ID in the tree via depth-first search.
 *
 * @param tree - Root of the tree to search
 * @param id - Node ID to find
 * @returns The matching node, or undefined if not found
 */
export function findNodeById(tree: TreeNode, id: string): TreeNode | undefined {
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Find the parent of a node with the given ID.
 *
 * @param tree - Root of the tree to search
 * @param childId - ID of the child whose parent we want
 * @returns The parent node, or undefined if childId is root or not found
 */
export function findParentById(
  tree: TreeNode,
  childId: string,
): TreeNode | undefined {
  for (const child of tree.children) {
    if (child.id === childId) return tree;
    const found = findParentById(child, childId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Return a new tree with a single node replaced by the updater result.
 * Immutable: clones the path from root to the target node.
 *
 * @param tree - Root of the tree
 * @param id - ID of the node to update
 * @param updater - Function that receives the found node and returns a new node
 * @returns A new tree with the updated node; original tree is unchanged.
 *          If the ID is not found, returns a clone of the original tree.
 */
export function updateNodeInTree(
  tree: TreeNode,
  id: string,
  updater: (node: TreeNode) => TreeNode,
): TreeNode {
  if (tree.id === id) return updater(tree);
  const newChildren = tree.children.map((child) =>
    updateNodeInTree(child, id, updater),
  );
  return { ...tree, children: newChildren };
}

/**
 * Return a new tree with the children of a specific parent replaced.
 * Used for batch-updating sibling percentages after auto-balance.
 *
 * @param tree - Root of the tree
 * @param parentId - ID of the parent whose children to replace
 * @param updater - Function that receives the current children and returns new children
 * @returns A new tree with updated children; original tree is unchanged.
 */
export function updateChildrenInTree(
  tree: TreeNode,
  parentId: string,
  updater: (children: TreeNode[]) => TreeNode[],
): TreeNode {
  if (tree.id === parentId) {
    return { ...tree, children: updater(tree.children) };
  }
  const newChildren = tree.children.map((child) =>
    updateChildrenInTree(child, parentId, updater),
  );
  return { ...tree, children: newChildren };
}

/**
 * Extract sibling info from the children of a parent node.
 *
 * @param parent - The parent node whose children to collect
 * @returns Array of SiblingInfo objects
 */
export function collectSiblingInfo(parent: TreeNode): SiblingInfo[] {
  return parent.children.map((child) => ({
    id: child.id,
    percentage: child.percentage,
    isLocked: child.isLocked,
  }));
}

/**
 * Generate a unique node ID by appending a numeric suffix if collisions exist.
 *
 * Builds a candidate `${prefix}-${slug}`. If that ID already exists in the tree,
 * appends `-2`, `-3`, etc. until a unique ID is found.
 *
 * @param tree - Root of the tree to check for collisions
 * @param prefix - ID prefix (e.g., "male", "male-j")
 * @param slug - Slug derived from the node label
 * @returns A unique node ID string
 */
export function generateUniqueId(
  tree: TreeNode,
  prefix: string,
  slug: string,
): string {
  const base = `${prefix}-${slug}`;
  if (findNodeById(tree, base) === undefined) return base;

  let counter = 2;
  while (findNodeById(tree, `${base}-${counter}`) !== undefined) {
    counter++;
  }
  return `${base}-${counter}`;
}

/**
 * Add a child node to a parent and redistribute all children's percentages equally.
 *
 * Uses `largestRemainder` to ensure percentages sum to exactly 100.0 after redistribution.
 * The caller is responsible for calling `recalcAbsoluteValues` afterward.
 *
 * @param tree - Root of the tree
 * @param parentId - ID of the parent to add the child to
 * @param newChild - The new child node to add
 * @returns A new tree with the child added and percentages redistributed
 */
export function addChildToParent(
  tree: TreeNode,
  parentId: string,
  newChild: TreeNode,
): TreeNode {
  return updateChildrenInTree(tree, parentId, (children) => {
    const newChildren = [...children, newChild];
    const n = newChildren.length;
    const rawPercentages = Array.from({ length: n }, () => 100 / n);
    const rounded = largestRemainder(rawPercentages, 100, 1);
    return newChildren.map((child, i) => ({ ...child, percentage: rounded[i] }));
  });
}

/**
 * Remove a child node from a parent and redistribute remaining children's percentages equally.
 *
 * Blocks removal if the parent has only 1 child (gender must always have >= 1 industry).
 * Uses `largestRemainder` to ensure percentages sum to exactly 100.0 after redistribution.
 * The caller is responsible for calling `recalcAbsoluteValues` afterward.
 *
 * @param tree - Root of the tree
 * @param parentId - ID of the parent to remove the child from
 * @param childId - ID of the child to remove
 * @returns A new tree with the child removed and percentages redistributed,
 *          or the original tree if removal is blocked or parent/child not found
 */
export function removeChildFromParent(
  tree: TreeNode,
  parentId: string,
  childId: string,
): TreeNode {
  const parent = findNodeById(tree, parentId);
  if (!parent || parent.children.length <= 1) return tree;

  return updateChildrenInTree(tree, parentId, (children) => {
    const remaining = children.filter((c) => c.id !== childId);
    if (remaining.length === children.length) return children;

    const n = remaining.length;
    const rawPercentages = Array.from({ length: n }, () => 100 / n);
    const rounded = largestRemainder(rawPercentages, 100, 1);
    return remaining.map((child, i) => ({ ...child, percentage: rounded[i] }));
  });
}
