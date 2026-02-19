import { describe, it, expect } from 'vitest';

import { defaultTree } from '@/data';
import { treeReducer, initialState } from '@/hooks/useTreeState';
import type { DashboardState, TreeAction, TreeNode } from '@/types';
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

// -------------------------------------------------------
// Helper: createGenderState
// -------------------------------------------------------

/** Helper: create a gender-like tree for add/remove tests. */
function createGenderState(): DashboardState {
  const tree: TreeNode = {
    id: 'root',
    label: 'Root',
    percentage: 100,
    defaultPercentage: 100,
    absoluteValue: 10_000,
    genderSplit: { male: 50, female: 50 },
    isLocked: false,
    children: [
      {
        id: 'gender-male',
        label: 'Чоловіки',
        percentage: 50,
        defaultPercentage: 50,
        absoluteValue: 5000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [
          {
            id: 'male-a',
            label: 'Industry A',
            percentage: 60,
            defaultPercentage: 60,
            absoluteValue: 3000,
            genderSplit: { male: 100, female: 0 },
            isLocked: false,
            children: [],
          },
          {
            id: 'male-b',
            label: 'Industry B',
            percentage: 40,
            defaultPercentage: 40,
            absoluteValue: 2000,
            genderSplit: { male: 100, female: 0 },
            isLocked: false,
            children: [
              {
                id: 'male-b-sub1',
                label: 'Sub 1',
                percentage: 50,
                defaultPercentage: 50,
                absoluteValue: 1000,
                genderSplit: { male: 100, female: 0 },
                isLocked: false,
                children: [],
              },
              {
                id: 'male-b-sub2',
                label: 'Sub 2',
                percentage: 50,
                defaultPercentage: 50,
                absoluteValue: 1000,
                genderSplit: { male: 100, female: 0 },
                isLocked: false,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'gender-female',
        label: 'Жінки',
        percentage: 50,
        defaultPercentage: 50,
        absoluteValue: 5000,
        genderSplit: { male: 0, female: 100 },
        isLocked: false,
        children: [
          {
            id: 'female-a',
            label: 'Industry A',
            percentage: 100,
            defaultPercentage: 100,
            absoluteValue: 5000,
            genderSplit: { male: 0, female: 100 },
            isLocked: false,
            children: [],
          },
        ],
      },
    ],
  };

  return {
    totalPopulation: 10_000,
    balanceMode: 'auto',
    tree,
  };
}

// -------------------------------------------------------
// ADD_INDUSTRY
// -------------------------------------------------------
describe('ADD_INDUSTRY', () => {
  it('adds a new industry under a gender node with equal redistribution', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_INDUSTRY',
      genderId: 'gender-male',
      label: 'Тест',
    };

    const newState = treeReducer(state, action);
    const genderMale = findNodeById(newState.tree, 'gender-male')!;

    expect(genderMale.children).toHaveLength(3);

    const sum = childPercentageSum(genderMale);
    expect(sum).toBeCloseTo(100, 1);

    for (const child of genderMale.children) {
      expect(child.percentage).toBeGreaterThanOrEqual(33.3);
      expect(child.percentage).toBeLessThanOrEqual(33.4);
    }

    // New node ID starts with 'male-'
    const newNode = genderMale.children[2];
    expect(newNode.id).toMatch(/^male-/);
  });

  it('generates correct node ID from Ukrainian label', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_INDUSTRY',
      genderId: 'gender-male',
      label: 'Кібербезпека',
    };

    const newState = treeReducer(state, action);
    const node = findNodeById(newState.tree, 'male-kiberbezpeka');

    expect(node).toBeDefined();
    expect(node!.label).toBe('Кібербезпека');
  });

  it('sets defaultPercentage to 0 for custom nodes', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_INDUSTRY',
      genderId: 'gender-male',
      label: 'Нова',
    };

    const newState = treeReducer(state, action);
    const genderMale = findNodeById(newState.tree, 'gender-male')!;
    const newNode = genderMale.children.find((c) => c.label === 'Нова')!;

    expect(newNode.defaultPercentage).toBe(0);
  });

  it('sets correct genderSplit for male industry', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_INDUSTRY',
      genderId: 'gender-male',
      label: 'Тест',
    };

    const newState = treeReducer(state, action);
    const genderMale = findNodeById(newState.tree, 'gender-male')!;
    const newNode = genderMale.children.find((c) => c.label === 'Тест')!;

    expect(newNode.genderSplit).toEqual({ male: 100, female: 0 });
  });

  it('sets correct genderSplit for female industry', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_INDUSTRY',
      genderId: 'gender-female',
      label: 'Тест',
    };

    const newState = treeReducer(state, action);
    const genderFemale = findNodeById(newState.tree, 'gender-female')!;
    const newNode = genderFemale.children.find((c) => c.label === 'Тест')!;

    expect(newNode.genderSplit).toEqual({ male: 0, female: 100 });
  });

  it('recalculates absolute values after adding', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_INDUSTRY',
      genderId: 'gender-male',
      label: 'Тест',
    };

    const newState = treeReducer(state, action);
    const genderMale = findNodeById(newState.tree, 'gender-male')!;

    // All children should have absolute values consistent with their percentages
    for (const child of genderMale.children) {
      const expected = Math.round(
        genderMale.absoluteValue * child.percentage / 100,
      );
      expect(child.absoluteValue).toBe(expected);
    }
  });

  it('is no-op when genderId does not exist', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_INDUSTRY',
      genderId: 'nonexistent',
      label: 'Тест',
    };

    const newState = treeReducer(state, action);

    expect(newState).toBe(state);
  });
});

// -------------------------------------------------------
// REMOVE_INDUSTRY
// -------------------------------------------------------
describe('REMOVE_INDUSTRY', () => {
  it('removes an industry and redistributes equally', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'REMOVE_INDUSTRY',
      nodeId: 'male-a',
    };

    const newState = treeReducer(state, action);
    const genderMale = findNodeById(newState.tree, 'gender-male')!;

    expect(genderMale.children).toHaveLength(1);
    expect(genderMale.children[0].id).toBe('male-b');
    expect(genderMale.children[0].percentage).toBe(100.0);

    // Absolute values recalculated
    expect(genderMale.children[0].absoluteValue).toBe(
      Math.round(genderMale.absoluteValue * 100 / 100),
    );
  });

  it('removes an industry with subcategories (cascade)', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'REMOVE_INDUSTRY',
      nodeId: 'male-b',
    };

    const newState = treeReducer(state, action);
    const genderMale = findNodeById(newState.tree, 'gender-male')!;

    expect(genderMale.children).toHaveLength(1);
    expect(genderMale.children[0].id).toBe('male-a');
    expect(findNodeById(newState.tree, 'male-b-sub1')).toBeUndefined();
    expect(findNodeById(newState.tree, 'male-b-sub2')).toBeUndefined();
  });

  it('blocks removal of last industry under a gender', () => {
    const state = createGenderState();

    // First remove male-a
    const intermediate = treeReducer(state, {
      type: 'REMOVE_INDUSTRY',
      nodeId: 'male-a',
    });

    // Try to remove male-b (the last one)
    const newState = treeReducer(intermediate, {
      type: 'REMOVE_INDUSTRY',
      nodeId: 'male-b',
    });

    expect(newState).toBe(intermediate);
  });

  it('is no-op when nodeId not found', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'REMOVE_INDUSTRY',
      nodeId: 'nonexistent',
    };

    const newState = treeReducer(state, action);

    expect(newState).toBe(state);
  });
});

// -------------------------------------------------------
// ADD_SUBCATEGORY
// -------------------------------------------------------
describe('ADD_SUBCATEGORY', () => {
  it('adds first subcategory to a leaf industry (becomes expandable)', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_SUBCATEGORY',
      industryId: 'male-a',
      label: 'Підкатегорія',
    };

    const newState = treeReducer(state, action);
    const maleA = findNodeById(newState.tree, 'male-a')!;

    expect(maleA.children).toHaveLength(1);
    expect(maleA.children[0].percentage).toBe(100.0);
    expect(maleA.children[0].genderSplit).toEqual({ male: 100, female: 0 });
  });

  it('adds subcategory to industry with existing subcategories', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_SUBCATEGORY',
      industryId: 'male-b',
      label: 'Нова',
    };

    const newState = treeReducer(state, action);
    const maleB = findNodeById(newState.tree, 'male-b')!;

    expect(maleB.children).toHaveLength(3);

    const sum = childPercentageSum(maleB);
    expect(sum).toBeCloseTo(100, 1);
  });

  it('generates subcategory ID with industry prefix', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_SUBCATEGORY',
      industryId: 'male-b',
      label: 'Тест',
    };

    const newState = treeReducer(state, action);
    const node = findNodeById(newState.tree, 'male-b-test');

    expect(node).toBeDefined();
    expect(node!.id).toBe('male-b-test');
  });

  it('is no-op when industryId does not exist', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'ADD_SUBCATEGORY',
      industryId: 'nonexistent',
      label: 'Test',
    };

    const newState = treeReducer(state, action);

    expect(newState).toBe(state);
  });
});

// -------------------------------------------------------
// REMOVE_SUBCATEGORY
// -------------------------------------------------------
describe('REMOVE_SUBCATEGORY', () => {
  it('removes a subcategory and redistributes equally', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'REMOVE_SUBCATEGORY',
      nodeId: 'male-b-sub1',
    };

    const newState = treeReducer(state, action);
    const maleB = findNodeById(newState.tree, 'male-b')!;

    expect(maleB.children).toHaveLength(1);
    expect(maleB.children[0].id).toBe('male-b-sub2');
    expect(maleB.children[0].percentage).toBe(100.0);
  });

  it('removes last subcategory (industry becomes leaf)', () => {
    const state = createGenderState();

    // Remove sub1 first
    const intermediate = treeReducer(state, {
      type: 'REMOVE_SUBCATEGORY',
      nodeId: 'male-b-sub1',
    });

    // Remove sub2 (the last one)
    const newState = treeReducer(intermediate, {
      type: 'REMOVE_SUBCATEGORY',
      nodeId: 'male-b-sub2',
    });

    const maleB = findNodeById(newState.tree, 'male-b')!;

    expect(maleB.children).toHaveLength(0);
    expect(maleB).toBeDefined();
    // male-b's percentage should be unchanged within gender context
    const genderMale = findNodeById(newState.tree, 'gender-male')!;
    const maleBInGender = genderMale.children.find((c) => c.id === 'male-b')!;
    expect(maleBInGender).toBeDefined();
  });

  it('is no-op when nodeId not found', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'REMOVE_SUBCATEGORY',
      nodeId: 'nonexistent',
    };

    const newState = treeReducer(state, action);

    expect(newState).toBe(state);
  });

  it('recalculates absolute values after subcategory removal', () => {
    const state = createGenderState();
    const action: TreeAction = {
      type: 'REMOVE_SUBCATEGORY',
      nodeId: 'male-b-sub1',
    };

    const newState = treeReducer(state, action);
    const maleB = findNodeById(newState.tree, 'male-b')!;
    const remainingSub = maleB.children[0];

    // Remaining sub gets 100%, so its absolute value should equal male-b's absolute value
    expect(remainingSub.absoluteValue).toBe(
      Math.round(maleB.absoluteValue * 100 / 100),
    );
  });
});
