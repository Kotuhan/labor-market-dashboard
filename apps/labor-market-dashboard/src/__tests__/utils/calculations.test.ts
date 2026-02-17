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

    // sum = 99.99, deviation = -0.01 -> rounds to -0 (JS Math.round behavior)
    expect(getSiblingDeviation(parent)).toBeCloseTo(0, 1);
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
