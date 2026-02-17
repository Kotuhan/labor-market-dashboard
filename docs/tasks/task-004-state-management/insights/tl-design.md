# Technical Design: task-004 -- Core State Management and Auto-Balance Logic
Generated: 2026-02-17

## Overview

Implement the core state management layer for the Labor Market Dashboard using React `useReducer`. This includes a pure auto-balance algorithm with cascading clamp behavior, lock guard logic, free/auto mode switching with proportional normalization, cascading absolute-value recalculation, and full reset. All code is pure logic (no JSX) delivered as utility functions in `src/utils/` and a custom hook in `src/hooks/`, with comprehensive unit tests.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/src/utils/`, `apps/labor-market-dashboard/src/hooks/`, `apps/labor-market-dashboard/src/types/`
- **New modules to create**:
  - `src/utils/calculations.ts` -- pure auto-balance, recalculation, normalization functions
  - `src/utils/treeUtils.ts` -- immutable tree update helpers (find node, update node by ID, recursive recalc)
  - `src/utils/index.ts` -- barrel export
  - `src/hooks/useTreeState.ts` -- `useReducer`-based hook exposing state + dispatch actions
  - `src/hooks/index.ts` -- barrel export
  - `src/types/actions.ts` -- reducer action type definitions
  - Updated `src/types/index.ts` -- add new type exports
- **DB schema change required?**: No (client-only SPA)
- **Architectural considerations**: Pure functions in `utils/` for testability; hook is a thin wrapper around `useReducer`; immutable tree updates via structural cloning
- **Known risks or trade-offs**:
  - [Low] Floating-point precision: mitigated by `largestRemainder()` with `decimals=1`
  - [Low] Performance on 55-node tree: expected <1ms for full recalc; well within 16ms budget
  - [Medium] Cascading clamp complexity: iterative loop with convergence guarantee (finite siblings, each iteration removes at least one from redistribution pool)
- **Test plan**: Unit tests for all pure functions in `utils/`; unit test for the `useReducer` reducer function directly (not via hook rendering); no integration tests needed for this task

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| `useReducer` (not Zustand) | User decision (Q4). Zero dependency, built-in React. Sufficient for tree state with ~6 action types. | Zustand (simpler API but adds dependency), Context+useState (too simple for complex updates) |
| Pure functions in `utils/calculations.ts` | Testable without React. Reducer calls these functions. Hook is a thin wrapper. | Logic inside reducer directly (harder to unit test), separate class (not idiomatic React) |
| Immutable tree updates via recursive clone | React requires referential inequality for re-renders. Structural sharing not needed for 55 nodes. | Immer (adds dependency), mutable updates with forced re-render (anti-pattern) |
| Separate `treeUtils.ts` for tree operations | Tree traversal/update is reusable across multiple reducer actions. Single-responsibility principle. | Inline in reducer (duplicated logic), tree class (over-engineering) |
| Action types as discriminated union | Standard `useReducer` pattern. Type-safe dispatch with exhaustive switch. | String constants + payload (less type-safe), enum (project prefers string unions) |
| Reducer exported as named function (not inline) | Allows direct unit testing of reducer without rendering React components. | Test via `renderHook` only (slower, unnecessary React dependency in tests) |
| `treeUtils.ts` uses `updateNodeById` helper | Single update function that clones the tree with one node modified. Composable for any action. | Per-action tree traversal (duplicated code), Map-based flat structure (different data model) |

## State Shape

The `DashboardState` interface from `src/types/tree.ts` is already defined and sufficient:

```typescript
interface DashboardState {
  totalPopulation: number;   // Default: 13_500_000
  balanceMode: BalanceMode;  // 'auto' | 'free'
  tree: TreeNode;            // Root of the tree
}
```

No modifications to existing types are needed. The state shape matches the existing `DashboardState` exactly.

## Action Types

New file: `src/types/actions.ts`

```typescript
/** Actions dispatched to the tree state reducer. */
export type TreeAction =
  | { type: 'SET_PERCENTAGE'; nodeId: string; value: number }
  | { type: 'TOGGLE_LOCK'; nodeId: string }
  | { type: 'SET_BALANCE_MODE'; mode: BalanceMode }
  | { type: 'SET_TOTAL_POPULATION'; value: number }
  | { type: 'RESET' };
```

Design notes:
- `SET_PERCENTAGE` is the primary action. The `value` is the new percentage for `nodeId`. In auto mode, siblings are rebalanced. In free mode, only the target node updates.
- `TOGGLE_LOCK` flips `isLocked` on the target node. Includes a guard: if toggling would leave 0 unlocked siblings (excluding the node itself) among its sibling group, the toggle is rejected (no-op).
- `SET_BALANCE_MODE` switches between auto and free. When switching to auto, all sibling groups are normalized to 100%.
- `SET_TOTAL_POPULATION` updates `totalPopulation` and recalculates all absolute values (percentages unchanged).
- `RESET` restores the entire state to the initial state (default tree, auto mode, 13.5M population).

## Auto-Balance Algorithm (Detailed)

### Core Function: `autoBalance(siblings, changedId, newValue)`

Located in `src/utils/calculations.ts`. This is a pure function.

**Input:**
- `siblings`: Array of `{ id: string; percentage: number; isLocked: boolean }` -- the sibling group (all children of a parent)
- `changedId`: ID of the node the user dragged
- `newValue`: New percentage for the changed node (0-100, 1 decimal)

**Output:**
- Array of `{ id: string; percentage: number }` -- new percentages for ALL siblings

**Algorithm (with cascading clamp):**

```
function autoBalance(siblings, changedId, newValue):
  // 1. Separate locked, changed, and available siblings
  lockedSiblings = siblings.filter(s => s.isLocked && s.id !== changedId)
  lockedSum = sum(lockedSiblings.percentage)

  // 2. Clamp newValue so changed + locked <= 100
  clampedValue = min(newValue, 100 - lockedSum)
  clampedValue = max(clampedValue, 0)

  // 3. Calculate remaining budget for unlocked siblings
  remaining = 100 - clampedValue - lockedSum

  // 4. Get unlocked siblings (excluding the changed one)
  unlocked = siblings.filter(s => !s.isLocked && s.id !== changedId)

  // 5. Distribute 'remaining' among unlocked siblings
  //    with cascading clamp (iterative)
  newPercentages = distributeWithCascadingClamp(unlocked, remaining)

  // 6. Assemble result: changed node gets clampedValue,
  //    locked nodes keep their percentage, unlocked get new values
  // 7. Apply largestRemainder to ensure exact 100.0 sum
  result = assembleAndRound(siblings, changedId, clampedValue, lockedSiblings, newPercentages)

  return result
```

### Cascading Clamp Sub-Algorithm: `distributeWithCascadingClamp(unlocked, budget)`

This handles the case where proportional redistribution would push some siblings below 0%. It iteratively clamps and redistributes.

```
function distributeWithCascadingClamp(unlocked, budget):
  // unlocked: array of { id, percentage }
  // budget: total percentage to distribute among them

  if unlocked.length === 0:
    return []  // nothing to distribute to

  oldSum = sum(unlocked.percentage)

  if oldSum === 0:
    // Special case: all unlocked siblings are at 0%
    // Distribute equally
    equalShare = budget / unlocked.length
    return unlocked.map(s => { id: s.id, percentage: equalShare })

  // Iterative proportional distribution with clamping
  result = new Map(unlocked.map(s => [s.id, s.percentage]))
  clamped = new Set()  // IDs of siblings clamped to 0
  remainingBudget = budget

  loop (max iterations = unlocked.length):
    // Get currently active (unclamped) siblings
    active = unlocked.filter(s => !clamped.has(s.id))
    if active.length === 0: break

    activeOldSum = sum(active.map(s => result.get(s.id)))

    if activeOldSum === 0:
      // All active are at 0 -- distribute equally
      equalShare = remainingBudget / active.length
      for s in active:
        result.set(s.id, equalShare)
      break

    // Proportional distribution
    anyClampedThisRound = false
    for s in active:
      proportional = (result.get(s.id) / activeOldSum) * remainingBudget
      if proportional < 0:
        result.set(s.id, 0)
        clamped.add(s.id)
        anyClampedThisRound = true
      else:
        result.set(s.id, proportional)

    if !anyClampedThisRound:
      break  // No clamping needed, we're done

    // Recalculate remaining budget (subtract clamped zeros)
    clampedSum = sum of result values for clamped IDs  // always 0
    remainingBudget = budget - clampedSum  // = budget (since clamped = 0)

  return unlocked.map(s => { id: s.id, percentage: result.get(s.id) })
```

**Convergence guarantee:** Each iteration clamps at least one sibling. With N unlocked siblings, the loop runs at most N times.

**Key insight:** The `remainingBudget` stays the same across iterations because clamped items contribute 0. What changes is the pool of active items. So effectively, the budget must be redistributed among fewer items each round.

### Simplified Implementation

In practice, for a budget >= 0 (which is guaranteed by the clamp in step 2 of `autoBalance`), no sibling will go below 0 during proportional redistribution. The cascading clamp only triggers when `budget < 0`, which cannot happen because `clampedValue = min(newValue, 100 - lockedSum)` ensures `remaining >= 0`.

However, we must still handle the edge case: when `budget` is very small and `oldSum` is very large, proportional redistribution gives very small (but non-negative) values. The cascading clamp is more relevant if we relax the clamping of the changed node -- but per the resolved Q3, we clamp the changed node first, making `remaining >= 0`.

**Wait -- re-examining Q3 resolution:** Q3 says "Cascading clamp at 0% (redistribute excess among remaining unlocked siblings with room)." This means the scenario is: the changed node's increase causes some unlocked siblings to be proportionally reduced to below 0%. This can happen when:
- Changed node goes to a very high value
- Some unlocked siblings had small percentages
- The proportional reduction `(oldPct / oldSum) * remaining` is fine because `remaining >= 0`

Actually, since `remaining >= 0` and all `oldPct >= 0`, proportional gives non-negative values. The cascading clamp scenario truly matters when `remaining` could be negative, which our algorithm prevents.

**The real cascading clamp scenario is edge-case:** If a sibling was already at 0% and budget is positive, proportional gives it 0 -- that is correct. If all unlocked siblings are at 0% and budget > 0, equal distribution kicks in.

So the algorithm simplifies to:
1. Clamp changed node to `[0, 100 - lockedSum]`
2. `remaining = 100 - clampedValue - lockedSum` (always >= 0)
3. If `oldSum > 0`: proportional distribution among unlocked
4. If `oldSum === 0`: equal distribution among unlocked
5. Apply `largestRemainder()` to all sibling percentages with target=100, decimals=1

### Final Algorithm (Cleaned Up)

```typescript
function autoBalance(
  siblings: readonly SiblingInfo[],
  changedId: string,
  newValue: number,
): PercentageUpdate[] {
  const locked = siblings.filter(s => s.isLocked && s.id !== changedId);
  const lockedSum = locked.reduce((sum, s) => sum + s.percentage, 0);
  const unlocked = siblings.filter(s => !s.isLocked && s.id !== changedId);

  // Clamp the changed value
  const clampedValue = Math.max(0, Math.min(newValue, 100 - lockedSum));
  const remaining = 100 - clampedValue - lockedSum;

  // Distribute remaining among unlocked
  const oldUnlockedSum = unlocked.reduce((sum, s) => sum + s.percentage, 0);
  let rawPercentages: number[];

  if (unlocked.length === 0) {
    rawPercentages = [];
  } else if (oldUnlockedSum === 0) {
    // Equal distribution
    const share = remaining / unlocked.length;
    rawPercentages = unlocked.map(() => share);
  } else {
    // Proportional distribution
    rawPercentages = unlocked.map(s => (s.percentage / oldUnlockedSum) * remaining);
  }

  // Assemble all percentages in original order, then apply largestRemainder
  const allRaw = siblings.map(s => {
    if (s.id === changedId) return clampedValue;
    if (s.isLocked) return s.percentage;
    const idx = unlocked.findIndex(u => u.id === s.id);
    return rawPercentages[idx];
  });

  const rounded = largestRemainder(allRaw, 100, 1);
  return siblings.map((s, i) => ({ id: s.id, percentage: rounded[i] }));
}
```

## Mode Switching Logic

### Auto to Free
No-op on values. Only `balanceMode` changes to `'free'`. All percentages, locks, and absolute values remain as-is.

### Free to Auto (Proportional Normalization)
For every sibling group in the tree (children of each parent with children), normalize percentages to sum to exactly 100%:

```typescript
function normalizeToAuto(tree: TreeNode): TreeNode {
  // Recursively process each node that has children
  if (node.children.length === 0) return node;

  const sum = node.children.reduce((s, c) => s + c.percentage, 0);
  let normalizedChildren: TreeNode[];

  if (sum === 0) {
    // All zero: distribute equally
    const equalPct = 100 / node.children.length;
    normalizedChildren = node.children.map(c => ({ ...c, percentage: equalPct }));
  } else {
    // Proportional scale
    const rawPcts = node.children.map(c => (c.percentage / sum) * 100);
    const rounded = largestRemainder(rawPcts, 100, 1);
    normalizedChildren = node.children.map((c, i) => ({ ...c, percentage: rounded[i] }));
  }

  // Also unlock all nodes when switching to auto? -- No, locks persist across mode switches.
  // Recursively normalize children's children
  normalizedChildren = normalizedChildren.map(c => normalizeToAuto(c));

  return { ...node, children: normalizedChildren };
}
```

**Design note:** Locks are NOT cleared on mode switch. This preserves user intent. The normalization applies to all siblings regardless of lock status (it is a proportional scale, not a redistribution).

## Lock Guard Logic

When the user attempts to toggle lock on a node:

```typescript
function canToggleLock(nodeId: string, siblings: TreeNode[]): boolean {
  const node = siblings.find(s => s.id === nodeId);
  if (!node) return false;

  if (node.isLocked) {
    // Unlocking is always allowed
    return true;
  }

  // Locking: check if it would leave 0 unlocked siblings
  const currentlyUnlocked = siblings.filter(s => !s.isLocked);
  // We need at least 2 unlocked (the one being locked + at least 1 remaining)
  // Actually: at least 1 remaining unlocked sibling for redistribution
  return currentlyUnlocked.length >= 2;
}
```

If `canToggleLock` returns false, the `TOGGLE_LOCK` action is a no-op. The UI layer (future task) can use a separate `canLock(nodeId)` query function to disable the lock button.

**Important:** This guard only matters in auto mode. In free mode, locking has no functional effect (sliders are independent). However, we apply the guard consistently in both modes so that switching to auto mode doesn't create an invalid state.

## Cascading Recalculation

After any percentage change, absolute values must be recalculated top-down:

```typescript
function recalcAbsoluteValues(node: TreeNode, parentAbsoluteValue: number): TreeNode {
  const absoluteValue = Math.round(parentAbsoluteValue * node.percentage / 100);
  const children = node.children.map(child =>
    recalcAbsoluteValues(child, absoluteValue)
  );
  return { ...node, absoluteValue, children };
}
```

This is called after every state change that affects percentages or total population:
- `SET_PERCENTAGE`: recalc from the parent of the changed node downward (optimization) or from root (simpler, negligible cost for 55 nodes)
- `SET_BALANCE_MODE` (free -> auto): recalc from root (normalization changes percentages)
- `SET_TOTAL_POPULATION`: recalc from root (new root absolute value)
- `RESET`: no need (defaultTree already has correct absolute values)

**Decision: Always recalc from root.** For 55 nodes, this is <1ms. The simplicity benefit outweighs the negligible performance cost.

## Reset Mechanism

The `RESET` action returns the initial state:

```typescript
const initialState: DashboardState = {
  totalPopulation: 13_500_000,
  balanceMode: 'auto',
  tree: defaultTree,
};

// In reducer:
case 'RESET':
  return initialState;
```

Since `defaultTree` is a frozen constant with pre-computed absolute values, no recalculation is needed.

## Deviation Tracking (Free Mode)

In free mode, sibling percentages may not sum to 100%. The UI (SummaryBar, future task) needs to know the deviation. Rather than storing deviation in state (which would be derived data), we provide a utility function:

```typescript
function getSiblingDeviation(parentNode: TreeNode): number {
  if (parentNode.children.length === 0) return 0;
  const sum = parentNode.children.reduce((s, c) => s + c.percentage, 0);
  return Math.round((sum - 100) * 10) / 10; // 1 decimal place
}
```

This is computed on-demand, not stored in state. React components can call this during render.

## Performance Considerations

- **55-node tree**: Full tree clone + recalculation is O(N) where N=55. Expected <1ms.
- **`largestRemainder()`**: O(N log N) per sibling group (sorting step). Max N=16 (industries). Negligible.
- **Immutable updates**: Each action creates a new tree object. React's shallow comparison detects the change. No `useMemo` needed at the state level (components can memoize their own derived data).
- **No debouncing**: Slider debouncing is a UI concern (task-005). The state layer handles every dispatch instantly.
- **Benchmark target**: <16ms per dispatch (one frame). Expected actual: <2ms.

## File Layout

```
apps/labor-market-dashboard/src/
  types/
    tree.ts                  # Existing (no changes)
    actions.ts               # NEW: TreeAction union type
    index.ts                 # MODIFY: add TreeAction export
  utils/
    calculations.ts          # NEW: autoBalance, normalizeGroup, recalcAbsoluteValues, getSiblingDeviation
    treeUtils.ts             # NEW: findNodeById, findParentById, updateNodeInTree, collectSiblingInfo
    index.ts                 # NEW: barrel export
  hooks/
    useTreeState.ts          # NEW: useReducer hook, reducer function, initial state
    index.ts                 # NEW: barrel export
  data/
    defaultTree.ts           # Existing (no changes)
    dataHelpers.ts           # Existing (no changes, largestRemainder reused)
    index.ts                 # Existing (no changes)
  __tests__/
    utils/
      calculations.test.ts  # NEW: auto-balance tests (15+ test cases)
      treeUtils.test.ts      # NEW: tree utility tests (8+ test cases)
    hooks/
      useTreeState.test.ts   # NEW: reducer tests (12+ test cases)
```

## Intermediate Types (Internal)

These types are used internally by `calculations.ts` and do not need to be exported from the `types/` barrel:

```typescript
/** Minimal sibling info needed for auto-balance calculation. */
interface SiblingInfo {
  id: string;
  percentage: number;
  isLocked: boolean;
}

/** Result of auto-balance: new percentage per sibling. */
interface PercentageUpdate {
  id: string;
  percentage: number;
}
```

These will be defined and exported from `utils/calculations.ts` (co-located with usage, not in `types/`).

## Implementation Steps

### Step 1 -- Create action types (`src/types/actions.ts`)

**Files:**
- Create: `apps/labor-market-dashboard/src/types/actions.ts`
- Modify: `apps/labor-market-dashboard/src/types/index.ts` (add export)

**Details:**
- Define `TreeAction` discriminated union with 5 action types: `SET_PERCENTAGE`, `TOGGLE_LOCK`, `SET_BALANCE_MODE`, `SET_TOTAL_POPULATION`, `RESET`
- Each action variant uses a `type` string literal discriminant
- `SET_PERCENTAGE` carries `nodeId: string` and `value: number`
- `TOGGLE_LOCK` carries `nodeId: string`
- `SET_BALANCE_MODE` carries `mode: BalanceMode` (import from `./tree`)
- `SET_TOTAL_POPULATION` carries `value: number`
- `RESET` has no payload
- Add `export type { TreeAction } from './actions'` to `types/index.ts`

**Verification:**
- `pnpm build --filter @template/labor-market-dashboard` succeeds (type-check)
- Types are importable via `@/types`

---

### Step 2 -- Create tree utility functions (`src/utils/treeUtils.ts`)

**Files:**
- Create: `apps/labor-market-dashboard/src/utils/treeUtils.ts`

**Details:**
- `findNodeById(tree: TreeNode, id: string): TreeNode | undefined` -- depth-first search
- `findParentById(tree: TreeNode, childId: string): TreeNode | undefined` -- returns the parent of the node with given ID
- `updateNodeInTree(tree: TreeNode, id: string, updater: (node: TreeNode) => TreeNode): TreeNode` -- returns a new tree with the specified node replaced by the updater result. Immutable (clones path from root to target).
- `updateChildrenInTree(tree: TreeNode, parentId: string, updater: (children: TreeNode[]) => TreeNode[]): TreeNode` -- returns a new tree with the children of `parentId` replaced. Used for batch-updating sibling percentages after auto-balance.
- `collectSiblingInfo(parent: TreeNode): SiblingInfo[]` -- extracts `{id, percentage, isLocked}` from children

**Verification:**
- `pnpm build --filter @template/labor-market-dashboard` succeeds

---

### Step 3 -- Create tree utility tests (`src/__tests__/utils/treeUtils.test.ts`)

**Files:**
- Create: `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts`

**Details:**
- Test `findNodeById`: finds root, finds leaf, returns undefined for missing ID
- Test `findParentById`: finds parent of known child, returns undefined for root, returns undefined for missing ID
- Test `updateNodeInTree`: updates a leaf node, verifies immutability (original tree unchanged), verifies path cloning
- Test `updateChildrenInTree`: updates children of a parent, verifies immutability
- Test `collectSiblingInfo`: extracts correct info from children array
- Use a small test fixture tree (root -> 2 children -> 2 grandchildren) rather than full defaultTree

**Verification:**
- `pnpm test --filter @template/labor-market-dashboard` -- all treeUtils tests pass

---

### Step 4 -- Create calculation functions (`src/utils/calculations.ts`)

**Files:**
- Create: `apps/labor-market-dashboard/src/utils/calculations.ts`

**Details:**
- Define `SiblingInfo` and `PercentageUpdate` interfaces (exported)
- `autoBalance(siblings: readonly SiblingInfo[], changedId: string, newValue: number): PercentageUpdate[]`
  - Implements the algorithm from the Architecture Decisions section
  - Clamps changed value to `[0, 100 - lockedSum]`
  - Distributes remaining among unlocked proportionally (or equally if all at 0%)
  - Applies `largestRemainder(allPercentages, 100, 1)` for rounding
  - Returns all siblings with new percentages
- `normalizeGroup(children: readonly { percentage: number }[]): number[]`
  - Proportionally scales percentages to sum to 100. Used for free-to-auto mode switch.
  - Handles all-zero case (equal distribution)
  - Applies `largestRemainder()` for rounding
- `recalcAbsoluteValues(node: TreeNode, parentAbsoluteValue: number): TreeNode`
  - Recursively recomputes `absoluteValue = Math.round(parentAbsoluteValue * percentage / 100)`
  - Returns a new tree (immutable)
- `getSiblingDeviation(parentNode: TreeNode): number`
  - Returns `sum(children.percentage) - 100`, rounded to 1 decimal
  - Returns 0 if no children
- `canToggleLock(nodeId: string, siblings: readonly TreeNode[]): boolean`
  - Returns false if locking `nodeId` would leave 0 unlocked siblings
  - Always returns true for unlocking
- Import `largestRemainder` from `@/data/dataHelpers`
- Import `TreeNode` from `@/types`

**Verification:**
- `pnpm build --filter @template/labor-market-dashboard` succeeds

---

### Step 5 -- Create calculation tests (`src/__tests__/utils/calculations.test.ts`)

**Files:**
- Create: `apps/labor-market-dashboard/src/__tests__/utils/calculations.test.ts`

**Details:**

`autoBalance` tests:
- 3 unlocked siblings, change one: others adjust proportionally, sum = 100
- 1 locked sibling: locked value unchanged, remaining sibling absorbs
- All but changed locked: changed clamps to max available
- Unlocked siblings at 0%: equal distribution of freed percentage
- Single unlocked sibling: absorbs all remaining
- Changed to 0%: remaining distributed among unlocked
- Changed to 100% (minus locked): all unlocked go to 0
- 2-sibling group (gender): simple complement (one goes up, other goes down)
- Verify `largestRemainder` rounding: sum is exactly 100.0

`normalizeGroup` tests:
- Normal case: [30, 40, 45] -> proportionally scaled to 100
- Already at 100: returns same values
- All zeros: equal distribution
- Single child: gets 100

`recalcAbsoluteValues` tests:
- Root with 2 children: absolute values correct
- 3-level tree: cascading calculation correct
- Rounding: uses Math.round

`getSiblingDeviation` tests:
- Sums to 100: returns 0
- Sums to 115: returns 15
- Sums to 90: returns -10
- No children: returns 0

`canToggleLock` tests:
- 3 siblings, 0 locked: can lock any
- 3 siblings, 1 locked: can lock another (1 remains unlocked)
- 3 siblings, 2 locked: cannot lock the last unlocked
- Unlocking always allowed

**Verification:**
- `pnpm test --filter @template/labor-market-dashboard` -- all calculations tests pass

---

### Step 6 -- Create barrel export for utils (`src/utils/index.ts`)

**Files:**
- Create: `apps/labor-market-dashboard/src/utils/index.ts`

**Details:**
- Export all public functions from `calculations.ts` and `treeUtils.ts`
- Use named exports (not `export *` for explicitness)

**Verification:**
- `pnpm build --filter @template/labor-market-dashboard` succeeds

---

### Step 7 -- Create the reducer and hook (`src/hooks/useTreeState.ts`)

**Files:**
- Create: `apps/labor-market-dashboard/src/hooks/useTreeState.ts`
- Create: `apps/labor-market-dashboard/src/hooks/index.ts`

**Details:**

The reducer function (`treeReducer`) is exported as a named export for direct testing:

```typescript
export function treeReducer(state: DashboardState, action: TreeAction): DashboardState
```

Action handling:

**`SET_PERCENTAGE`:**
1. Find the parent of `action.nodeId` in the tree
2. If not found or node is locked, return state unchanged
3. If `balanceMode === 'auto'`:
   a. Collect sibling info from parent's children
   b. Call `autoBalance(siblings, nodeId, value)`
   c. Update all children of the parent with new percentages
   d. Recalc absolute values from root
4. If `balanceMode === 'free'`:
   a. Update only the target node's percentage
   b. Recalc absolute values from root

**`TOGGLE_LOCK`:**
1. Find the parent of `action.nodeId`
2. Call `canToggleLock(nodeId, parent.children)`
3. If false, return state unchanged
4. Toggle `isLocked` on the target node

**`SET_BALANCE_MODE`:**
1. If `action.mode === state.balanceMode`, return state unchanged
2. If switching to `'auto'`:
   a. Recursively normalize all sibling groups in the tree
   b. Recalc absolute values from root
3. If switching to `'free'`:
   a. Only update `balanceMode` (no value changes)

**`SET_TOTAL_POPULATION`:**
1. Update `totalPopulation`
2. Update root's `absoluteValue` to the new total
3. Recalc absolute values from root (percentages unchanged)

**`RESET`:**
1. Return `initialState`

The hook:

```typescript
export function useTreeState() {
  const [state, dispatch] = useReducer(treeReducer, initialState);
  return { state, dispatch };
}
```

The hook intentionally returns raw `dispatch` rather than wrapping each action in a named function. This keeps the hook thin and lets the UI layer compose actions however it needs. Future tasks (005+) can create convenience wrappers if needed.

`initialState` is a module-level constant:

```typescript
const initialState: DashboardState = {
  totalPopulation: defaultTree.absoluteValue,
  balanceMode: 'auto' as const,
  tree: defaultTree,
};
```

**Verification:**
- `pnpm build --filter @template/labor-market-dashboard` succeeds

---

### Step 8 -- Create reducer and hook tests (`src/__tests__/hooks/useTreeState.test.ts`)

**Files:**
- Create: `apps/labor-market-dashboard/src/__tests__/hooks/useTreeState.test.ts`

**Details:**

Test the `treeReducer` function directly (import and call it, no React rendering needed).

Tests:
- **SET_PERCENTAGE (auto mode):** dispatch with a known nodeId, verify sibling percentages sum to 100, verify target node has new value (or clamped), verify absolute values recalculated
- **SET_PERCENTAGE (free mode):** only target node changes, siblings unchanged
- **SET_PERCENTAGE (locked target):** dispatch on a locked node is no-op (state unchanged)
- **TOGGLE_LOCK:** toggles isLocked on target node
- **TOGGLE_LOCK (guard):** attempting to lock the last unlocked sibling is no-op
- **SET_BALANCE_MODE (auto to free):** mode changes, values unchanged
- **SET_BALANCE_MODE (free to auto):** mode changes, percentages normalized to 100
- **SET_TOTAL_POPULATION:** totalPopulation updates, all absolute values recalculate, percentages unchanged
- **RESET:** returns to initial state (defaultTree, auto, 13.5M)
- **Initial state:** verify it matches defaultTree structure
- **Cascading recalc:** change a gender node percentage, verify all descendant absolute values update
- **Performance:** measure time for a SET_PERCENTAGE dispatch on full 55-node tree, assert < 16ms

Use a small test fixture for most tests (3-5 nodes). Use `defaultTree` for the performance test and the cascading recalc test.

**Verification:**
- `pnpm test --filter @template/labor-market-dashboard` -- all tests pass

---

### Step 9 -- Final verification

**Files:** None (verification only)

**Details:**
- Run `pnpm lint --filter @template/labor-market-dashboard` -- no errors
- Run `pnpm test --filter @template/labor-market-dashboard` -- all tests pass (existing + new)
- Run `pnpm build --filter @template/labor-market-dashboard` -- builds successfully
- Manually verify test count: expect ~35+ new tests across 3 test files
- Verify no `any` types used
- Verify all new files use `.ts` extension (no `.tsx`)

**Verification:**
- All three commands pass with zero errors

## Complexity Assessment

- **Estimated effort**: 2 days
  - Step 1 (types): 0.5 hours
  - Step 2 (treeUtils): 1.5 hours
  - Step 3 (treeUtils tests): 1 hour
  - Step 4 (calculations): 2 hours
  - Step 5 (calculations tests): 2 hours
  - Step 6 (barrel): 0.25 hours
  - Step 7 (reducer + hook): 2 hours
  - Step 8 (reducer tests): 2 hours
  - Step 9 (verification): 0.5 hours
- **Risk level**: Medium
  - The auto-balance algorithm has subtle edge cases, but all are well-defined by the resolved open questions
  - Immutable tree updates are straightforward for a 55-node tree
- **Dependencies**:
  - `task-002` (types): Complete -- `TreeNode`, `DashboardState`, `BalanceMode` exist
  - `task-003` (default data): Complete -- `defaultTree` and `largestRemainder` exist
  - No external library dependencies (useReducer is built-in React)

## Test Strategy

- **Unit tests** (this task):
  - `calculations.test.ts`: ~15 test cases covering autoBalance, normalizeGroup, recalcAbsoluteValues, getSiblingDeviation, canToggleLock
  - `treeUtils.test.ts`: ~8 test cases covering findNodeById, findParentById, updateNodeInTree, updateChildrenInTree, collectSiblingInfo
  - `useTreeState.test.ts`: ~12 test cases covering all 5 action types, edge cases, performance
  - Total: ~35 new test cases
- **Integration tests**: Not needed. All logic is pure functions + a reducer. No I/O, no side effects, no async.
- **E2E tests**: Not applicable (no UI in this task)

## Open Technical Questions

None. All design decisions are resolved by the PO open questions (Q1-Q5) and established codebase conventions.
