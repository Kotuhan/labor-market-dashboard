# QA Plan: Subtask 8.1 -- ModeToggle + ResetButton
Generated: 2026-02-17

## Test Scope

Verify two new leaf components (ModeToggle and ResetButton) and their barrel exports in `components/index.ts`. These are independent building blocks with no dependencies on other new components. Covers TL design Steps 1 and 2.

## Test Cases

### ModeToggle

#### TC-8.1-01: Auto-to-free mode dispatch
**Priority**: Critical
**Type**: Unit

**Preconditions**:
- ModeToggle rendered with `balanceMode: 'auto'`

**Steps**:
1. Click the toggle switch

**Expected Result**:
- `dispatch` called with `{ type: 'SET_BALANCE_MODE', mode: 'free' }`
- Called exactly once

**Actual Result**: dispatch called with correct payload, exactly once
**Status**: Pass

---

#### TC-8.1-02: Free-to-auto mode dispatch
**Priority**: Critical
**Type**: Unit

**Preconditions**:
- ModeToggle rendered with `balanceMode: 'free'`

**Steps**:
1. Click the toggle switch

**Expected Result**:
- `dispatch` called with `{ type: 'SET_BALANCE_MODE', mode: 'auto' }`

**Actual Result**: dispatch called with correct payload
**Status**: Pass

---

#### TC-8.1-03: Mode indicator updates -- auto mode active label
**Priority**: High
**Type**: Unit

**Preconditions**:
- ModeToggle rendered with `balanceMode: 'auto'`

**Steps**:
1. Inspect label styling

**Expected Result**:
- "Avto" label has `text-blue-600` (active)
- "Vilnyi" label has `text-slate-400` (dimmed)

**Actual Result**: Labels styled correctly per mode
**Status**: Pass

---

#### TC-8.1-04: Mode indicator updates -- free mode active label
**Priority**: High
**Type**: Unit

**Preconditions**:
- ModeToggle rendered with `balanceMode: 'free'`

**Steps**:
1. Inspect label styling

**Expected Result**:
- "Vilnyi" label has `text-blue-600` (active)
- "Avto" label has `text-slate-400` (dimmed)

**Actual Result**: Labels styled correctly per mode
**Status**: Pass

---

#### TC-8.1-05: Screen reader accessibility -- role and aria-checked
**Priority**: High
**Type**: Unit

**Preconditions**:
- ModeToggle rendered

**Steps**:
1. Query element by role="switch"
2. Check aria-checked in auto mode
3. Check aria-checked in free mode
4. Check aria-label

**Expected Result**:
- Element has `role="switch"`
- `aria-checked="true"` when auto, `"false"` when free
- `aria-label="Balance mode"`

**Actual Result**: All aria attributes correct
**Status**: Pass

---

#### TC-8.1-06: Touch target minimum size
**Priority**: Medium
**Type**: Unit

**Preconditions**:
- ModeToggle rendered

**Steps**:
1. Inspect button className

**Expected Result**:
- Contains `h-11` class (44px height)

**Actual Result**: h-11 class present
**Status**: Pass

---

### ResetButton

#### TC-8.1-07: Confirm dialog appears on click
**Priority**: Critical
**Type**: Unit

**Preconditions**:
- ResetButton rendered
- `window.confirm` spied on

**Steps**:
1. Click the reset button

**Expected Result**:
- `window.confirm` called exactly once

**Actual Result**: confirm called once
**Status**: Pass

---

#### TC-8.1-08: RESET dispatched on user confirmation
**Priority**: Critical
**Type**: Unit

**Preconditions**:
- ResetButton rendered
- `window.confirm` mocked to return `true`

**Steps**:
1. Click the reset button

**Expected Result**:
- `dispatch` called with `{ type: 'RESET' }`
- Called exactly once

**Actual Result**: dispatch called with correct payload, once
**Status**: Pass

---

#### TC-8.1-09: No dispatch on user cancellation
**Priority**: Critical
**Type**: Unit

**Preconditions**:
- ResetButton rendered
- `window.confirm` mocked to return `false`

**Steps**:
1. Click the reset button

**Expected Result**:
- `dispatch` NOT called

**Actual Result**: dispatch not called
**Status**: Pass

---

#### TC-8.1-10: Touch target minimum size
**Priority**: Medium
**Type**: Unit

**Preconditions**:
- ResetButton rendered

**Steps**:
1. Inspect button className

**Expected Result**:
- Contains `h-11` class (44px height)

**Actual Result**: h-11 class present
**Status**: Pass

---

#### TC-8.1-11: Keyboard accessibility
**Priority**: High
**Type**: Unit

**Preconditions**:
- ResetButton rendered

**Steps**:
1. Tab to focus button
2. Press Enter

**Expected Result**:
- Button receives focus after tab
- Keyboard activation triggers confirm dialog and dispatches on confirmation

**Actual Result**: Focus and keyboard activation work correctly
**Status**: Pass

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Automated Test(s) | Status |
|---------------------|--------------|-------------------|--------|
| ModeToggle: auto -> dispatches SET_BALANCE_MODE free | TC-8.1-01 | ModeToggle interaction: test 1 | Pass |
| ModeToggle: free -> dispatches SET_BALANCE_MODE auto | TC-8.1-02 | ModeToggle interaction: test 2 | Pass |
| ModeToggle: indicator updates on mode change | TC-8.1-03, TC-8.1-04 | ModeToggle rendering: tests 2-5 | Pass |
| ModeToggle: screen reader aria attributes | TC-8.1-05 | ModeToggle accessibility: tests 1-4 | Pass |
| ModeToggle: 44x44px minimum touch target | TC-8.1-06 | ModeToggle accessibility: test 5 | Pass |
| ResetButton: confirm dialog appears | TC-8.1-07 | ResetButton confirm dialog: test 1 | Pass |
| ResetButton: confirmed -> RESET dispatched | TC-8.1-08 | ResetButton confirm dialog: test 2 | Pass |
| ResetButton: cancelled -> no dispatch | TC-8.1-09 | ResetButton confirm dialog: test 3 | Pass |
| ResetButton: 44x44px minimum touch target | TC-8.1-10 | ResetButton accessibility: test 4 | Pass |

## Code Quality Verification Checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| No `any` types | Pass | grep found 0 matches in both components |
| Named exports only (no default exports) | Pass | grep found 0 `export default` in both components |
| Components under 200 lines | Pass | ModeToggle: 59 lines, ResetButton: 51 lines |
| JSDoc on props interfaces | Pass | Both have `/** Props for the Xxx component. */` + field-level docs |
| JSDoc on component functions | Pass | Both have multi-line JSDoc describing purpose and patterns |
| Barrel exports: value + type | Pass | `index.ts` has `export { ModeToggle }` + `export type { ModeToggleProps }` and `export { ResetButton }` + `export type { ResetButtonProps }` |
| Arch-review condition #2 satisfied | Pass | Both components added to barrel with value + type exports |
| Controlled component pattern | Pass | No internal business state; receive props, dispatch upward |
| Import ordering (external, @/, relative) | Pass | Both use `import type { ... } from '@/types'` only |
| Vitest v3 mock syntax | Pass | Tests use `vi.fn<(action: TreeAction) => void>()` |
| Test makeProps factory pattern | Pass | Both test files use `makeProps()` with `Partial<Props>` |
| afterEach(cleanup) | Pass | Both test files have explicit cleanup |
| userEvent.setup() for interactions | Pass | All interaction tests use `userEvent.setup()` |
| Touch targets h-11 class | Pass | Both components use `h-11` on button element |
| Ukrainian labels | Pass | ModeToggle: "Avto"/"Vilnyi"; ResetButton: "Skynuty" |

## Automated Test Results

**Verification Date**: 2026-02-17
**Verified By**: QA Agent

### Build Pipeline

| Command | Status | Details |
|---------|--------|---------|
| `pnpm lint` | Pass | 0 errors, 0 warnings |
| `pnpm test` | Pass | 244 tests passed across 17 test files (0 failures) |
| `pnpm build` | Pass | TypeScript type-check + Vite production build succeeded |

### New Test Files

| Test File | Tests | Status |
|-----------|-------|--------|
| `ModeToggle.test.tsx` | 13 tests (3 describe blocks) | All pass |
| `ResetButton.test.tsx` | 9 tests (3 describe blocks) | All pass |

### Test Case Results

| Test Case | Status | Verification Method |
|-----------|--------|---------------------|
| TC-8.1-01 | Pass | ModeToggle interaction: dispatches SET_BALANCE_MODE "free" when auto |
| TC-8.1-02 | Pass | ModeToggle interaction: dispatches SET_BALANCE_MODE "auto" when free |
| TC-8.1-03 | Pass | ModeToggle rendering: highlights "Avto" label when in auto mode |
| TC-8.1-04 | Pass | ModeToggle rendering: highlights "Vilnyi" label when in free mode |
| TC-8.1-05 | Pass | ModeToggle accessibility: role, aria-checked, aria-label tests |
| TC-8.1-06 | Pass | ModeToggle accessibility: h-11 class test |
| TC-8.1-07 | Pass | ResetButton confirm dialog: calls window.confirm on click |
| TC-8.1-08 | Pass | ResetButton confirm dialog: dispatches RESET when confirmed |
| TC-8.1-09 | Pass | ResetButton confirm dialog: does NOT dispatch when cancelled |
| TC-8.1-10 | Pass | ResetButton accessibility: h-11 class test |
| TC-8.1-11 | Pass | ResetButton accessibility: focusable + keyboard Enter activation |

## Regression Impact Analysis

**Affected areas**: Minimal. These are new leaf components with no modifications to existing components.

**Modified file**: `components/index.ts` -- new exports added. Existing exports unchanged, so no regression risk.

**Existing tests**: All 222 pre-existing tests continue to pass (244 total - 22 new = 222 existing).

## Issues Found

None.

## Verdict

**APPROVED**

All acceptance criteria from subtask 8.1 are met. Both components follow established patterns (controlled components, named exports, JSDoc, barrel conventions). Arch-review condition #2 (barrel exports with value + type) is satisfied. No `any` types, no default exports, components well under 200 lines. All 244 tests pass. Lint clean. Build succeeds.
