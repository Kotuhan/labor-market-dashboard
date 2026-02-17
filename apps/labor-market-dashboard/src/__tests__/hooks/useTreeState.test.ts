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
