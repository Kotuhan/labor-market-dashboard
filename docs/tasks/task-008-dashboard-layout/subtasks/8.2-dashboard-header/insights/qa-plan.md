# QA Plan: Subtask 8.2 -- DashboardHeader Component

Generated: 2026-02-17
Verified By: QA Agent

## Test Scope

Verification of the DashboardHeader component (subtask 8.2 of task-008), including:
- The `DashboardHeader` component (`src/components/DashboardHeader.tsx`)
- The `formatPopulation` utility function (`src/utils/format.ts`)
- Barrel exports in `components/index.ts` and `utils/index.ts`
- Associated test files for both component and utility

## Test Cases

#### TC-8.2-001: Header bar renders all required elements
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader component rendered with default props

**Steps**:
1. Render DashboardHeader with totalPopulation=13500000, balanceMode='auto', dispatch=mock

**Expected Result**:
- Application title "Зайняте населення" is visible
- Population input shows "13 500 000"
- ModeToggle (switch role) is present
- ResetButton is present

**Status**: PASS
**Notes**: Verified via tests: "renders application title as h1", "renders population input with formatted default value", "renders ModeToggle", "renders ResetButton"

---

#### TC-8.2-002: Valid population input dispatches SET_TOTAL_POPULATION
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered with mock dispatch

**Steps**:
1. Clear the population input
2. Type "10000000"
3. Blur the input (tab away)

**Expected Result**:
- `dispatch` called with `{ type: 'SET_TOTAL_POPULATION', value: 10000000 }`

**Status**: PASS
**Notes**: Verified via test "dispatches SET_TOTAL_POPULATION on valid input blur"

---

#### TC-8.2-003: Enter key commits population input
**Priority**: High
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered with mock dispatch

**Steps**:
1. Clear the population input
2. Type "5000000"
3. Press Enter

**Expected Result**:
- `dispatch` called with `{ type: 'SET_TOTAL_POPULATION', value: 5000000 }`
- Dispatch called exactly once (no double-dispatch from Enter+blur)

**Status**: PASS
**Notes**: Verified via tests "dispatches SET_TOTAL_POPULATION on Enter key" and "dispatches exactly once per commit"

---

#### TC-8.2-004: Non-numeric input reverts to previous value
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered with totalPopulation=13500000

**Steps**:
1. Clear the population input
2. Type "abc"
3. Blur the input

**Expected Result**:
- No SET_TOTAL_POPULATION dispatched
- Input reverts to "13 500 000"

**Status**: PASS
**Notes**: Verified via test "reverts on non-numeric input"

---

#### TC-8.2-005: Negative input reverts to previous value
**Priority**: High
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered with totalPopulation=13500000

**Steps**:
1. Clear the population input
2. Type "-100"
3. Blur the input

**Expected Result**:
- No SET_TOTAL_POPULATION dispatched
- Input reverts to "13 500 000"

**Status**: PASS
**Notes**: Verified via test "reverts on negative input"

---

#### TC-8.2-006: Empty input reverts to previous value
**Priority**: High
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered with totalPopulation=13500000

**Steps**:
1. Clear the population input
2. Blur immediately (empty field)

**Expected Result**:
- No SET_TOTAL_POPULATION dispatched
- Input reverts to "13 500 000"

**Status**: PASS
**Notes**: Verified via test "reverts on empty input"

---

#### TC-8.2-007: Population input has accessible label
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered

**Steps**:
1. Query for input by label text "Загальна кількість зайнятих"

**Expected Result**:
- Input element found and present in document

**Status**: PASS
**Notes**: Verified via test "population input has aria-label"

---

#### TC-8.2-008: Population input meets 44px touch target
**Priority**: High
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered

**Steps**:
1. Check input element className

**Expected Result**:
- Input has `h-11` class (44px height)

**Status**: PASS
**Notes**: Verified via test "population input has h-11 class for 44px touch target"

---

#### TC-8.2-009: Title rendered as h1 (WCAG 1.3.1 / Arch-review condition 1)
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered

**Steps**:
1. Query heading at level 1
2. Verify text content and tag name

**Expected Result**:
- `<h1>` element with text "Зайняте населення"

**Status**: PASS
**Notes**: Verified via tests "renders application title as h1" and "title is the first heading on the page" (asserts `tagName === 'H1'`)

---

#### TC-8.2-010: Barrel exports with value + type (Arch-review condition 2)
**Priority**: Critical
**Type**: Static analysis

**Preconditions**:
- Check `components/index.ts`

**Steps**:
1. Verify `export { DashboardHeader } from './DashboardHeader'` exists
2. Verify `export type { DashboardHeaderProps } from './DashboardHeader'` exists

**Expected Result**:
- Both value and type exports present

**Status**: PASS
**Notes**: Verified by reading `components/index.ts` -- lines 7-8 contain both exports

---

#### TC-8.2-011: Prop sync from external changes
**Priority**: High
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered with totalPopulation=13500000

**Steps**:
1. Re-render with totalPopulation=10000000

**Expected Result**:
- Input updates to "10 000 000"

**Status**: PASS
**Notes**: Verified via test "updates displayed value when totalPopulation prop changes"

---

#### TC-8.2-012: Space-separated input accepted
**Priority**: Medium
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered

**Steps**:
1. Clear input
2. Type "10 000 000" (with spaces)
3. Blur

**Expected Result**:
- `dispatch` called with `{ type: 'SET_TOTAL_POPULATION', value: 10000000 }`

**Status**: PASS
**Notes**: Verified via test "accepts space-separated input (strips spaces before parsing)"

---

#### TC-8.2-013: Header renders as semantic header element
**Priority**: Medium
**Type**: Unit (automated)

**Preconditions**:
- DashboardHeader rendered

**Steps**:
1. Query for banner role

**Expected Result**:
- Element with banner role present

**Status**: PASS
**Notes**: Verified via test "renders as a header element"

---

#### TC-8.2-014: formatPopulation utility function
**Priority**: High
**Type**: Unit (automated)

**Preconditions**:
- Import formatPopulation from utils

**Steps**:
1. Test various inputs: millions, thousands, sub-1000, zero, decimals

**Expected Result**:
- `formatPopulation(13_500_000)` returns "13 500 000"
- `formatPopulation(1_194_329)` returns "1 194 329"
- `formatPopulation(50_000)` returns "50 000"
- `formatPopulation(500)` returns "500"
- `formatPopulation(0)` returns "0"
- `formatPopulation(13_500_000.7)` returns "13 500 001"

**Status**: PASS
**Notes**: Verified via 6 tests in `format.test.ts` formatPopulation describe block

---

#### TC-8.2-015: formatPopulation barrel export in utils/index.ts
**Priority**: Medium
**Type**: Static analysis

**Steps**:
1. Verify `formatPopulation` is exported from utils barrel

**Expected Result**:
- `formatPopulation` included in the format.ts export line

**Status**: PASS
**Notes**: Verified by reading `utils/index.ts` line 19: `export { formatAbsoluteValue, formatPercentage, formatPopulation } from './format';`

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Type | Priority | Status |
|---------------------|--------------|------|----------|--------|
| AC-1: Header displays title, input, toggle, reset | TC-8.2-001 | Unit | Critical | PASS |
| AC-2: Valid number dispatches SET_TOTAL_POPULATION | TC-8.2-002, TC-8.2-003, TC-8.2-012 | Unit | Critical | PASS |
| AC-3: Non-numeric reverts to previous value | TC-8.2-004, TC-8.2-005, TC-8.2-006 | Unit | Critical | PASS |
| AC-4: Screen reader accessible label | TC-8.2-007 | Unit | Critical | PASS |
| AC-5: 44x44px touch target | TC-8.2-008 | Unit | High | PASS |
| Arch condition 1: Title as h1 | TC-8.2-009 | Unit | Critical | PASS |
| Arch condition 2: Barrel value + type exports | TC-8.2-010 | Static | Critical | PASS |

## Code Quality Checklist

- [x] No `any` types in DashboardHeader.tsx -- all types properly annotated
- [x] Named exports only (no default exports)
- [x] Component under 200 lines (109 lines)
- [x] JSDoc on DashboardHeaderProps interface and all fields
- [x] JSDoc on DashboardHeader function
- [x] JSDoc on formatPopulation function with @example tags
- [x] Import ordering follows convention: React first, @/ aliases second (blank line), relative third
- [x] Controlled input pattern matches Slider (local string state, isEditing flag, useEffect sync, commit on blur/Enter)
- [x] No useCallback (no memoized children that would benefit)
- [x] No internal percentage state -- dispatch actions upward
- [x] afterEach(cleanup) in test file
- [x] makeProps() factory pattern in test file
- [x] vi.fn with Vitest v3 function signature syntax
- [x] Test section separators with comment blocks

## Automated Test Results

**Lint**: 0 errors (PASS)
**Build**: tsc --noEmit + vite build successful (PASS)
**Tests**: 273 passed, 0 failed across 18 test files (PASS)

### Relevant Test Files
| Test File | Tests | Status |
|-----------|-------|--------|
| DashboardHeader.test.tsx | 16 passed | PASS |
| format.test.ts | 19 passed (includes 6 formatPopulation) | PASS |

### Test Case Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-8.2-001 | PASS | 4 rendering tests cover all elements |
| TC-8.2-002 | PASS | Blur dispatch verified |
| TC-8.2-003 | PASS | Enter key dispatch + single-dispatch verified |
| TC-8.2-004 | PASS | Non-numeric revert verified |
| TC-8.2-005 | PASS | Negative revert verified |
| TC-8.2-006 | PASS | Empty revert verified |
| TC-8.2-007 | PASS | aria-label verified |
| TC-8.2-008 | PASS | h-11 class verified |
| TC-8.2-009 | PASS | h1 element + tagName assertion |
| TC-8.2-010 | PASS | Both value and type exports present |
| TC-8.2-011 | PASS | Rerender prop sync verified |
| TC-8.2-012 | PASS | Space-separated input parsing verified |
| TC-8.2-013 | PASS | Semantic header element verified |
| TC-8.2-014 | PASS | All 6 formatPopulation tests pass |
| TC-8.2-015 | PASS | Barrel export confirmed |

## Issues Found

No issues found.

## Regression Impact Analysis

- **format.ts**: New `formatPopulation` function added. Existing `formatAbsoluteValue` and `formatPercentage` unchanged (verified by 13 pre-existing tests still passing).
- **utils/index.ts**: Added `formatPopulation` to barrel export. No existing exports removed or changed.
- **components/index.ts**: Added DashboardHeader exports. No existing exports removed or changed.
- **No existing component modified**: DashboardHeader is a new file. ModeToggle and ResetButton are composed but not modified.

## Verdict

**APPROVED**

All 5 acceptance criteria are met. Both arch-review conditions are satisfied. Lint, tests, and build all pass. Code follows all established patterns (controlled input, barrel exports, JSDoc, import ordering, naming conventions). The component is 109 lines (well under 200-line limit). 16 DashboardHeader tests and 6 formatPopulation tests provide thorough coverage of rendering, valid input, invalid input, prop sync, and accessibility.
