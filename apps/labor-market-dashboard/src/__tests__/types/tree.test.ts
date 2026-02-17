import { describe, it, expect, expectTypeOf } from 'vitest';

import type {
  BalanceMode,
  DashboardState,
  GenderSplit,
  TreeNode,
} from '@/types/tree';

describe('TreeNode type', () => {
  it('allows constructing a valid 3-level tree without type assertions (AC-01, AC-05)', () => {
    const subcategory: TreeNode = {
      id: 'sub-1',
      label: 'Crop production',
      percentage: 60,
      absoluteValue: 420_000,
      genderSplit: { male: 65, female: 35 },
      children: [],
      defaultPercentage: 60,
      isLocked: false,
    };

    const industry: TreeNode = {
      id: 'ind-agriculture',
      label: 'Agriculture',
      percentage: 15.2,
      absoluteValue: 700_000,
      genderSplit: { male: 55, female: 45 },
      children: [subcategory],
      defaultPercentage: 15.2,
      isLocked: false,
      kvedCode: 'A',
    };

    const gender: TreeNode = {
      id: 'gender-male',
      label: 'Male',
      percentage: 52,
      absoluteValue: 7_020_000,
      genderSplit: { male: 100, female: 0 },
      children: [industry],
      defaultPercentage: 52,
      isLocked: false,
    };

    const root: TreeNode = {
      id: 'root',
      label: 'Total Employed',
      percentage: 100,
      absoluteValue: 13_500_000,
      genderSplit: { male: 52, female: 48 },
      children: [gender],
      defaultPercentage: 100,
      isLocked: false,
    };

    expect(root.id).toBe('root');
    expect(root.children).toHaveLength(1);
    expect(root.children[0].children[0].children[0].children).toHaveLength(0);
  });

  it('requires all mandatory fields on TreeNode (AC-01)', () => {
    expectTypeOf<TreeNode>().toHaveProperty('id');
    expectTypeOf<TreeNode>().toHaveProperty('label');
    expectTypeOf<TreeNode>().toHaveProperty('percentage');
    expectTypeOf<TreeNode>().toHaveProperty('absoluteValue');
    expectTypeOf<TreeNode>().toHaveProperty('genderSplit');
    expectTypeOf<TreeNode>().toHaveProperty('children');
    expectTypeOf<TreeNode>().toHaveProperty('defaultPercentage');
    expectTypeOf<TreeNode>().toHaveProperty('isLocked');
  });

  it('allows kvedCode to be omitted (optional field, resolved Q1)', () => {
    const nodeWithoutKved: TreeNode = {
      id: 'root',
      label: 'Total Employed',
      percentage: 100,
      absoluteValue: 13_500_000,
      genderSplit: { male: 52, female: 48 },
      children: [],
      defaultPercentage: 100,
      isLocked: false,
    };

    const nodeWithKved: TreeNode = {
      id: 'ind-agriculture',
      label: 'Agriculture',
      percentage: 15.2,
      absoluteValue: 700_000,
      genderSplit: { male: 55, female: 45 },
      children: [],
      defaultPercentage: 15.2,
      isLocked: false,
      kvedCode: 'A',
    };

    expect(nodeWithoutKved.kvedCode).toBeUndefined();
    expect(nodeWithKved.kvedCode).toBe('A');
  });

  it('accepts empty children array for leaf nodes', () => {
    const leaf: TreeNode = {
      id: 'leaf-1',
      label: 'Leaf Node',
      percentage: 10,
      absoluteValue: 100_000,
      genderSplit: { male: 50, female: 50 },
      children: [],
      defaultPercentage: 10,
      isLocked: false,
    };

    expect(leaf.children).toEqual([]);
  });

  it('accepts populated children array', () => {
    const child: TreeNode = {
      id: 'child-1',
      label: 'Child',
      percentage: 50,
      absoluteValue: 500_000,
      genderSplit: { male: 50, female: 50 },
      children: [],
      defaultPercentage: 50,
      isLocked: false,
    };

    const parent: TreeNode = {
      id: 'parent-1',
      label: 'Parent',
      percentage: 100,
      absoluteValue: 1_000_000,
      genderSplit: { male: 50, female: 50 },
      children: [child],
      defaultPercentage: 100,
      isLocked: false,
    };

    expect(parent.children).toHaveLength(1);
    expectTypeOf(parent.children).toEqualTypeOf<TreeNode[]>();
  });
});

describe('DashboardState type', () => {
  it('allows constructing a valid DashboardState (AC-02)', () => {
    const rootNode: TreeNode = {
      id: 'root',
      label: 'Total Employed',
      percentage: 100,
      absoluteValue: 13_500_000,
      genderSplit: { male: 52, female: 48 },
      children: [],
      defaultPercentage: 100,
      isLocked: false,
    };

    const state: DashboardState = {
      totalPopulation: 13_500_000,
      balanceMode: 'auto',
      tree: rootNode,
    };

    expect(state.totalPopulation).toBe(13_500_000);
    expect(state.balanceMode).toBe('auto');
    expect(state.tree.id).toBe('root');
  });
});

describe('BalanceMode type', () => {
  it('is a union of "auto" and "free" (AC-03)', () => {
    expectTypeOf<BalanceMode>().toEqualTypeOf<'auto' | 'free'>();
  });

  it('is used as DashboardState.balanceMode type (AC-03)', () => {
    expectTypeOf<DashboardState['balanceMode']>().toEqualTypeOf<
      'auto' | 'free'
    >();
  });
});

describe('GenderSplit type', () => {
  it('has required male and female number fields (AC-04)', () => {
    const split: GenderSplit = { male: 52, female: 48 };

    expect(split.male).toBe(52);
    expect(split.female).toBe(48);

    expectTypeOf<GenderSplit['male']>().toBeNumber();
    expectTypeOf<GenderSplit['female']>().toBeNumber();
  });

  it('can be used standalone for calculations (AC-04)', () => {
    const split: GenderSplit = { male: 60, female: 40 };
    const total = split.male + split.female;

    expect(total).toBe(100);
    expectTypeOf(split).toEqualTypeOf<GenderSplit>();
  });
});

describe('Type exports (AC-06)', () => {
  it('exports all 4 types from @/types/tree', () => {
    // These compile-time checks verify all types are importable and defined
    expectTypeOf<TreeNode>().not.toBeNever();
    expectTypeOf<DashboardState>().not.toBeNever();
    expectTypeOf<BalanceMode>().not.toBeNever();
    expectTypeOf<GenderSplit>().not.toBeNever();
  });
});

// NOTE: AC-07 (no `any` types) is verified by `pnpm lint` via the
// @typescript-eslint/no-explicit-any: "error" rule in the shared ESLint config.
// It is not testable via Vitest.
