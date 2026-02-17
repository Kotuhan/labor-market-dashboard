---
id: task-004
title: Implement Core State Management and Auto-Balance Logic
status: backlog
priority: high
dependencies: [task-003]
created_at: 2026-02-17
---

# Implement Core State Management and Auto-Balance Logic

## Problem (PO)

The dashboard has a complete data model (task-002) and static default data (task-003), but no mechanism for users to interact with the data. Sliders cannot be moved, percentages cannot change, and "what-if" scenarios cannot be modeled -- which is the entire value proposition of the product.

From the user's perspective: "I want to drag a slider to change an industry's percentage and immediately see the rest of the industries adjust to maintain 100%, with absolute numbers recalculating in real time. If I need to fix certain industries, I want to lock them. And if I want to experiment freely without the 100% constraint, I want a mode for that."

Every downstream UI task (sliders, pie charts, tree panel, summary bar) depends on state management. This task is the critical path between static data and a functional dashboard. If we do nothing, all tasks 005+ are blocked and the product delivers zero interactive value.

## Success Criteria (PO)

1. User can change any node's percentage and sibling percentages auto-rebalance to maintain 100% sum.
2. User can lock nodes to exclude them from rebalancing.
3. User can switch to "free" mode where sliders are independent (no rebalancing); sum deviation is exposed in state.
4. Switching from free to auto mode normalizes percentages back to 100%.
5. Absolute values cascade-recalculate throughout the entire tree on any percentage change.
6. Changing total population recalculates all absolute values while preserving percentages.
7. Reset action restores the entire tree to `defaultTree` state.
8. All state transitions complete within 16ms for a 55-node tree (well under PRD's 100ms target).
9. Full unit test coverage for auto-balance, locking, mode switching, cascading recalculation, and reset.

## Acceptance Criteria (PO)

### Auto-Balance Mode

* Given auto-balance mode with siblings [A=30%, B=40%, C=30%] all unlocked
  When the user changes A to 50%
  Then B and C are proportionally reduced to maintain 100% total, and all absolute values recalculate

* Given auto-balance mode with siblings [A=30%, B=40%, C=30%] where B is locked
  When the user changes A to 50%
  Then B remains at 40%, C adjusts to 10%, total remains 100%

* Given auto-balance mode with all siblings except the changed one locked
  When the user changes a slider
  Then the change is clamped to the maximum available (100% minus locked sum), no node goes below 0%

* Given auto-balance mode with unlocked siblings all at 0%
  When the user decreases a sibling (freeing percentage)
  Then freed percentage is distributed equally among the 0% unlocked siblings

* Given a node's percentage changes in auto-balance mode
  When new percentages are calculated
  Then `largestRemainder()` is applied so sibling percentages sum to exactly 100.0

### Free Mode

* Given free mode
  When the user changes any slider
  Then only that node's percentage and absolute value update; no siblings are affected

* Given free mode with sibling percentages summing to 115%
  When the user inspects state
  Then state exposes the deviation from 100% for UI consumption

### Mode Switching

* Given free mode with percentages summing != 100%
  When the user switches to auto-balance mode
  Then all sibling percentages are normalized proportionally to sum to exactly 100%

* Given auto-balance mode
  When the user switches to free mode
  Then no values change; percentages remain as-is

### Cascading Recalculation

* Given a gender node's percentage changes (e.g., Male 52.66% to 60%)
  When state updates
  Then gender absolute value recalculates from root, all children recalculate recursively

* Given the user changes total population from 13,500,000 to 15,000,000
  When state updates
  Then root absolute value becomes 15,000,000 and every node recalculates absolute values; percentages unchanged

### Lock/Unlock

* Given a node is unlocked
  When the user toggles its lock
  Then isLocked becomes true and node is excluded from auto-balance redistribution

* Given a node is locked
  When the user toggles its lock
  Then isLocked becomes false and node participates in redistribution again

### Reset

* Given the user has modified sliders and locked nodes
  When the user triggers reset
  Then tree returns to defaultTree state: all percentages equal defaultPercentage, all isLocked false, balanceMode 'auto', totalPopulation 13,500,000

### Performance

* Given a tree with 55 nodes
  When any state action is dispatched
  Then the state update completes in under 16ms

### Testing

* Given the state management hooks and utilities
  When unit tests run via `pnpm test`
  Then all tests pass covering: auto-balance redistribution, locked node exclusion, edge cases (all locked, all zero, single sibling), free mode, mode switching, cascading recalculation, total population change, and reset

## Out of Scope (PO)

- **UI components**: No Slider, PieChart, TreePanel, ModeToggle, SummaryBar, or ResetButton. Those are tasks 005-009. This task produces only hooks and utility functions.
- **Visual rendering or DOM interaction**: No JSX, no CSS, no Tailwind. Pure logic and state.
- **Undo/redo functionality**: Not in PRD v1.
- **Scenario saving/loading (localStorage)**: Explicitly excluded per PRD Section 11.
- **URL-based state persistence (query params)**: Not in PRD v1.
- **Debouncing or throttling of slider input**: UI-layer optimization for the Slider component (task-005).
- **Validation UI (error messages, toasts)**: State may contain validation data, but no user-facing error display.
- **Animation/transition timing**: State updates are instant; animation is a UI concern.
- **Drag-and-drop tree reordering**: Tree structure is fixed; only values change.

## Open Questions (PO)

* **Q1 (MODE SWITCH NORMALIZATION)**: RESOLVED -> **(a) Proportional normalize**. Scale all percentages proportionally so they sum to exactly 100%.

* **Q2 (LOCK LIMIT)**: RESOLVED -> **(a) Prevent last lock**. Proactively prevent locking the last unlock-able sibling. Always keep at least one redistribution target.

* **Q3 (NEGATIVE PERCENTAGE CLAMPING)**: RESOLVED -> **(a) Cascading clamp**. Clamp at 0% and redistribute the leftover excess among remaining unlocked siblings that still have room.

* **Q4 (STATE MANAGEMENT CHOICE)**: RESOLVED -> **useReducer**. Use React built-in useReducer, no external dependency.

* **Q5 (PERCENTAGE PRECISION)**: RESOLVED -> **1 decimal place**. Matches defaultTree data and largestRemainder with decimals=1.

---

## Technical Notes (TL)

- **Affected modules**: `apps/labor-market-dashboard/src/utils/`, `apps/labor-market-dashboard/src/hooks/`, `apps/labor-market-dashboard/src/types/`
- **New modules to create**:
  - `src/types/actions.ts` -- `TreeAction` discriminated union (5 action types)
  - `src/utils/calculations.ts` -- pure auto-balance, normalization, recalculation, deviation, lock-guard functions
  - `src/utils/treeUtils.ts` -- immutable tree traversal/update helpers
  - `src/utils/index.ts` -- barrel export
  - `src/hooks/useTreeState.ts` -- `useReducer`-based hook with exported reducer function
  - `src/hooks/index.ts` -- barrel export
- **DB schema change required?**: No (client-only SPA)
- **Architectural considerations**:
  - Pure functions in `utils/` for testability; reducer calls these functions; hook is a thin wrapper
  - Immutable tree updates via recursive clone (55 nodes, no structural sharing needed)
  - `largestRemainder()` from `dataHelpers.ts` used for all percentage rounding (1 decimal place)
  - Always recalc absolute values from root after any percentage change (simple, <1ms for 55 nodes)
  - Reducer exported as named function for direct unit testing (no React rendering needed)
- **Known risks or trade-offs**:
  - [Low] Floating-point precision: mitigated by `largestRemainder()` with `decimals=1`
  - [Low] Performance on 55-node tree: expected <1ms, well within 16ms budget
  - [Medium] Auto-balance edge cases: all well-defined by resolved Q1-Q5; proportional distribution with equal-distribution fallback when oldSum=0
- **Test plan**: Unit tests only (~35 test cases across 3 test files). No integration/E2E tests needed (pure logic, no I/O).

## Implementation Steps (TL)

1. **Create action types** (`src/types/actions.ts`)
   - Files: Create `src/types/actions.ts`, modify `src/types/index.ts`
   - Define `TreeAction` discriminated union: `SET_PERCENTAGE`, `TOGGLE_LOCK`, `SET_BALANCE_MODE`, `SET_TOTAL_POPULATION`, `RESET`
   - Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

2. **Create tree utility functions** (`src/utils/treeUtils.ts`)
   - Files: Create `src/utils/treeUtils.ts`
   - Implement: `findNodeById`, `findParentById`, `updateNodeInTree`, `updateChildrenInTree`, `collectSiblingInfo`
   - All functions are pure and return new objects (immutable updates)
   - Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

3. **Create tree utility tests** (`src/__tests__/utils/treeUtils.test.ts`)
   - Files: Create `src/__tests__/utils/treeUtils.test.ts`
   - 8+ test cases: find, parent-find, update immutability, children update, sibling info collection
   - Verification: `pnpm test --filter @template/labor-market-dashboard` -- treeUtils tests pass

4. **Create calculation functions** (`src/utils/calculations.ts`)
   - Files: Create `src/utils/calculations.ts`
   - Implement: `autoBalance`, `normalizeGroup`, `recalcAbsoluteValues`, `getSiblingDeviation`, `canToggleLock`
   - Reuse `largestRemainder` from `@/data/dataHelpers`
   - Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

5. **Create calculation tests** (`src/__tests__/utils/calculations.test.ts`)
   - Files: Create `src/__tests__/utils/calculations.test.ts`
   - 15+ test cases: proportional redistribution, locked exclusion, clamping, all-zero fallback, normalization, recalc, deviation, lock guard
   - Verification: `pnpm test --filter @template/labor-market-dashboard` -- calculation tests pass

6. **Create barrel export for utils** (`src/utils/index.ts`)
   - Files: Create `src/utils/index.ts`
   - Export all public functions and types from calculations and treeUtils
   - Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

7. **Create reducer and hook** (`src/hooks/useTreeState.ts`)
   - Files: Create `src/hooks/useTreeState.ts`, `src/hooks/index.ts`
   - Export `treeReducer` (named, for testing) and `useTreeState` hook
   - Handle all 5 action types with full cascading recalculation
   - Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

8. **Create reducer and hook tests** (`src/__tests__/hooks/useTreeState.test.ts`)
   - Files: Create `src/__tests__/hooks/useTreeState.test.ts`
   - 12+ test cases: all action types, edge cases (locked target, guard, cascading recalc), performance (<16ms)
   - Verification: `pnpm test --filter @template/labor-market-dashboard` -- all reducer tests pass

9. **Final verification** -- run full suite
   - Run `pnpm lint --filter @template/labor-market-dashboard` -- no errors
   - Run `pnpm test --filter @template/labor-market-dashboard` -- all tests pass (~35 new + existing)
   - Run `pnpm build --filter @template/labor-market-dashboard` -- builds successfully
   - Verify no `any` types, all files use `.ts` extension (no `.tsx`)

---

## Implementation Log (DEV)

_To be filled during implementation._

---

## QA Notes (QA)

_To be filled by QA agent._
