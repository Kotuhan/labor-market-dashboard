# QA Plan: task-004 -- Core State Management and Auto-Balance Logic

Generated: 2026-02-17
Verified By: QA Agent

## Test Scope

This verification covers the core state management layer for the Labor Market Dashboard: action types, tree utility functions, calculation functions (auto-balance, normalization, recalculation, deviation, lock guard), the `useReducer`-based hook with exported reducer, and all associated unit tests. This is pure logic only -- no JSX, no CSS, no UI components.

**Files under test:**
- `apps/labor-market-dashboard/src/types/actions.ts` (NEW)
- `apps/labor-market-dashboard/src/types/index.ts` (MODIFIED)
- `apps/labor-market-dashboard/src/utils/treeUtils.ts` (NEW)
- `apps/labor-market-dashboard/src/utils/calculations.ts` (NEW)
- `apps/labor-market-dashboard/src/utils/index.ts` (NEW)
- `apps/labor-market-dashboard/src/hooks/useTreeState.ts` (NEW)
- `apps/labor-market-dashboard/src/hooks/index.ts` (NEW)

**Test files:**
- `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts` (NEW -- 15 tests)
- `apps/labor-market-dashboard/src/__tests__/utils/calculations.test.ts` (NEW -- 28 tests)
- `apps/labor-market-dashboard/src/__tests__/hooks/useTreeState.test.ts` (NEW -- 19 tests)

---

## Test Cases

### TC-004-01: Auto-Balance Proportional Redistribution
**Priority**: Critical
**Type**: Unit
**AC**: Auto-Balance AC #1 -- siblings [A=30%, B=40%, C=30%] all unlocked, change A to 50%
**Test File**: `calculations.test.ts` > `autoBalance` > "redistributes proportionally among 3 unlocked siblings"
**Expected**: B~28.6%, C~21.4%, sum=100
**Status**: PASS

### TC-004-02: Auto-Balance with Locked Sibling
**Priority**: Critical
**Type**: Unit
**AC**: Auto-Balance AC #2 -- siblings [A=30%, B=40% locked, C=30%], change A to 50%
**Test File**: `calculations.test.ts` > `autoBalance` > "excludes locked sibling from redistribution"
**Expected**: B stays at 40%, C adjusts to 10%, sum=100
**Status**: PASS

### TC-004-03: Auto-Balance Cascading Clamp (All Siblings Locked)
**Priority**: Critical
**Type**: Unit
**AC**: Auto-Balance AC #3 -- all siblings except changed one locked, clamp to max available
**Test File**: `calculations.test.ts` > `autoBalance` > "clamps changed value when all but changed are locked"
**Expected**: A clamped to 30 (100 - 40 - 30), sum=100
**Status**: PASS

### TC-004-04: Auto-Balance Equal Distribution (Zero Unlocked)
**Priority**: High
**Type**: Unit
**AC**: Auto-Balance AC #4 -- unlocked siblings all at 0%, user decreases a sibling
**Test File**: `calculations.test.ts` > `autoBalance` > "distributes equally when unlocked siblings are all at 0%"
**Expected**: Freed percentage split equally among 0% unlocked siblings
**Status**: PASS

### TC-004-05: Auto-Balance largestRemainder Rounding
**Priority**: Critical
**Type**: Unit
**AC**: Auto-Balance AC #5 -- largestRemainder applied for exact 100.0 sum
**Test File**: `calculations.test.ts` > `autoBalance` > "produces percentages summing to exactly 100.0 (largestRemainder)"
**Expected**: Sum is exactly 100 (not 99.9 or 100.1)
**Status**: PASS

### TC-004-06: Free Mode Independence
**Priority**: Critical
**Type**: Unit
**AC**: Free Mode AC #1 -- only changed node updates, no siblings affected
**Test File**: `useTreeState.test.ts` > `SET_PERCENTAGE` > "only changes target node in free mode"
**Expected**: Target changes to 50%, B stays at 40%, C stays at 30%
**Status**: PASS

### TC-004-07: Free Mode Deviation Exposure
**Priority**: High
**Type**: Unit
**AC**: Free Mode AC #2 -- state exposes deviation from 100%
**Test File**: `calculations.test.ts` > `getSiblingDeviation` > "returns positive deviation when over 100"
**Expected**: Deviation of +15 when children sum to 115
**Status**: PASS

### TC-004-08: Mode Switch Free-to-Auto Normalization
**Priority**: Critical
**Type**: Unit
**AC**: Mode Switching AC #1 -- percentages normalized proportionally to 100%
**Test File**: `useTreeState.test.ts` > `SET_BALANCE_MODE` > "free to auto: normalizes percentages to 100"
**Expected**: Sum of children percentages = 100 after switching to auto
**Status**: PASS

### TC-004-09: Mode Switch Auto-to-Free No-Change
**Priority**: High
**Type**: Unit
**AC**: Mode Switching AC #2 -- no values change when switching to free
**Test File**: `useTreeState.test.ts` > `SET_BALANCE_MODE` > "auto to free: mode changes, values unchanged"
**Expected**: All percentages remain identical, only balanceMode changes
**Status**: PASS

### TC-004-10: Cascading Recalculation on Gender Change
**Priority**: Critical
**Type**: Unit
**AC**: Cascading Recalculation AC #1 -- gender node percentage change cascades through all descendants
**Test File**: `useTreeState.test.ts` > `cascading recalculation` > "recalculates all descendant absolute values when gender percentage changes"
**Expected**: Male=60%, Female=40%, absolute values recalculated from root through all children
**Status**: PASS

### TC-004-11: Total Population Change
**Priority**: Critical
**Type**: Unit
**AC**: Cascading Recalculation AC #2 -- total population change recalculates all absolute values
**Test File**: `useTreeState.test.ts` > `SET_TOTAL_POPULATION` > "updates totalPopulation and recalculates absolute values"
**Expected**: Root=2000, A=600 (30%), B=800 (40%), percentages unchanged
**Status**: PASS

### TC-004-12: Lock Toggle On
**Priority**: High
**Type**: Unit
**AC**: Lock/Unlock AC #1 -- unlocked node becomes locked
**Test File**: `useTreeState.test.ts` > `TOGGLE_LOCK` > "toggles isLocked from false to true"
**Expected**: isLocked becomes true
**Status**: PASS

### TC-004-13: Lock Toggle Off
**Priority**: High
**Type**: Unit
**AC**: Lock/Unlock AC #2 -- locked node becomes unlocked
**Test File**: `useTreeState.test.ts` > `TOGGLE_LOCK` > "toggles isLocked from true to false"
**Expected**: isLocked becomes false
**Status**: PASS

### TC-004-14: Lock Guard (Prevent Last Lock)
**Priority**: Critical
**Type**: Unit
**AC**: Lock guard -- resolved Q2: prevent locking last unlocked sibling
**Test File**: `useTreeState.test.ts` > `TOGGLE_LOCK` > "prevents locking the last unlocked sibling (lock guard)"
**Expected**: Locking the last unlocked sibling is a no-op (same state reference)
**Status**: PASS

### TC-004-15: Reset to Default State
**Priority**: Critical
**Type**: Unit
**AC**: Reset AC -- tree returns to defaultTree state
**Test File**: `useTreeState.test.ts` > `RESET` > "restores to initial state after modifications"
**Expected**: State equals initialState (defaultTree, auto mode, 13.5M population)
**Status**: PASS

### TC-004-16: Performance Under 16ms
**Priority**: Critical
**Type**: Unit
**AC**: Performance AC -- state update < 16ms for 55-node tree
**Test File**: `useTreeState.test.ts` > `performance` > "processes SET_PERCENTAGE on full 55-node tree in under 16ms"
**Expected**: Average dispatch time < 16ms over 100 iterations
**Status**: PASS

### TC-004-17: Locked Target Node No-Op
**Priority**: High
**Type**: Unit
**AC**: Implicit from Lock/Unlock behavior -- SET_PERCENTAGE on locked node should be no-op
**Test File**: `useTreeState.test.ts` > `SET_PERCENTAGE` > "is no-op when target node is locked"
**Expected**: State reference unchanged
**Status**: PASS

### TC-004-18: Root Node SET_PERCENTAGE No-Op
**Priority**: Medium
**Type**: Unit
**AC**: Implicit from design -- root percentage is always 100%
**Test File**: `useTreeState.test.ts` > `SET_PERCENTAGE` > "is no-op when nodeId is root"
**Expected**: State reference unchanged
**Status**: PASS

### TC-004-19: Free Mode Value Clamping
**Priority**: High
**Type**: Unit
**AC**: Implicit from design -- free mode clamps to [0, 100]
**Test File**: `useTreeState.test.ts` > `SET_PERCENTAGE` > "clamps value in free mode to [0, 100]"
**Expected**: 150 -> 100, -10 -> 0
**Status**: PASS

### TC-004-20: Initial State Structure
**Priority**: High
**Type**: Unit
**AC**: Testing AC -- verify initial state matches expected defaults
**Test File**: `useTreeState.test.ts` > `initialState` > "matches defaultTree structure"
**Expected**: totalPopulation=13,500,000, balanceMode='auto', tree===defaultTree
**Status**: PASS

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Type | Priority | Status |
|---------------------|--------------|------|----------|--------|
| Auto-Balance: proportional redistribution | TC-004-01 | Unit | Critical | PASS |
| Auto-Balance: locked node exclusion | TC-004-02 | Unit | Critical | PASS |
| Auto-Balance: cascading clamp (all locked) | TC-004-03 | Unit | Critical | PASS |
| Auto-Balance: zero unlocked equal dist. | TC-004-04 | Unit | High | PASS |
| Auto-Balance: largestRemainder rounding | TC-004-05 | Unit | Critical | PASS |
| Free Mode: independence | TC-004-06 | Unit | Critical | PASS |
| Free Mode: deviation exposure | TC-004-07 | Unit | High | PASS |
| Mode Switch: free-to-auto normalization | TC-004-08 | Unit | Critical | PASS |
| Mode Switch: auto-to-free no-change | TC-004-09 | Unit | High | PASS |
| Cascading: gender change descendants | TC-004-10 | Unit | Critical | PASS |
| Cascading: total population change | TC-004-11 | Unit | Critical | PASS |
| Lock/Unlock: toggle on | TC-004-12 | Unit | High | PASS |
| Lock/Unlock: toggle off | TC-004-13 | Unit | High | PASS |
| Lock Guard: prevent last lock | TC-004-14 | Unit | Critical | PASS |
| Reset: restore defaults | TC-004-15 | Unit | Critical | PASS |
| Performance: < 16ms | TC-004-16 | Unit | Critical | PASS |
| Locked target no-op | TC-004-17 | Unit | High | PASS |
| Root SET_PERCENTAGE no-op | TC-004-18 | Unit | Medium | PASS |
| Free mode value clamping | TC-004-19 | Unit | High | PASS |
| Initial state structure | TC-004-20 | Unit | High | PASS |

---

## Automated Test Results

**Verification Date**: 2026-02-17

### Test Execution
```
Test Files  6 passed (6)
     Tests  107 passed (107)
  Duration  340ms (transform 191ms, setup 0ms, collect 326ms, tests 37ms)
```

| Test File | Tests | Status |
|-----------|-------|--------|
| `__tests__/utils/treeUtils.test.ts` | 15 passed | PASS |
| `__tests__/utils/calculations.test.ts` | 28 passed | PASS |
| `__tests__/hooks/useTreeState.test.ts` | 19 passed | PASS |
| (existing) `__tests__/types/tree.test.ts` | 11 passed | PASS |
| (existing) `__tests__/data/defaultTree.test.ts` | 26 passed | PASS |
| (existing) `__tests__/data/dataHelpers.test.ts` | 8 passed | PASS |

**New tests**: 62 (15 + 28 + 19)
**Existing tests**: 45 (11 + 26 + 8) -- all still passing (no regressions)
**Total**: 107

### Build Verification
- `pnpm lint`: 0 errors, 0 warnings
- `pnpm test`: 107 tests passed, 0 failed
- `pnpm build`: Successful (`tsc --noEmit && vite build`, 29 modules, 454ms)

---

## Code Quality Verification Checklist

| Check | Result | Notes |
|-------|--------|-------|
| No `any` types | PASS | Grep across all new files returns no matches |
| All new files use `.ts` extension | PASS | No `.tsx` files in utils/, hooks/, or new __tests__/ files |
| JSDoc on all exported functions | PASS | All 10 exported functions have full JSDoc with @param/@returns |
| JSDoc on all interfaces | PASS | SiblingInfo, PercentageUpdate, TreeAction all have JSDoc |
| Named exports only (no default) | PASS | Grep for `export default` returns no matches in new files |
| Immutable tree updates | PASS | All update functions return new objects via spread operator |
| `largestRemainder` used for rounding | PASS | Used in `autoBalance()` and `normalizeGroup()` -- the only two functions that compute new percentages |
| `SiblingInfo` co-located with `collectSiblingInfo` | PASS | Both defined in `treeUtils.ts` per plan |
| `PercentageUpdate` co-located with `autoBalance` | PASS | Both defined in `calculations.ts` per plan |
| Barrel exports use `export type` for type-only | PASS | `utils/index.ts` uses `export type { SiblingInfo }` and `export type { PercentageUpdate }` |
| Exhaustive switch in reducer | PASS | All 5 action types handled, TypeScript ensures exhaustiveness |
| `treeReducer` exported as named function | PASS | Enables direct testing without React rendering |
| `initialState` exported for test assertions | PASS | Used in `useTreeState.test.ts` for RESET and initial state checks |
| No React rendering in tests | PASS | All tests call `treeReducer` directly; no `renderHook` |
| Test fixtures use small trees for speed | PASS | 5-node test tree in treeUtils, 3-child test state in useTreeState |
| Full defaultTree used for integration-level tests | PASS | Cascading recalculation and performance tests use `initialState` |

---

## Regression Impact Analysis

### Affected Areas
- `types/index.ts` -- MODIFIED to add `TreeAction` export. Verified: existing type exports unchanged.
- `data/` module -- UNCHANGED but consumed by new code via `largestRemainder` and `defaultTree` imports.

### Regression Tests Run
All 45 existing tests pass without modification:
- `types/tree.test.ts`: 11 tests -- type safety assertions unchanged
- `data/defaultTree.test.ts`: 26 tests -- default data integrity unchanged
- `data/dataHelpers.test.ts`: 8 tests -- largestRemainder function unchanged

### Regression Risk
**Low**. The only modified existing file is `types/index.ts` (added one export line). All new code is in new files with no side effects. Existing tests all pass.

---

## Acceptance Criteria Cross-Check

### Auto-Balance Mode
| AC | Implementation | Test Coverage | Verdict |
|----|---------------|---------------|---------|
| Proportional redistribution | `autoBalance()` in calculations.ts, lines 31-72 | 9 test cases in calculations.test.ts (proportional, complement, to-0%, to-100%, largestRemainder) | PASS |
| Locked sibling exclusion | `autoBalance()` filters locked siblings, lines 36-37 | 2 test cases (locked excluded, single unlocked absorbs all) | PASS |
| Cascading clamp | `autoBalance()` clamps to `[0, 100 - lockedSum]`, line 41 | 1 test case (all but changed locked) | PASS |
| Equal distribution at 0% | `autoBalance()` fallback when `oldUnlockedSum === 0`, lines 50-53 | 1 test case (distributes equally) | PASS |
| largestRemainder applied | `autoBalance()` calls `largestRemainder(allRaw, 100, 1)`, line 70 | 1 dedicated test case verifying exact 100.0 sum | PASS |

### Free Mode
| AC | Implementation | Test Coverage | Verdict |
|----|---------------|---------------|---------|
| Independent slider | `SET_PERCENTAGE` free branch in reducer, lines 125-129 | 1 test case in useTreeState.test.ts | PASS |
| Deviation exposure | `getSiblingDeviation()` in calculations.ts, lines 127-131 | 5 test cases (balanced, over, under, no children, rounding) | PASS |

### Mode Switching
| AC | Implementation | Test Coverage | Verdict |
|----|---------------|---------------|---------|
| Free-to-auto normalization | `normalizeTree()` + `normalizeGroup()` in reducer, lines 37-49, 167-171 | 1 integration test in useTreeState + 5 unit tests for normalizeGroup | PASS |
| Auto-to-free no change | Reducer returns `{ ...state, balanceMode: mode }`, line 175 | 1 test case verifying values unchanged | PASS |

### Cascading Recalculation
| AC | Implementation | Test Coverage | Verdict |
|----|---------------|---------------|---------|
| Gender change cascades | `recalcTreeFromRoot()` + `recalcAbsoluteValues()` called after every SET_PERCENTAGE | 1 test on full defaultTree with gender-male | PASS |
| Total population change | `SET_TOTAL_POPULATION` handler, lines 178-182 | 2 test cases (values recalculate, percentages preserved) | PASS |

### Lock/Unlock
| AC | Implementation | Test Coverage | Verdict |
|----|---------------|---------------|---------|
| Lock toggle on/off | `TOGGLE_LOCK` handler, lines 138-159 | 2 test cases (on and off) | PASS |
| Lock guard (prevent last) | `canToggleLock()` in calculations.ts + guard in reducer, lines 148-150 | 5 unit tests for canToggleLock + 1 integration test in reducer | PASS |

### Reset
| AC | Implementation | Test Coverage | Verdict |
|----|---------------|---------------|---------|
| Restore defaults | `RESET` returns `initialState`, lines 184-186 | 1 test case verifying exact reference equality with initialState | PASS |

### Performance
| AC | Implementation | Test Coverage | Verdict |
|----|---------------|---------------|---------|
| < 16ms per dispatch | N/A (inherent in algorithm -- O(N) for 55 nodes) | 1 test averaging 100 iterations on full tree | PASS |

### Testing
| AC | Implementation | Test Coverage | Verdict |
|----|---------------|---------------|---------|
| Comprehensive unit test coverage | 3 new test files with 62 total test cases | Covers all specified scenarios: auto-balance, locking, edge cases, free mode, mode switching, cascading, reset | PASS |

---

## Issues Found

| # | Severity | Description | Impact |
|---|----------|-------------|--------|
| -- | -- | No issues found | -- |

---

## Definition of Done Checklist

- [x] All test cases pass (107/107, including 62 new)
- [x] No critical bugs open
- [x] Regression suite passes (45 existing tests unchanged)
- [x] Code coverage meets expectations (62 tests across 3 files covering all exported functions)
- [x] Performance within acceptable range (< 16ms verified)
- [x] No `any` types used
- [x] All files use `.ts` extension (no `.tsx`)
- [x] JSDoc on all exported functions and interfaces
- [x] Named exports only
- [x] Immutable tree updates verified
- [x] `largestRemainder` used for all percentage rounding
- [x] Lint passes with 0 errors
- [x] Build succeeds with `tsc --noEmit && vite build`
- [x] Implementation matches plan.md specification

---

## Verdict

**APPROVED**

All 20 test cases mapped to acceptance criteria pass. All 107 tests (62 new + 45 existing) pass. Build and lint are clean. Code quality standards are met across all dimensions. No issues found. The implementation faithfully follows the plan.md specification and satisfies all PO acceptance criteria.
