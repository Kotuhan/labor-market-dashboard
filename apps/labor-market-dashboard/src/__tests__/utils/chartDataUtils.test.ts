import { describe, it, expect } from 'vitest';

import { GHOST_SLICE_COLOR, INDUSTRY_COLORS } from '@/data/chartColors';
import { defaultTree } from '@/data/defaultTree';
import type { TreeNode } from '@/types';
import {
  generateSubcategoryColors,
  getNodeColor,
  toBarChartData,
  toChartData,
} from '@/utils/chartDataUtils';

/** Male gender node. */
const maleNode = defaultTree.children[0];
/** Female gender node. */
const femaleNode = defaultTree.children[1];
/** Male gender node children (16 industries). */
const maleChildren = maleNode.children;

/** Helper: create a minimal TreeNode for testing. */
function makeNode(overrides?: Partial<TreeNode>): TreeNode {
  return {
    id: 'test-node',
    label: 'Test',
    percentage: 25,
    defaultPercentage: 25,
    absoluteValue: 100_000,
    genderSplit: { male: 100, female: 0 },
    isLocked: false,
    children: [],
    ...overrides,
  };
}

// -------------------------------------------------------
// toChartData tests
// -------------------------------------------------------
describe('toChartData', () => {
  it('returns correct number of entries from male industry children', () => {
    const result = toChartData(maleChildren, INDUSTRY_COLORS, 'auto');
    expect(result).toHaveLength(16);
  });

  it('maps node label to name and percentage to value', () => {
    const nodes = [makeNode({ label: 'Торгівля', percentage: 16.8 })];
    const result = toChartData(nodes, {}, 'auto');

    expect(result[0].name).toBe('Торгівля');
    expect(result[0].value).toBe(16.8);
  });

  it('maps absoluteValue and nodeId correctly', () => {
    const nodes = [makeNode({ id: 'male-g', absoluteValue: 1_194_329 })];
    const result = toChartData(nodes, {}, 'auto');

    expect(result[0].absoluteValue).toBe(1_194_329);
    expect(result[0].nodeId).toBe('male-g');
  });

  it('does not append ghost slice in auto mode', () => {
    const nodes = [
      makeNode({ percentage: 60 }),
      makeNode({ id: 'n2', percentage: 30 }),
    ];
    const result = toChartData(nodes, {}, 'auto');

    expect(result).toHaveLength(2);
    expect(result.every((e) => !e.isGhost)).toBe(true);
  });

  it('appends ghost slice in free mode when sum < 100', () => {
    const nodes = [
      makeNode({ percentage: 60 }),
      makeNode({ id: 'n2', percentage: 30 }),
    ];
    const result = toChartData(nodes, {}, 'free');

    expect(result).toHaveLength(3);
    const ghost = result[2];
    expect(ghost.name).toBe('Нерозподілено');
    expect(ghost.value).toBe(10);
    expect(ghost.color).toBe(GHOST_SLICE_COLOR);
    expect(ghost.isGhost).toBe(true);
  });

  it('does not append ghost slice in free mode when sum = 100', () => {
    const nodes = [
      makeNode({ percentage: 60 }),
      makeNode({ id: 'n2', percentage: 40 }),
    ];
    const result = toChartData(nodes, {}, 'free');

    expect(result).toHaveLength(2);
  });

  it('does not append ghost slice in free mode when sum > 100 (overflow)', () => {
    const nodes = [
      makeNode({ percentage: 60 }),
      makeNode({ id: 'n2', percentage: 55 }),
    ];
    const result = toChartData(nodes, {}, 'free');

    // No ghost slice added; Recharts normalizes proportionally
    expect(result).toHaveLength(2);
    expect(result.every((e) => !e.isGhost)).toBe(true);
  });
});

// -------------------------------------------------------
// getNodeColor tests
// -------------------------------------------------------
describe('getNodeColor', () => {
  it('returns color by kvedCode when present in colorMap', () => {
    const node = makeNode({ kvedCode: 'G' });
    const result = getNodeColor(node, INDUSTRY_COLORS);

    expect(result).toBe('#3B82F6');
  });

  it('falls back to node ID when kvedCode is not in colorMap', () => {
    const node = makeNode({ id: 'custom-id', kvedCode: 'UNKNOWN' });
    const colorMap = { 'custom-id': '#FF0000' };
    const result = getNodeColor(node, colorMap);

    expect(result).toBe('#FF0000');
  });

  it('falls back to default color when no mapping found', () => {
    const node = makeNode({ id: 'no-match' });
    const result = getNodeColor(node, {}, '#AABBCC');

    expect(result).toBe('#AABBCC');
  });
});

// -------------------------------------------------------
// generateSubcategoryColors tests
// -------------------------------------------------------
describe('generateSubcategoryColors', () => {
  it('returns correct number of colors', () => {
    const result = generateSubcategoryColors('#14B8A6', 10);
    expect(result).toHaveLength(10);
  });

  it('returns empty array for count 0', () => {
    const result = generateSubcategoryColors('#14B8A6', 0);
    expect(result).toHaveLength(0);
  });

  it('returns the base color for count 1', () => {
    const result = generateSubcategoryColors('#14B8A6', 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('#14B8A6');
  });

  it('first color is the base color (full opacity)', () => {
    const result = generateSubcategoryColors('#14B8A6', 5);
    expect(result[0]).toBe('#14B8A6');
  });

  it('last color is lighter than the first (blended toward white)', () => {
    const result = generateSubcategoryColors('#14B8A6', 5);
    // Last color should be closer to white (higher RGB values)
    const firstR = parseInt(result[0].slice(1, 3), 16);
    const lastR = parseInt(result[4].slice(1, 3), 16);
    expect(lastR).toBeGreaterThan(firstR);
  });

  it('all colors are valid hex strings', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    const result = generateSubcategoryColors('#14B8A6', 10);
    for (const color of result) {
      expect(color).toMatch(hexPattern);
    }
  });
});

// -------------------------------------------------------
// toBarChartData tests
// -------------------------------------------------------
describe('toBarChartData', () => {
  it('returns 16 entries for default tree (one per industry)', () => {
    const result = toBarChartData(maleNode, femaleNode);
    expect(result).toHaveLength(16);
  });

  it('returns correct male and female absolute values for first industry', () => {
    const result = toBarChartData(maleNode, femaleNode);
    const first = result[0];
    // Values should match the first male industry's absoluteValue
    expect(first.male).toBe(maleNode.children[0].absoluteValue);
    // And the corresponding female industry matched by KVED code
    const kved = maleNode.children[0].kvedCode;
    const femaleMatch = femaleNode.children.find((c) => c.kvedCode === kved);
    expect(first.female).toBe(femaleMatch?.absoluteValue ?? 0);
  });

  it('returns correct percentage values', () => {
    const result = toBarChartData(maleNode, femaleNode);
    const first = result[0];
    expect(first.malePercentage).toBe(maleNode.children[0].percentage);
    const kved = maleNode.children[0].kvedCode;
    const femaleMatch = femaleNode.children.find((c) => c.kvedCode === kved);
    expect(first.femalePercentage).toBe(femaleMatch?.percentage ?? 0);
  });

  it('falls back to 0 when KVED code is missing in one gender', () => {
    // Create a male node with an industry that has no female match
    const customMale = makeNode({
      id: 'gender-male',
      label: 'Чоловіки',
      children: [
        makeNode({ id: 'male-custom', label: 'Custom', kvedCode: 'ZZ', absoluteValue: 5000, percentage: 100 }),
      ],
    });
    const customFemale = makeNode({
      id: 'gender-female',
      label: 'Жінки',
      children: [
        makeNode({ id: 'female-a', label: 'Agriculture', kvedCode: 'A', absoluteValue: 3000, percentage: 100 }),
      ],
    });

    const result = toBarChartData(customMale, customFemale);
    // Should have 2 entries: ZZ (male-only) + A (female-only)
    expect(result).toHaveLength(2);
    expect(result[0].kvedCode).toBe('ZZ');
    expect(result[0].male).toBe(5000);
    expect(result[0].female).toBe(0);
    expect(result[1].kvedCode).toBe('A');
    expect(result[1].male).toBe(0);
    expect(result[1].female).toBe(3000);
  });

  it('preserves industry order from male node', () => {
    const result = toBarChartData(maleNode, femaleNode);
    const kvedOrder = result.map((e) => e.kvedCode);
    const maleKvedOrder = maleNode.children.map((c) => c.kvedCode ?? c.id);
    // First 16 entries should match male industry order
    expect(kvedOrder).toEqual(maleKvedOrder);
  });
});
