import { largestRemainder } from '@/data/dataHelpers';
import type { TreeNode } from '@/types';

import type { SiblingInfo } from './treeUtils';

/**
 * Result of auto-balance: new percentage for a sibling.
 */
export interface PercentageUpdate {
  /** Node ID */
  id: string;
  /** New percentage value (0-100, 1 decimal place) */
  percentage: number;
}

/**
 * Auto-balance sibling percentages after a user changes one node.
 *
 * Algorithm:
 * 1. Separate locked, changed, and unlocked siblings
 * 2. Clamp the changed value to [0, 100 - lockedSum]
 * 3. Calculate remaining budget for unlocked siblings
 * 4. Distribute remaining proportionally (or equally if all unlocked are at 0%)
 * 5. Apply largestRemainder for exact 100.0 sum at 1 decimal place
 *
 * @param siblings - All siblings in the group (children of the same parent)
 * @param changedId - ID of the node the user changed
 * @param newValue - Desired new percentage for the changed node
 * @returns Array of PercentageUpdate for ALL siblings (preserving original order)
 */
export function autoBalance(
  siblings: readonly SiblingInfo[],
  changedId: string,
  newValue: number,
): PercentageUpdate[] {
  const locked = siblings.filter((s) => s.isLocked && s.id !== changedId);
  const lockedSum = locked.reduce((sum, s) => sum + s.percentage, 0);
  const unlocked = siblings.filter((s) => !s.isLocked && s.id !== changedId);

  // Clamp the changed value so changed + locked <= 100
  const clampedValue = Math.max(0, Math.min(newValue, 100 - lockedSum));
  const remaining = 100 - clampedValue - lockedSum;

  // Distribute remaining among unlocked siblings
  const oldUnlockedSum = unlocked.reduce((sum, s) => sum + s.percentage, 0);
  let rawPercentages: number[];

  if (unlocked.length === 0) {
    rawPercentages = [];
  } else if (oldUnlockedSum === 0) {
    // All unlocked siblings are at 0% -- distribute equally
    const share = remaining / unlocked.length;
    rawPercentages = unlocked.map(() => share);
  } else {
    // Proportional distribution
    rawPercentages = unlocked.map(
      (s) => (s.percentage / oldUnlockedSum) * remaining,
    );
  }

  // Assemble all raw percentages in original sibling order
  const allRaw = siblings.map((s) => {
    if (s.id === changedId) return clampedValue;
    if (s.isLocked) return s.percentage;
    const idx = unlocked.findIndex((u) => u.id === s.id);
    return rawPercentages[idx];
  });

  // Apply largest remainder rounding for exact 100.0 sum
  const rounded = largestRemainder(allRaw, 100, 1);
  return siblings.map((s, i) => ({ id: s.id, percentage: rounded[i] }));
}

/**
 * Normalize a group of percentages to sum to exactly 100.
 * Used when switching from free mode to auto mode.
 *
 * @param percentages - Current percentages of a sibling group
 * @returns Array of normalized percentages summing to exactly 100.0
 */
export function normalizeGroup(percentages: readonly number[]): number[] {
  if (percentages.length === 0) return [];

  const sum = percentages.reduce((s, v) => s + v, 0);

  if (sum === 0) {
    // All zero: distribute equally
    const equalShare = 100 / percentages.length;
    const raw = percentages.map(() => equalShare);
    return largestRemainder(raw, 100, 1);
  }

  // Proportional scale to 100
  const raw = percentages.map((v) => (v / sum) * 100);
  return largestRemainder(raw, 100, 1);
}

/**
 * Recursively recalculate absolute values from a parent's absolute value.
 * Each node's absoluteValue = Math.round(parentAbsoluteValue * percentage / 100).
 *
 * @param node - The node to recalculate
 * @param parentAbsoluteValue - The absolute value of this node's parent
 * @returns A new tree node with recalculated absolute values (immutable)
 */
export function recalcAbsoluteValues(
  node: TreeNode,
  parentAbsoluteValue: number,
): TreeNode {
  const absoluteValue = Math.round(
    (parentAbsoluteValue * node.percentage) / 100,
  );
  const children = node.children.map((child) =>
    recalcAbsoluteValues(child, absoluteValue),
  );
  return { ...node, absoluteValue, children };
}

/**
 * Get the percentage deviation of a sibling group from 100%.
 * Used in free mode to expose how far the group is from balanced.
 *
 * @param parentNode - The parent node whose children to check
 * @returns Deviation from 100% rounded to 1 decimal place. Positive = over 100%, negative = under.
 *          Returns 0 if the parent has no children.
 */
export function getSiblingDeviation(parentNode: TreeNode): number {
  if (parentNode.children.length === 0) return 0;
  const sum = parentNode.children.reduce((s, c) => s + c.percentage, 0);
  return Math.round((sum - 100) * 10) / 10;
}

/**
 * Check whether a node's lock can be toggled.
 * Prevents locking the last unlocked sibling in a group (auto-balance needs
 * at least one unlocked sibling for redistribution).
 *
 * @param nodeId - ID of the node to check
 * @param siblings - All siblings in the group (children of the same parent)
 * @returns true if the toggle is allowed, false if it would leave 0 unlocked siblings
 */
export function canToggleLock(
  nodeId: string,
  siblings: readonly TreeNode[],
): boolean {
  const node = siblings.find((s) => s.id === nodeId);
  if (!node) return false;

  // Unlocking is always allowed
  if (node.isLocked) return true;

  // Locking: need at least 2 currently unlocked (so 1 remains after locking)
  const currentlyUnlocked = siblings.filter((s) => !s.isLocked);
  return currentlyUnlocked.length >= 2;
}
