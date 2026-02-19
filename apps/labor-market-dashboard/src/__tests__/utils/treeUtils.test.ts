import { describe, it, expect } from 'vitest';

import type { TreeNode } from '@/types';
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

/** Helper to create a minimal leaf TreeNode for testing. */
function createLeafNode(id: string, label: string): TreeNode {
  return {
    id,
    label,
    percentage: 0,
    defaultPercentage: 0,
    absoluteValue: 0,
    genderSplit: { male: 50, female: 50 },
    isLocked: false,
    children: [],
  };
}

describe('generateUniqueId', () => {
  it('returns base ID when no collision', () => {
    const tree = createTestTree();
    const result = generateUniqueId(tree, 'child', 'c');

    expect(result).toBe('child-c');
  });

  it('appends -2 suffix when base ID collides', () => {
    const tree = createTestTree();
    const result = generateUniqueId(tree, 'child', 'a');

    expect(result).toBe('child-a-2');
  });

  it('appends -3 suffix when both base and -2 collide', () => {
    const tree = createTestTree();
    // Add a node with id 'child-a-2' to root's children
    const modifiedTree: TreeNode = {
      ...tree,
      children: [
        ...tree.children,
        createLeafNode('child-a-2', 'Child A2'),
      ],
    };
    const result = generateUniqueId(modifiedTree, 'child', 'a');

    expect(result).toBe('child-a-3');
  });

  it('handles empty slug', () => {
    const tree = createTestTree();
    const result = generateUniqueId(tree, 'male', 'node');

    expect(result).toBe('male-node');
  });
});

describe('addChildToParent', () => {
  it('adds child to parent with existing children and redistributes equally', () => {
    const tree = createTestTree();
    const result = addChildToParent(tree, 'root', createLeafNode('child-c', 'Child C'));
    const root = result;

    expect(root.children).toHaveLength(3);

    const sum = root.children.reduce((s, c) => s + c.percentage, 0);
    expect(sum).toBeCloseTo(100, 1);

    // Each child should be approximately 33.3%
    for (const child of root.children) {
      expect(child.percentage).toBeGreaterThanOrEqual(33.3);
      expect(child.percentage).toBeLessThanOrEqual(33.4);
    }
  });

  it('adds child to parent with no existing children', () => {
    const tree = createTestTree();
    const result = addChildToParent(tree, 'child-b', createLeafNode('sub-b1', 'Sub B1'));
    const childB = findNodeById(result, 'child-b')!;

    expect(childB.children).toHaveLength(1);
    expect(childB.children[0].percentage).toBe(100.0);
  });

  it('preserves immutability (original tree unchanged)', () => {
    const tree = createTestTree();
    const result = addChildToParent(tree, 'root', createLeafNode('child-c', 'Child C'));

    expect(tree.children).toHaveLength(2);
    expect(result.children).toHaveLength(3);
    expect(result).not.toBe(tree);
  });

  it('redistributes with largestRemainder precision for many children', () => {
    // Build a tree with 6 children under root
    const root: TreeNode = {
      id: 'root',
      label: 'Root',
      percentage: 100,
      defaultPercentage: 100,
      absoluteValue: 1000,
      genderSplit: { male: 50, female: 50 },
      isLocked: false,
      children: Array.from({ length: 6 }, (_, i) => createLeafNode(`child-${i}`, `Child ${i}`)),
    };

    const result = addChildToParent(root, 'root', createLeafNode('new', 'New'));

    expect(result.children).toHaveLength(7);

    const sum = result.children.reduce((s, c) => s + c.percentage, 0);
    expect(sum).toBeCloseTo(100, 1);

    // Each approximately 100/7 = 14.28...
    for (const child of result.children) {
      expect(child.percentage).toBeGreaterThanOrEqual(14.2);
      expect(child.percentage).toBeLessThanOrEqual(14.4);
    }
  });
});

describe('removeChildFromParent', () => {
  it('removes child and redistributes equally', () => {
    const tree = createTestTree();
    const result = removeChildFromParent(tree, 'root', 'child-b');
    const root = result;

    expect(root.children).toHaveLength(1);
    expect(root.children[0].id).toBe('child-a');
    expect(root.children[0].percentage).toBe(100.0);
  });

  it('blocks removal when parent has only 1 child', () => {
    const root: TreeNode = {
      id: 'root',
      label: 'Root',
      percentage: 100,
      defaultPercentage: 100,
      absoluteValue: 1000,
      genderSplit: { male: 50, female: 50 },
      isLocked: false,
      children: [createLeafNode('only-child', 'Only Child')],
    };

    const result = removeChildFromParent(root, 'root', 'only-child');

    expect(result).toBe(root);
    expect(result.children).toHaveLength(1);
  });

  it('returns original tree when parentId not found', () => {
    const tree = createTestTree();
    const result = removeChildFromParent(tree, 'nonexistent', 'child-a');

    expect(result).toBe(tree);
  });

  it('returns unchanged children when childId not found in parent', () => {
    const tree = createTestTree();
    const result = removeChildFromParent(tree, 'root', 'nonexistent-child');

    expect(result.children).toHaveLength(2);
    expect(result.children[0].percentage).toBe(60);
    expect(result.children[1].percentage).toBe(40);
  });

  it('preserves immutability on removal', () => {
    const tree = createTestTree();
    const result = removeChildFromParent(tree, 'root', 'child-b');

    expect(tree.children).toHaveLength(2);
    expect(result).not.toBe(tree);
  });

  it('redistributes correctly when removing from a group of 3+', () => {
    // Root with 3 children each at ~33.3%
    const root: TreeNode = {
      id: 'root',
      label: 'Root',
      percentage: 100,
      defaultPercentage: 100,
      absoluteValue: 1000,
      genderSplit: { male: 50, female: 50 },
      isLocked: false,
      children: [
        { ...createLeafNode('x', 'X'), percentage: 33.3 },
        { ...createLeafNode('y', 'Y'), percentage: 33.4 },
        { ...createLeafNode('z', 'Z'), percentage: 33.3 },
      ],
    };

    const result = removeChildFromParent(root, 'root', 'x');

    expect(result.children).toHaveLength(2);
    expect(result.children[0].percentage).toBe(50.0);
    expect(result.children[1].percentage).toBe(50.0);

    const sum = result.children.reduce((s, c) => s + c.percentage, 0);
    expect(sum).toBeCloseTo(100, 1);
  });
});
