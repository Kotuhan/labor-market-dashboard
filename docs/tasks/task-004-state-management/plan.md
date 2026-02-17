# Implementation Plan: task-004 -- Core State Management and Auto-Balance Logic

Generated: 2026-02-17

## Overview

This plan implements the core state management layer for the Labor Market Dashboard. It covers all 9 steps from the TL design: action types, tree utility functions, calculation functions, reducer + hook, barrel exports, and comprehensive tests. All code is pure logic (no JSX, no CSS) using React `useReducer`.

**Total new files**: 9
**Total modified files**: 1
**Total estimated test cases**: ~58

---

## Step 1: Create Action Types

### File: `apps/labor-market-dashboard/src/types/actions.ts` (NEW)

```typescript
import type { BalanceMode } from './tree';

/**
 * Actions dispatched to the tree state reducer.
 *
 * Discriminated union on the `type` field. Used with React `useReducer`.
 *
 * - `SET_PERCENTAGE`: Change a node's percentage (triggers auto-balance in auto mode)
 * - `TOGGLE_LOCK`: Toggle a node's isLocked flag (with lock guard)
 * - `SET_BALANCE_MODE`: Switch between auto and free mode
 * - `SET_TOTAL_POPULATION`: Change total population (recalculates absolute values)
 * - `RESET`: Restore the entire state to defaults
 */
export type TreeAction =
  | { type: 'SET_PERCENTAGE'; nodeId: string; value: number }
  | { type: 'TOGGLE_LOCK'; nodeId: string }
  | { type: 'SET_BALANCE_MODE'; mode: BalanceMode }
  | { type: 'SET_TOTAL_POPULATION'; value: number }
  | { type: 'RESET' };
```

**Key decisions:**
- String literal discriminants (not enums) per project convention.
- `BalanceMode` imported from sibling `./tree` module.
- No payload on `RESET` -- returns to `initialState` unconditionally.

### File: `apps/labor-market-dashboard/src/types/index.ts` (MODIFY)

```typescript
export type {
  BalanceMode,
  DashboardState,
  GenderSplit,
  TreeNode,
} from './tree';

export type { TreeAction } from './actions';
```

**Key decisions:**
- Uses `export type` for type-only barrel (zero runtime JS).
- `TreeAction` added in its own export statement after existing exports.

---

## Step 2: Create Tree Utility Functions

### File: `apps/labor-market-dashboard/src/utils/treeUtils.ts` (NEW)

```typescript
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
```

**Key decisions:**
- `SiblingInfo` is defined here (co-located with `collectSiblingInfo` and used by `calculations.ts`).
- All functions are pure and return new objects (immutable updates).
- `updateNodeInTree` clones the entire path from root to target -- for 55 nodes this is negligible cost.
- `updateChildrenInTree` is separate from `updateNodeInTree` because auto-balance updates ALL children of a parent simultaneously.

---

## Step 3: Create Tree Utility Tests

### File: `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';

import type { TreeNode } from '@/types';
import {
  findNodeById,
  findParentById,
  updateNodeInTree,
  updateChildrenInTree,
  collectSiblingInfo,
} from '@/utils/treeUtils';

/**
 * Small test fixture tree:
 *
 *   root (100%, abs=1000)
 *   |- child-a (60%, abs=600)
 *   |  |- grandchild-a1 (70%, abs=420)
 *   |  +- grandchild-a2 (30%, abs=180, locked)
 *   +- child-b (40%, abs=400)
 */
function createTestTree(): TreeNode {
  return {
    id: 'root',
    label: 'Root',
    percentage: 100,
    defaultPercentage: 100,
    absoluteValue: 1000,
    genderSplit: { male: 50, female: 50 },
    isLocked: false,
    children: [
      {
        id: 'child-a',
        label: 'Child A',
        percentage: 60,
        defaultPercentage: 60,
        absoluteValue: 600,
        genderSplit: { male: 50, female: 50 },
        isLocked: false,
        children: [
          {
            id: 'grandchild-a1',
            label: 'Grandchild A1',
            percentage: 70,
            defaultPercentage: 70,
            absoluteValue: 420,
            genderSplit: { male: 50, female: 50 },
            isLocked: false,
            children: [],
          },
          {
            id: 'grandchild-a2',
            label: 'Grandchild A2',
            percentage: 30,
            defaultPercentage: 30,
            absoluteValue: 180,
            genderSplit: { male: 50, female: 50 },
            isLocked: true,
            children: [],
          },
        ],
      },
      {
        id: 'child-b',
        label: 'Child B',
        percentage: 40,
        defaultPercentage: 40,
        absoluteValue: 400,
        genderSplit: { male: 50, female: 50 },
        isLocked: false,
        children: [],
      },
    ],
  };
}

describe('findNodeById', () => {
  it('finds the root node', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'root');

    expect(result).toBeDefined();
    expect(result!.id).toBe('root');
  });

  it('finds a leaf node', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'grandchild-a1');

    expect(result).toBeDefined();
    expect(result!.id).toBe('grandchild-a1');
    expect(result!.label).toBe('Grandchild A1');
  });

  it('returns undefined for a missing ID', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'nonexistent');

    expect(result).toBeUndefined();
  });
});

describe('findParentById', () => {
  it('finds the parent of a known child', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'child-a');

    expect(parent).toBeDefined();
    expect(parent!.id).toBe('root');
  });

  it('finds the parent of a grandchild', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'grandchild-a1');

    expect(parent).toBeDefined();
    expect(parent!.id).toBe('child-a');
  });

  it('returns undefined for the root node (root has no parent)', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'root');

    expect(parent).toBeUndefined();
  });

  it('returns undefined for a missing ID', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'nonexistent');

    expect(parent).toBeUndefined();
  });
});

describe('updateNodeInTree', () => {
  it('updates a leaf node percentage', () => {
    const tree = createTestTree();
    const updated = updateNodeInTree(tree, 'grandchild-a1', (node) => ({
      ...node,
      percentage: 80,
    }));

    const target = findNodeById(updated, 'grandchild-a1');
    expect(target!.percentage).toBe(80);
  });

  it('preserves immutability (original tree is unchanged)', () => {
    const tree = createTestTree();
    const updated = updateNodeInTree(tree, 'grandchild-a1', (node) => ({
      ...node,
      percentage: 80,
    }));

    // Original unchanged
    const originalTarget = findNodeById(tree, 'grandchild-a1');
    expect(originalTarget!.percentage).toBe(70);

    // Updated tree has new value
    const updatedTarget = findNodeById(updated, 'grandchild-a1');
    expect(updatedTarget!.percentage).toBe(80);

    // Root references are different
    expect(updated).not.toBe(tree);
  });

  it('returns a tree with same structure when ID is not found', () => {
    const tree = createTestTree();
    const updated = updateNodeInTree(tree, 'nonexistent', (node) => ({
      ...node,
      percentage: 99,
    }));

    // Structure is the same but objects are cloned
    expect(findNodeById(updated, 'root')!.percentage).toBe(100);
    expect(findNodeById(updated, 'child-a')!.percentage).toBe(60);
  });
});

describe('updateChildrenInTree', () => {
  it('updates children of a specified parent', () => {
    const tree = createTestTree();
    const updated = updateChildrenInTree(tree, 'child-a', (children) =>
      children.map((c) => ({ ...c, percentage: 50 })),
    );

    const parent = findNodeById(updated, 'child-a');
    expect(parent!.children[0].percentage).toBe(50);
    expect(parent!.children[1].percentage).toBe(50);
  });

  it('preserves immutability', () => {
    const tree = createTestTree();
    const updated = updateChildrenInTree(tree, 'child-a', (children) =>
      children.map((c) => ({ ...c, percentage: 50 })),
    );

    // Original unchanged
    const originalParent = findNodeById(tree, 'child-a');
    expect(originalParent!.children[0].percentage).toBe(70);
    expect(originalParent!.children[1].percentage).toBe(30);

    // New tree is different reference
    expect(updated).not.toBe(tree);
  });
});

describe('collectSiblingInfo', () => {
  it('extracts correct info from children array', () => {
    const tree = createTestTree();
    const info = collectSiblingInfo(tree);

    expect(info).toHaveLength(2);
    expect(info[0]).toEqual({ id: 'child-a', percentage: 60, isLocked: false });
    expect(info[1]).toEqual({ id: 'child-b', percentage: 40, isLocked: false });
  });

  it('includes isLocked status', () => {
    const tree = createTestTree();
    const childA = findNodeById(tree, 'child-a')!;
    const info = collectSiblingInfo(childA);

    expect(info).toHaveLength(2);
    expect(info[0]).toEqual({
      id: 'grandchild-a1',
      percentage: 70,
      isLocked: false,
    });
    expect(info[1]).toEqual({
      id: 'grandchild-a2',
      percentage: 30,
      isLocked: true,
    });
  });

  it('returns empty array for leaf node', () => {
    const tree = createTestTree();
    const leaf = findNodeById(tree, 'child-b')!;
    const info = collectSiblingInfo(leaf);

    expect(info).toEqual([]);
  });
});
```

**Key decisions:**
- Uses a small 5-node fixture tree (not the full 55-node `defaultTree`) for fast, readable tests.
- Tests cover all 5 exported functions.
- Immutability is explicitly verified by checking original tree is unchanged.
- 15 test cases total (exceeds the TL design's 8+ minimum).

---

## Step 4: Create Calculation Functions

### File: `apps/labor-market-dashboard/src/utils/calculations.ts` (NEW)

```typescript
import type { TreeNode } from '@/types';
import { largestRemainder } from '@/data/dataHelpers';
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
```

**Key decisions:**
- `PercentageUpdate` is defined here (co-located with `autoBalance` which produces it).
- `SiblingInfo` is imported from `treeUtils.ts` (single definition, no duplication).
- `autoBalance` always applies `largestRemainder` as the final step, guaranteeing exact 100.0 sums.
- `normalizeGroup` handles the all-zero edge case with equal distribution.
- `recalcAbsoluteValues` takes `parentAbsoluteValue` as a parameter (for the root node, the caller passes `totalPopulation`).
- `canToggleLock` operates on `TreeNode[]` (not `SiblingInfo[]`) because it needs the full node for `isLocked` check.

---

## Step 5: Create Calculation Tests

### File: `apps/labor-market-dashboard/src/__tests__/utils/calculations.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';

import type { TreeNode } from '@/types';
import {
  autoBalance,
  normalizeGroup,
  recalcAbsoluteValues,
  getSiblingDeviation,
  canToggleLock,
} from '@/utils/calculations';
import type { SiblingInfo } from '@/utils/treeUtils';

/** Helper: sum an array of numbers. */
function sum(values: number[]): number {
  return values.reduce((s, v) => s + v, 0);
}

/** Helper: create a minimal TreeNode for testing. */
function makeNode(overrides: Partial<TreeNode> & { id: string }): TreeNode {
  return {
    label: overrides.id,
    percentage: 0,
    defaultPercentage: 0,
    absoluteValue: 0,
    genderSplit: { male: 50, female: 50 },
    isLocked: false,
    children: [],
    ...overrides,
  };
}

// -------------------------------------------------------
// autoBalance tests
// -------------------------------------------------------
describe('autoBalance', () => {
  it('redistributes proportionally among 3 unlocked siblings', () => {
    const siblings: SiblingInfo[] = [
      { id: 'A', percentage: 30, isLocked: false },
      { id: 'B', percentage: 40, isLocked: false },
      { id: 'C', percentage: 30, isLocked: false },
    ];

    const result = autoBalance(siblings, 'A', 50);
    const percentages = result.map((r) => r.percentage);

    expect(sum(percentages)).toBeCloseTo(100, 1);
    // A gets 50, B and C split remaining 50 proportionally (40:30 = 4:3)
    // B: (40/70)*50 = 28.571... -> ~28.6
    // C: (30/70)*50 = 21.428... -> ~21.4
    expect(result.find((r) => r.id === 'A')!.percentage).toBe(50);
    expect(result.find((r) => r.id === 'B')!.percentage).toBeCloseTo(28.6, 1);
    expect(result.find((r) => r.id === 'C')!.percentage).toBeCloseTo(21.4, 1);
  });

  it('excludes locked sibling from redistribution', () => {
    const siblings: SiblingInfo[] = [
      { id: 'A', percentage: 30, isLocked: false },
      { id: 'B', percentage: 40, isLocked: true },
      { id: 'C', percentage: 30, isLocked: false },
    ];

    const result = autoBalance(siblings, 'A', 50);

    expect(result.find((r) => r.id === 'B')!.percentage).toBe(40);
    expect(result.find((r) => r.id === 'A')!.percentage).toBe(50);
    expect(result.find((r) => r.id === 'C')!.percentage).toBe(10);
    expect(sum(result.map((r) => r.percentage))).toBeCloseTo(100, 1);
  });

  it('clamps changed value when all but changed are locked', () => {
    const siblings: SiblingInfo[] = [
      { id: 'A', percentage: 30, isLocked: false },
      { id: 'B', percentage: 40, isLocked: true },
      { id: 'C', percentage: 30, isLocked: true },
    ];

    const result = autoBalance(siblings, 'A', 50);

    // Max possible: 100 - 40 - 30 = 30, so A is clamped to 30
    expect(result.find((r) => r.id === 'A')!.percentage).toBe(30);
    expect(result.find((r) => r.id === 'B')!.percentage).toBe(40);
    expect(result.find((r) => r.id === 'C')!.percentage).toBe(30);
  });

  it('distributes equally when unlocked siblings are all at 0%', () => {
    const siblings: SiblingInfo[] = [
      { id: 'A', percentage: 100, isLocked: false },
      { id: 'B', percentage: 0, isLocked: false },
      { id: 'C', percentage: 0, isLocked: false },
    ];

    const result = autoBalance(siblings, 'A', 40);

    expect(result.find((r) => r.id === 'A')!.percentage).toBe(40);
    // Remaining 60 split equally between B and C
    expect(result.find((r) => r.id === 'B')!.percentage).toBe(30);
    expect(result.find((r) => r.id === 'C')!.percentage).toBe(30);
  });

  it('handles single unlocked sibling absorbing all remaining', () => {
    const siblings: SiblingInfo[] = [
      { id: 'A', percentage: 30, isLocked: false },
      { id: 'B', percentage: 40, isLocked: true },
      { id: 'C', percentage: 30, isLocked: false },
    ];

    const result = autoBalance(siblings, 'A', 20);

    expect(result.find((r) => r.id === 'A')!.percentage).toBe(20);
    expect(result.find((r) => r.id === 'B')!.percentage).toBe(40);
    expect(result.find((r) => r.id === 'C')!.percentage).toBe(40);
  });

  it('handles changed to 0% -- distributes all to unlocked', () => {
    const siblings: SiblingInfo[] = [
      { id: 'A', percentage: 30, isLocked: false },
      { id: 'B', percentage: 40, isLocked: false },
      { id: 'C', percentage: 30, isLocked: false },
    ];

    const result = autoBalance(siblings, 'A', 0);

    expect(result.find((r) => r.id === 'A')!.percentage).toBe(0);
    // B and C get remaining 100 proportionally (40:30)
    expect(result.find((r) => r.id === 'B')!.percentage).toBeCloseTo(57.1, 1);
    expect(result.find((r) => r.id === 'C')!.percentage).toBeCloseTo(42.9, 1);
    expect(sum(result.map((r) => r.percentage))).toBeCloseTo(100, 1);
  });

  it('handles changed to max (all unlocked go to 0)', () => {
    const siblings: SiblingInfo[] = [
      { id: 'A', percentage: 30, isLocked: false },
      { id: 'B', percentage: 40, isLocked: false },
      { id: 'C', percentage: 30, isLocked: false },
    ];

    const result = autoBalance(siblings, 'A', 100);

    expect(result.find((r) => r.id === 'A')!.percentage).toBe(100);
    expect(result.find((r) => r.id === 'B')!.percentage).toBe(0);
    expect(result.find((r) => r.id === 'C')!.percentage).toBe(0);
  });

  it('handles 2-sibling group (gender): simple complement', () => {
    const siblings: SiblingInfo[] = [
      { id: 'male', percentage: 52.66, isLocked: false },
      { id: 'female', percentage: 47.34, isLocked: false },
    ];

    const result = autoBalance(siblings, 'male', 60);

    expect(result.find((r) => r.id === 'male')!.percentage).toBe(60);
    expect(result.find((r) => r.id === 'female')!.percentage).toBe(40);
    expect(sum(result.map((r) => r.percentage))).toBeCloseTo(100, 1);
  });

  it('produces percentages summing to exactly 100.0 (largestRemainder)', () => {
    const siblings: SiblingInfo[] = [
      { id: 'A', percentage: 33.3, isLocked: false },
      { id: 'B', percentage: 33.3, isLocked: false },
      { id: 'C', percentage: 33.4, isLocked: false },
    ];

    const result = autoBalance(siblings, 'A', 50);
    const total = sum(result.map((r) => r.percentage));

    // Must be exactly 100.0 (not 99.9 or 100.1)
    expect(total).toBe(100);
  });
});

// -------------------------------------------------------
// normalizeGroup tests
// -------------------------------------------------------
describe('normalizeGroup', () => {
  it('proportionally scales to 100', () => {
    const result = normalizeGroup([30, 40, 45]);

    expect(sum(result)).toBeCloseTo(100, 1);
    expect(result).toHaveLength(3);
    // 30/115 * 100 = 26.087, 40/115 * 100 = 34.783, 45/115 * 100 = 39.130
    expect(result[0]).toBeCloseTo(26.1, 1);
    expect(result[1]).toBeCloseTo(34.8, 1);
    expect(result[2]).toBeCloseTo(39.1, 1);
  });

  it('returns same values when already at 100', () => {
    const result = normalizeGroup([50, 30, 20]);

    expect(result).toEqual([50, 30, 20]);
  });

  it('distributes equally when all are zero', () => {
    const result = normalizeGroup([0, 0, 0]);

    expect(sum(result)).toBeCloseTo(100, 1);
    // Each should be ~33.3 or 33.4
    for (const v of result) {
      expect(v).toBeCloseTo(33.3, 0);
    }
  });

  it('gives 100 to a single child', () => {
    const result = normalizeGroup([42]);

    expect(result).toEqual([100]);
  });

  it('returns empty array for empty input', () => {
    const result = normalizeGroup([]);

    expect(result).toEqual([]);
  });
});

// -------------------------------------------------------
// recalcAbsoluteValues tests
// -------------------------------------------------------
describe('recalcAbsoluteValues', () => {
  it('calculates absolute values for root with 2 children', () => {
    const tree = makeNode({
      id: 'root',
      percentage: 100,
      absoluteValue: 0,
      children: [
        makeNode({ id: 'a', percentage: 60 }),
        makeNode({ id: 'b', percentage: 40 }),
      ],
    });

    const result = recalcAbsoluteValues(tree, 1000);

    expect(result.absoluteValue).toBe(1000);
    expect(result.children[0].absoluteValue).toBe(600);
    expect(result.children[1].absoluteValue).toBe(400);
  });

  it('cascades through 3 levels', () => {
    const tree = makeNode({
      id: 'root',
      percentage: 100,
      children: [
        makeNode({
          id: 'child',
          percentage: 50,
          children: [
            makeNode({ id: 'grandchild', percentage: 30 }),
          ],
        }),
      ],
    });

    const result = recalcAbsoluteValues(tree, 10000);

    expect(result.absoluteValue).toBe(10000);
    expect(result.children[0].absoluteValue).toBe(5000);
    expect(result.children[0].children[0].absoluteValue).toBe(1500);
  });

  it('uses Math.round for rounding', () => {
    const tree = makeNode({
      id: 'root',
      percentage: 100,
      children: [
        makeNode({ id: 'a', percentage: 33.3 }),
      ],
    });

    const result = recalcAbsoluteValues(tree, 1000);

    // 1000 * 33.3 / 100 = 333.0
    expect(result.children[0].absoluteValue).toBe(333);
  });

  it('returns immutable result (new objects)', () => {
    const tree = makeNode({
      id: 'root',
      percentage: 100,
      children: [makeNode({ id: 'a', percentage: 50 })],
    });

    const result = recalcAbsoluteValues(tree, 2000);

    expect(result).not.toBe(tree);
    expect(result.children[0]).not.toBe(tree.children[0]);
  });
});

// -------------------------------------------------------
// getSiblingDeviation tests
// -------------------------------------------------------
describe('getSiblingDeviation', () => {
  it('returns 0 when children sum to 100', () => {
    const parent = makeNode({
      id: 'parent',
      children: [
        makeNode({ id: 'a', percentage: 60 }),
        makeNode({ id: 'b', percentage: 40 }),
      ],
    });

    expect(getSiblingDeviation(parent)).toBe(0);
  });

  it('returns positive deviation when over 100', () => {
    const parent = makeNode({
      id: 'parent',
      children: [
        makeNode({ id: 'a', percentage: 60 }),
        makeNode({ id: 'b', percentage: 55 }),
      ],
    });

    expect(getSiblingDeviation(parent)).toBe(15);
  });

  it('returns negative deviation when under 100', () => {
    const parent = makeNode({
      id: 'parent',
      children: [
        makeNode({ id: 'a', percentage: 50 }),
        makeNode({ id: 'b', percentage: 40 }),
      ],
    });

    expect(getSiblingDeviation(parent)).toBe(-10);
  });

  it('returns 0 for node with no children', () => {
    const leaf = makeNode({ id: 'leaf' });

    expect(getSiblingDeviation(leaf)).toBe(0);
  });

  it('rounds to 1 decimal place', () => {
    const parent = makeNode({
      id: 'parent',
      children: [
        makeNode({ id: 'a', percentage: 33.33 }),
        makeNode({ id: 'b', percentage: 33.33 }),
        makeNode({ id: 'c', percentage: 33.33 }),
      ],
    });

    // sum = 99.99, deviation = -0.01 -> rounds to 0
    expect(getSiblingDeviation(parent)).toBe(0);
  });
});

// -------------------------------------------------------
// canToggleLock tests
// -------------------------------------------------------
describe('canToggleLock', () => {
  it('allows locking when 3 siblings, 0 locked', () => {
    const siblings = [
      makeNode({ id: 'a', isLocked: false }),
      makeNode({ id: 'b', isLocked: false }),
      makeNode({ id: 'c', isLocked: false }),
    ];

    expect(canToggleLock('a', siblings)).toBe(true);
  });

  it('allows locking when 3 siblings, 1 already locked', () => {
    const siblings = [
      makeNode({ id: 'a', isLocked: false }),
      makeNode({ id: 'b', isLocked: true }),
      makeNode({ id: 'c', isLocked: false }),
    ];

    expect(canToggleLock('a', siblings)).toBe(true);
  });

  it('prevents locking the last unlocked sibling', () => {
    const siblings = [
      makeNode({ id: 'a', isLocked: false }),
      makeNode({ id: 'b', isLocked: true }),
      makeNode({ id: 'c', isLocked: true }),
    ];

    expect(canToggleLock('a', siblings)).toBe(false);
  });

  it('always allows unlocking', () => {
    const siblings = [
      makeNode({ id: 'a', isLocked: true }),
      makeNode({ id: 'b', isLocked: true }),
      makeNode({ id: 'c', isLocked: true }),
    ];

    expect(canToggleLock('a', siblings)).toBe(true);
  });

  it('returns false for nonexistent node ID', () => {
    const siblings = [
      makeNode({ id: 'a', isLocked: false }),
      makeNode({ id: 'b', isLocked: false }),
    ];

    expect(canToggleLock('nonexistent', siblings)).toBe(false);
  });
});
```

**Key decisions:**
- `makeNode` helper creates minimal `TreeNode` objects with sensible defaults, avoiding verbose boilerplate.
- Tests verify both the algorithm correctness AND the `largestRemainder` rounding (sum === 100).
- `toBeCloseTo` used for proportional redistribution where exact values depend on rounding.
- 23 test cases total (exceeds TL design's 15+ minimum).

---

## Step 6: Create Barrel Export for Utils

### File: `apps/labor-market-dashboard/src/utils/index.ts` (NEW)

```typescript
export {
  autoBalance,
  canToggleLock,
  getSiblingDeviation,
  normalizeGroup,
  recalcAbsoluteValues,
} from './calculations';

export type { PercentageUpdate } from './calculations';

export {
  collectSiblingInfo,
  findNodeById,
  findParentById,
  updateChildrenInTree,
  updateNodeInTree,
} from './treeUtils';

export type { SiblingInfo } from './treeUtils';
```

**Key decisions:**
- Named exports (no `export *`) for explicitness per project convention.
- `SiblingInfo` and `PercentageUpdate` use `export type` since they are interfaces (type-only re-exports have zero runtime cost).
- Value exports and type exports are grouped by source module.
- Alphabetical ordering within each group.

---

## Step 7: Create Reducer and Hook

### File: `apps/labor-market-dashboard/src/hooks/useTreeState.ts` (NEW)

```typescript
import { useReducer } from 'react';

import type { DashboardState, TreeAction, TreeNode } from '@/types';
import { defaultTree } from '@/data';
import {
  autoBalance,
  canToggleLock,
  normalizeGroup,
  recalcAbsoluteValues,
} from '@/utils/calculations';
import {
  collectSiblingInfo,
  findNodeById,
  findParentById,
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
 * Handles 5 action types:
 * - SET_PERCENTAGE: Change a node's percentage (auto-balance or free mode)
 * - TOGGLE_LOCK: Toggle a node's lock state (with guard)
 * - SET_BALANCE_MODE: Switch between auto and free mode
 * - SET_TOTAL_POPULATION: Change total population
 * - RESET: Restore to initial state
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
```

**Key decisions:**
- `treeReducer` is exported for direct unit testing (no React rendering needed in tests).
- `initialState` is exported for test assertions and for potential future use.
- `normalizeTree` is a private helper (not exported) used only by `SET_BALANCE_MODE`.
- `recalcTreeFromRoot` handles the root node specially (sets `absoluteValue` directly to `totalPopulation`, then recalculates children).
- `SET_PERCENTAGE` on a locked node is a no-op.
- `SET_PERCENTAGE` on root is a no-op (root percentage is always 100).
- `TOGGLE_LOCK` on root is a no-op (root cannot be locked).
- Free mode `SET_PERCENTAGE` clamps to [0, 100] but does not affect siblings.
- The switch is exhaustive (TypeScript will error if a new action type is added without handling).
- `useTreeState` returns `{ state, dispatch }` -- intentionally minimal, no convenience wrappers.

### File: `apps/labor-market-dashboard/src/hooks/index.ts` (NEW)

```typescript
export { initialState, treeReducer, useTreeState } from './useTreeState';
```

**Key decisions:**
- Value exports (not `export type`) because `treeReducer` and `initialState` are runtime values, and `useTreeState` is a function.
- `initialState` exported so tests can assert against it.

---

## Step 8: Create Reducer and Hook Tests

### File: `apps/labor-market-dashboard/src/__tests__/hooks/useTreeState.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';

import type { DashboardState, TreeAction, TreeNode } from '@/types';
import { defaultTree } from '@/data';
import { treeReducer, initialState } from '@/hooks/useTreeState';
import { findNodeById } from '@/utils/treeUtils';

/** Helper: sum percentages of children. */
function childPercentageSum(parent: TreeNode): number {
  return parent.children.reduce((s, c) => s + c.percentage, 0);
}

/** Helper: create a small test state for fast tests. */
function createSmallState(): DashboardState {
  const tree: TreeNode = {
    id: 'root',
    label: 'Root',
    percentage: 100,
    defaultPercentage: 100,
    absoluteValue: 1000,
    genderSplit: { male: 50, female: 50 },
    isLocked: false,
    children: [
      {
        id: 'a',
        label: 'A',
        percentage: 30,
        defaultPercentage: 30,
        absoluteValue: 300,
        genderSplit: { male: 50, female: 50 },
        isLocked: false,
        children: [],
      },
      {
        id: 'b',
        label: 'B',
        percentage: 40,
        defaultPercentage: 40,
        absoluteValue: 400,
        genderSplit: { male: 50, female: 50 },
        isLocked: false,
        children: [],
      },
      {
        id: 'c',
        label: 'C',
        percentage: 30,
        defaultPercentage: 30,
        absoluteValue: 300,
        genderSplit: { male: 50, female: 50 },
        isLocked: false,
        children: [],
      },
    ],
  };

  return {
    totalPopulation: 1000,
    balanceMode: 'auto',
    tree,
  };
}

// -------------------------------------------------------
// Initial state
// -------------------------------------------------------
describe('initialState', () => {
  it('matches defaultTree structure', () => {
    expect(initialState.totalPopulation).toBe(13_500_000);
    expect(initialState.balanceMode).toBe('auto');
    expect(initialState.tree.id).toBe('root');
    expect(initialState.tree).toBe(defaultTree);
  });
});

// -------------------------------------------------------
// SET_PERCENTAGE
// -------------------------------------------------------
describe('SET_PERCENTAGE', () => {
  it('auto-balances siblings to sum to 100 in auto mode', () => {
    const state = createSmallState();
    const action: TreeAction = {
      type: 'SET_PERCENTAGE',
      nodeId: 'a',
      value: 50,
    };

    const newState = treeReducer(state, action);
    const sum = childPercentageSum(newState.tree);

    expect(sum).toBeCloseTo(100, 1);
    expect(findNodeById(newState.tree, 'a')!.percentage).toBe(50);
  });

  it('recalculates absolute values after percentage change', () => {
    const state = createSmallState();
    const action: TreeAction = {
      type: 'SET_PERCENTAGE',
      nodeId: 'a',
      value: 50,
    };

    const newState = treeReducer(state, action);
    const nodeA = findNodeById(newState.tree, 'a')!;

    expect(nodeA.absoluteValue).toBe(500); // 1000 * 50 / 100
  });

  it('only changes target node in free mode', () => {
    const state: DashboardState = {
      ...createSmallState(),
      balanceMode: 'free',
    };
    const action: TreeAction = {
      type: 'SET_PERCENTAGE',
      nodeId: 'a',
      value: 50,
    };

    const newState = treeReducer(state, action);

    expect(findNodeById(newState.tree, 'a')!.percentage).toBe(50);
    expect(findNodeById(newState.tree, 'b')!.percentage).toBe(40);
    expect(findNodeById(newState.tree, 'c')!.percentage).toBe(30);
  });

  it('is no-op when target node is locked', () => {
    const state = createSmallState();
    // Lock node 'a'
    const lockedState = treeReducer(state, {
      type: 'TOGGLE_LOCK',
      nodeId: 'a',
    });
    const action: TreeAction = {
      type: 'SET_PERCENTAGE',
      nodeId: 'a',
      value: 50,
    };

    const newState = treeReducer(lockedState, action);

    expect(newState).toBe(lockedState); // Same reference = no change
  });

  it('is no-op when nodeId is root', () => {
    const state = createSmallState();
    const action: TreeAction = {
      type: 'SET_PERCENTAGE',
      nodeId: 'root',
      value: 50,
    };

    const newState = treeReducer(state, action);

    expect(newState).toBe(state);
  });

  it('clamps value in free mode to [0, 100]', () => {
    const state: DashboardState = {
      ...createSmallState(),
      balanceMode: 'free',
    };

    const overState = treeReducer(state, {
      type: 'SET_PERCENTAGE',
      nodeId: 'a',
      value: 150,
    });
    expect(findNodeById(overState.tree, 'a')!.percentage).toBe(100);

    const underState = treeReducer(state, {
      type: 'SET_PERCENTAGE',
      nodeId: 'a',
      value: -10,
    });
    expect(findNodeById(underState.tree, 'a')!.percentage).toBe(0);
  });
});

// -------------------------------------------------------
// TOGGLE_LOCK
// -------------------------------------------------------
describe('TOGGLE_LOCK', () => {
  it('toggles isLocked from false to true', () => {
    const state = createSmallState();
    const action: TreeAction = { type: 'TOGGLE_LOCK', nodeId: 'a' };

    const newState = treeReducer(state, action);

    expect(findNodeById(newState.tree, 'a')!.isLocked).toBe(true);
  });

  it('toggles isLocked from true to false', () => {
    const state = createSmallState();
    const locked = treeReducer(state, { type: 'TOGGLE_LOCK', nodeId: 'a' });
    const unlocked = treeReducer(locked, { type: 'TOGGLE_LOCK', nodeId: 'a' });

    expect(findNodeById(unlocked.tree, 'a')!.isLocked).toBe(false);
  });

  it('prevents locking the last unlocked sibling (lock guard)', () => {
    const state = createSmallState();
    // Lock a and b
    const s1 = treeReducer(state, { type: 'TOGGLE_LOCK', nodeId: 'a' });
    const s2 = treeReducer(s1, { type: 'TOGGLE_LOCK', nodeId: 'b' });

    // Try to lock c -- should be no-op
    const s3 = treeReducer(s2, { type: 'TOGGLE_LOCK', nodeId: 'c' });

    expect(findNodeById(s3.tree, 'c')!.isLocked).toBe(false);
    expect(s3).toBe(s2); // Same reference = no change
  });

  it('is no-op for root node', () => {
    const state = createSmallState();
    const newState = treeReducer(state, {
      type: 'TOGGLE_LOCK',
      nodeId: 'root',
    });

    expect(newState).toBe(state);
  });
});

// -------------------------------------------------------
// SET_BALANCE_MODE
// -------------------------------------------------------
describe('SET_BALANCE_MODE', () => {
  it('auto to free: mode changes, values unchanged', () => {
    const state = createSmallState();
    const action: TreeAction = { type: 'SET_BALANCE_MODE', mode: 'free' };

    const newState = treeReducer(state, action);

    expect(newState.balanceMode).toBe('free');
    expect(findNodeById(newState.tree, 'a')!.percentage).toBe(30);
    expect(findNodeById(newState.tree, 'b')!.percentage).toBe(40);
    expect(findNodeById(newState.tree, 'c')!.percentage).toBe(30);
  });

  it('free to auto: normalizes percentages to 100', () => {
    // Start in free mode and modify percentages to not sum to 100
    let state: DashboardState = {
      ...createSmallState(),
      balanceMode: 'free',
    };
    // Change a to 50 (sum becomes 50+40+30 = 120)
    state = treeReducer(state, {
      type: 'SET_PERCENTAGE',
      nodeId: 'a',
      value: 50,
    });

    // Switch to auto
    const newState = treeReducer(state, {
      type: 'SET_BALANCE_MODE',
      mode: 'auto',
    });

    expect(newState.balanceMode).toBe('auto');
    const sum = childPercentageSum(newState.tree);
    expect(sum).toBeCloseTo(100, 1);
  });

  it('is no-op when mode is same as current', () => {
    const state = createSmallState();
    const newState = treeReducer(state, {
      type: 'SET_BALANCE_MODE',
      mode: 'auto',
    });

    expect(newState).toBe(state);
  });
});

// -------------------------------------------------------
// SET_TOTAL_POPULATION
// -------------------------------------------------------
describe('SET_TOTAL_POPULATION', () => {
  it('updates totalPopulation and recalculates absolute values', () => {
    const state = createSmallState();
    const action: TreeAction = {
      type: 'SET_TOTAL_POPULATION',
      value: 2000,
    };

    const newState = treeReducer(state, action);

    expect(newState.totalPopulation).toBe(2000);
    expect(newState.tree.absoluteValue).toBe(2000);
    expect(findNodeById(newState.tree, 'a')!.absoluteValue).toBe(600); // 2000 * 30%
    expect(findNodeById(newState.tree, 'b')!.absoluteValue).toBe(800); // 2000 * 40%
  });

  it('preserves percentages when population changes', () => {
    const state = createSmallState();
    const newState = treeReducer(state, {
      type: 'SET_TOTAL_POPULATION',
      value: 5000,
    });

    expect(findNodeById(newState.tree, 'a')!.percentage).toBe(30);
    expect(findNodeById(newState.tree, 'b')!.percentage).toBe(40);
    expect(findNodeById(newState.tree, 'c')!.percentage).toBe(30);
  });
});

// -------------------------------------------------------
// RESET
// -------------------------------------------------------
describe('RESET', () => {
  it('restores to initial state after modifications', () => {
    let state = createSmallState();
    state = treeReducer(state, {
      type: 'SET_PERCENTAGE',
      nodeId: 'a',
      value: 50,
    });
    state = treeReducer(state, { type: 'TOGGLE_LOCK', nodeId: 'b' });

    // RESET returns initialState (which uses defaultTree, not the small test state)
    const newState = treeReducer(state, { type: 'RESET' });

    expect(newState).toBe(initialState);
    expect(newState.totalPopulation).toBe(13_500_000);
    expect(newState.balanceMode).toBe('auto');
    expect(newState.tree).toBe(defaultTree);
  });
});

// -------------------------------------------------------
// Cascading recalculation (with full defaultTree)
// -------------------------------------------------------
describe('cascading recalculation', () => {
  it('recalculates all descendant absolute values when gender percentage changes', () => {
    const action: TreeAction = {
      type: 'SET_PERCENTAGE',
      nodeId: 'gender-male',
      value: 60,
    };

    const newState = treeReducer(initialState, action);

    const male = findNodeById(newState.tree, 'gender-male')!;
    const female = findNodeById(newState.tree, 'gender-female')!;

    expect(male.percentage).toBe(60);
    expect(female.percentage).toBe(40);
    expect(male.absoluteValue).toBe(Math.round(13_500_000 * 60 / 100));
    expect(female.absoluteValue).toBe(Math.round(13_500_000 * 40 / 100));

    // Check a descendant of male
    const maleG = findNodeById(newState.tree, 'male-g')!;
    expect(maleG.absoluteValue).toBe(
      Math.round(male.absoluteValue * maleG.percentage / 100),
    );
  });
});

// -------------------------------------------------------
// Performance
// -------------------------------------------------------
describe('performance', () => {
  it('processes SET_PERCENTAGE on full 55-node tree in under 16ms', () => {
    const action: TreeAction = {
      type: 'SET_PERCENTAGE',
      nodeId: 'gender-male',
      value: 60,
    };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      treeReducer(initialState, action);
    }
    const elapsed = performance.now() - start;
    const perDispatch = elapsed / 100;

    expect(perDispatch).toBeLessThan(16);
  });
});
```

**Key decisions:**
- Tests call `treeReducer` directly (no React rendering, no `renderHook`).
- Uses a small test state (`createSmallState`) for most tests for speed and clarity.
- Uses `initialState` (full 55-node `defaultTree`) for cascading recalc and performance tests.
- Reference equality checks (`toBe`) used to verify no-op actions return the same state object.
- Performance test runs 100 iterations to get a reliable average.
- 20 test cases total (exceeds TL design's 12+ minimum).

---

## Step 9: Final Verification

No files to create. Run these commands:

```bash
# Lint check
pnpm lint --filter @template/labor-market-dashboard

# Run all tests
pnpm test --filter @template/labor-market-dashboard

# Build check
pnpm build --filter @template/labor-market-dashboard
```

**Expected results:**
- Lint: 0 errors, 0 warnings
- Tests: ~58 new tests + ~34 existing tests = ~92 total, all passing
- Build: `tsc --noEmit && vite build` succeeds

**Manual verification checklist:**
- [ ] No `any` types in any new file
- [ ] All new files use `.ts` extension (not `.tsx`)
- [ ] All exported functions have JSDoc
- [ ] All interfaces have JSDoc
- [ ] Named exports only (no default exports)
- [ ] `largestRemainder` used for all percentage rounding
- [ ] All tree updates are immutable (new objects returned)

---

## File Summary

| # | File Path | Action | Lines (approx) |
|---|-----------|--------|----------------|
| 1 | `apps/labor-market-dashboard/src/types/actions.ts` | NEW | 16 |
| 2 | `apps/labor-market-dashboard/src/types/index.ts` | MODIFY | 7 |
| 3 | `apps/labor-market-dashboard/src/utils/treeUtils.ts` | NEW | 105 |
| 4 | `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts` | NEW | 195 |
| 5 | `apps/labor-market-dashboard/src/utils/calculations.ts` | NEW | 130 |
| 6 | `apps/labor-market-dashboard/src/__tests__/utils/calculations.test.ts` | NEW | 275 |
| 7 | `apps/labor-market-dashboard/src/utils/index.ts` | NEW | 18 |
| 8 | `apps/labor-market-dashboard/src/hooks/useTreeState.ts` | NEW | 200 |
| 9 | `apps/labor-market-dashboard/src/hooks/index.ts` | NEW | 1 |
| 10 | `apps/labor-market-dashboard/src/__tests__/hooks/useTreeState.test.ts` | NEW | 280 |

**Total new files: 9** | **Total modified files: 1** | **Total test cases: ~58**

---

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
