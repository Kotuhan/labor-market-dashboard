import { describe, it, expect } from 'vitest';

import { defaultTree } from '@/data/defaultTree';
import type { DashboardState, TreeNode } from '@/types';

/** Recursively collect all nodes in the tree. */
function collectAllNodes(node: TreeNode): TreeNode[] {
  return [node, ...node.children.flatMap(collectAllNodes)];
}

describe('defaultTree', () => {
  // -------------------------------------------------------
  // Group 1: Structural tests
  // -------------------------------------------------------
  describe('structure', () => {
    it('root has exactly 2 children (male, female)', () => {
      expect(defaultTree.children).toHaveLength(2);
      expect(defaultTree.children[0].id).toBe('gender-male');
      expect(defaultTree.children[1].id).toBe('gender-female');
    });

    it('each gender node has exactly 16 industry children', () => {
      for (const gender of defaultTree.children) {
        expect(gender.children).toHaveLength(16);
      }
    });

    it('IT industry under each gender has exactly 10 subcategory children', () => {
      for (const gender of defaultTree.children) {
        const itNode = gender.children.find((c) => c.kvedCode === 'J');
        expect(itNode).toBeDefined();
        expect(itNode!.children).toHaveLength(10);
      }
    });

    it('all non-IT industries have empty children arrays', () => {
      for (const gender of defaultTree.children) {
        const nonIT = gender.children.filter((c) => c.kvedCode !== 'J');
        expect(nonIT).toHaveLength(15);
        for (const industry of nonIT) {
          expect(industry.children).toEqual([]);
        }
      }
    });

    it('total node count is 55', () => {
      const allNodes = collectAllNodes(defaultTree);
      expect(allNodes).toHaveLength(55);
    });
  });

  // -------------------------------------------------------
  // Group 2: Percentage sum tests
  // -------------------------------------------------------
  describe('percentage sums', () => {
    it('root percentage is 100', () => {
      expect(defaultTree.percentage).toBe(100);
    });

    it('gender children percentages sum to 100', () => {
      const sum = defaultTree.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 2);
    });

    it('male industry percentages sum to 100.0', () => {
      const male = defaultTree.children[0];
      const sum = male.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('female industry percentages sum to 100.0', () => {
      const female = defaultTree.children[1];
      const sum = female.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('male IT subcategory percentages sum to 100.0', () => {
      const maleIT = defaultTree.children[0].children.find(
        (c) => c.kvedCode === 'J',
      );
      expect(maleIT).toBeDefined();
      const sum = maleIT!.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('female IT subcategory percentages sum to 100.0', () => {
      const femaleIT = defaultTree.children[1].children.find(
        (c) => c.kvedCode === 'J',
      );
      expect(femaleIT).toBeDefined();
      const sum = femaleIT!.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });
  });

  // -------------------------------------------------------
  // Group 3: Absolute value consistency tests
  // -------------------------------------------------------
  describe('absolute value consistency', () => {
    it('root absoluteValue is 13,500,000', () => {
      expect(defaultTree.absoluteValue).toBe(13_500_000);
    });

    it('every child absoluteValue equals round(parent.abs * child.pct / 100) within tolerance 1', () => {
      function checkAbsValues(parent: TreeNode): void {
        for (const child of parent.children) {
          const expected = Math.round(
            (parent.absoluteValue * child.percentage) / 100,
          );
          expect(
            Math.abs(child.absoluteValue - expected),
          ).toBeLessThanOrEqual(1);
          checkAbsValues(child);
        }
      }
      checkAbsValues(defaultTree);
    });
  });

  // -------------------------------------------------------
  // Group 4: Gender split validity tests
  // -------------------------------------------------------
  describe('gender split validity', () => {
    it('every node genderSplit.male + genderSplit.female equals 100', () => {
      const allNodes = collectAllNodes(defaultTree);
      for (const node of allNodes) {
        expect(node.genderSplit.male + node.genderSplit.female).toBe(100);
      }
    });

    it('root genderSplit reflects derived weighted values', () => {
      expect(defaultTree.genderSplit.male).toBe(52.66);
      expect(defaultTree.genderSplit.female).toBe(47.34);
    });

    it('male gender node has { male: 100, female: 0 }', () => {
      const male = defaultTree.children[0];
      expect(male.genderSplit).toEqual({ male: 100, female: 0 });
    });

    it('female gender node has { male: 0, female: 100 }', () => {
      const female = defaultTree.children[1];
      expect(female.genderSplit).toEqual({ male: 0, female: 100 });
    });
  });

  // -------------------------------------------------------
  // Group 5: Default state tests
  // -------------------------------------------------------
  describe('default state', () => {
    it('every node has percentage === defaultPercentage', () => {
      const allNodes = collectAllNodes(defaultTree);
      for (const node of allNodes) {
        expect(node.percentage).toBe(node.defaultPercentage);
      }
    });

    it('every node has isLocked === false', () => {
      const allNodes = collectAllNodes(defaultTree);
      for (const node of allNodes) {
        expect(node.isLocked).toBe(false);
      }
    });
  });

  // -------------------------------------------------------
  // Group 6: Completeness tests
  // -------------------------------------------------------
  describe('completeness', () => {
    const EXPECTED_KVED_CODES = [
      'G', 'A', 'B-E', 'O', 'P', 'Q', 'H', 'F',
      'M', 'J', 'S', 'N', 'I', 'L', 'K', 'R',
    ];

    it('all 16 KVED codes present under male gender', () => {
      const maleCodes = defaultTree.children[0].children.map(
        (c) => c.kvedCode,
      );
      for (const code of EXPECTED_KVED_CODES) {
        expect(maleCodes).toContain(code);
      }
    });

    it('all 16 KVED codes present under female gender', () => {
      const femaleCodes = defaultTree.children[1].children.map(
        (c) => c.kvedCode,
      );
      for (const code of EXPECTED_KVED_CODES) {
        expect(femaleCodes).toContain(code);
      }
    });

    const EXPECTED_IT_LABELS = [
      'Розробка ПЗ',
      'QA / Тестування',
      'PM / Product',
      'HR / Рекрутинг',
      'DevOps / SRE',
      'Аналітики',
      'UI/UX Дизайн',
      'Data / ML / AI',
      'Маркетинг',
      'Інші ролі',
    ];

    it('all 10 IT subcategory labels present under male IT', () => {
      const maleIT = defaultTree.children[0].children.find(
        (c) => c.kvedCode === 'J',
      );
      expect(maleIT).toBeDefined();
      const labels = maleIT!.children.map((c) => c.label);
      for (const label of EXPECTED_IT_LABELS) {
        expect(labels).toContain(label);
      }
    });

    it('all 10 IT subcategory labels present under female IT', () => {
      const femaleIT = defaultTree.children[1].children.find(
        (c) => c.kvedCode === 'J',
      );
      expect(femaleIT).toBeDefined();
      const labels = femaleIT!.children.map((c) => c.label);
      for (const label of EXPECTED_IT_LABELS) {
        expect(labels).toContain(label);
      }
    });

    it('all labels are non-empty strings', () => {
      const allNodes = collectAllNodes(defaultTree);
      for (const node of allNodes) {
        expect(typeof node.label).toBe('string');
        expect(node.label.length).toBeGreaterThan(0);
      }
    });

    it('all IDs are unique across the entire tree', () => {
      const allNodes = collectAllNodes(defaultTree);
      const ids = allNodes.map((n) => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // -------------------------------------------------------
  // Group 7: DashboardState compatibility test
  // -------------------------------------------------------
  describe('DashboardState compatibility', () => {
    it('defaultTree can be used to construct a valid DashboardState', () => {
      const state: DashboardState = {
        totalPopulation: defaultTree.absoluteValue,
        balanceMode: 'auto',
        tree: defaultTree,
      };

      expect(state.totalPopulation).toBe(13_500_000);
      expect(state.balanceMode).toBe('auto');
      expect(state.tree.id).toBe('root');
      expect(state.tree.children).toHaveLength(2);
    });
  });
});
