# QA Plan: Subtask 8.3 -- TreePanel Refactor + Deviation Warnings

Generated: 2026-02-17

## Test Scope

Verification of TreePanel API refactor (from `tree: TreeNode` to `genderNode: TreeNode`) and addition of inline deviation warnings in both TreePanel (gender-level) and TreeRow (subcategory-level) for free mode.

## Test Cases

### TreePanel Refactor

#### TC-8.3-001: TreePanel renders single gender node with h2 heading
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**: TreePanel receives a single gender node (not root)

**Steps**:
1. Render TreePanel with `genderNode` containing label "Choloviky"

**Expected Result**: An `<h2>` heading with the gender label is rendered

**Status**: PASS -- Verified via `TreePanel gender heading > renders the gender label as h2`

---

#### TC-8.3-002: TreePanel renders gender percentage and absolute value
**Priority**: High
**Type**: Unit (automated)

**Preconditions**: TreePanel receives a gender node with percentage 60 and absoluteValue 6,000,000

**Steps**:
1. Render TreePanel with test gender node
2. Query for percentage text "60.0%" and absolute value "6 000 tys."

**Expected Result**: Both percentage and absolute value are visible in the section header

**Status**: PASS -- Verified via `TreePanel gender heading > renders gender percentage in section header` and `renders gender absolute value in section header`

---

#### TC-8.3-003: TreePanel does not render collapse control on gender node
**Priority**: High
**Type**: Unit (automated)

**Steps**:
1. Render TreePanel with a gender node
2. Query for expand/collapse buttons referencing the gender label

**Expected Result**: No expand/collapse button exists for the gender node itself

**Status**: PASS -- Verified via `TreePanel gender heading > does not render collapse control on gender node`

---

#### TC-8.3-004: TreePanel renders all industry nodes
**Priority**: Critical
**Type**: Unit (automated)

**Steps**:
1. Render TreePanel with a gender node having 2 industry children

**Expected Result**: Both industry labels are visible

**Status**: PASS -- Verified via `TreePanel industry nodes > shows all industry nodes on initial render`

---

#### TC-8.3-005: TreePanel expand/collapse functionality preserved
**Priority**: Critical
**Type**: Unit (automated)

**Steps**:
1. Render TreePanel -- IT node starts expanded
2. Click collapse button on IT
3. Click expand button on IT

**Expected Result**: Subcategories toggle visibility correctly

**Status**: PASS -- Verified via 3 expand/collapse tests

---

#### TC-8.3-006: TreePanel section has aria-label for accessibility
**Priority**: High
**Type**: Unit (automated)

**Steps**:
1. Render TreePanel with gender node
2. Query for `role="region"` with gender label

**Expected Result**: `<section aria-label>` wraps the gender content

**Status**: PASS -- Verified via `TreePanel accessibility > wraps gender section in <section> with aria-label`

---

### Deviation Warnings -- TreePanel (Gender Level)

#### TC-8.3-007: Shows deviation warning in free mode when sum < 100%
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**: Gender node with industries summing to 90% (deviation = -10)

**Steps**:
1. Render TreePanel with `balanceMode: 'free'` and industries at 50% + 40%

**Expected Result**: Warning text "Suma: 90.0% (-10.0%)" appears with `role="status"`

**Status**: PASS -- Verified via `TreePanel deviation warnings > shows deviation warning in free mode when industries do not sum to 100%`

---

#### TC-8.3-008: Shows positive deviation warning when sum > 100%
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**: Gender node with industries summing to 110% (deviation = +10)

**Steps**:
1. Render TreePanel with `balanceMode: 'free'` and industries at 50% + 60%

**Expected Result**: Warning text "Suma: 110.0% (+10.0%)" appears with `role="status"`

**Status**: PASS -- Verified via `TreePanel deviation warnings > shows positive deviation warning when industries sum over 100%`

---

#### TC-8.3-009: No deviation warning in auto mode
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**: Gender node with industries NOT summing to 100%, but `balanceMode: 'auto'`

**Steps**:
1. Render TreePanel with `balanceMode: 'auto'` and industries at 50% + 40%

**Expected Result**: No element with `role="status"` is present

**Status**: PASS -- Verified via `TreePanel deviation warnings > does not show deviation warning in auto mode`

---

#### TC-8.3-010: No deviation warning when sum is exactly 100%
**Priority**: High
**Type**: Unit (automated)

**Preconditions**: Gender node with industries summing to exactly 100%

**Steps**:
1. Render TreePanel with `balanceMode: 'free'` and default industries (50% + 50%)

**Expected Result**: No element with `role="status"` is present

**Status**: PASS -- Verified via `TreePanel deviation warnings > does not show deviation warning in free mode when sum is exactly 100%`

---

### Deviation Warnings -- TreeRow (Subcategory Level)

#### TC-8.3-011: Shows deviation warning for expanded node in free mode
**Priority**: Critical
**Type**: Unit (automated)

**Preconditions**: Node with children summing to 74.3%, expanded, free mode

**Steps**:
1. Render TreeRow with IT node expanded in free mode

**Expected Result**: Warning text "Suma: 74.3% (-25.7%)" appears with `role="status"`

**Status**: PASS -- Verified via `TreeRow deviation warnings > shows deviation warning when expanded in free mode with deviation`

---

#### TC-8.3-012: No TreeRow deviation warning in auto mode
**Priority**: Critical
**Type**: Unit (automated)

**Steps**:
1. Render TreeRow with IT node expanded in auto mode

**Expected Result**: No element with `role="status"` is present

**Status**: PASS -- Verified via `TreeRow deviation warnings > does not show deviation warning in auto mode`

---

#### TC-8.3-013: No TreeRow deviation warning when collapsed
**Priority**: High
**Type**: Unit (automated)

**Steps**:
1. Render TreeRow with IT node collapsed in free mode

**Expected Result**: No element with `role="status"` is present

**Status**: PASS -- Verified via `TreeRow deviation warnings > does not show deviation warning when collapsed`

---

#### TC-8.3-014: No TreeRow deviation warning on leaf nodes
**Priority**: High
**Type**: Unit (automated)

**Steps**:
1. Render TreeRow with a leaf node in free mode

**Expected Result**: No element with `role="status"` is present

**Status**: PASS -- Verified via `TreeRow deviation warnings > does not show deviation warning on leaf nodes`

---

#### TC-8.3-015: No TreeRow deviation warning when subcategories sum to 100%
**Priority**: High
**Type**: Unit (automated)

**Steps**:
1. Render TreeRow with IT node expanded, children summing to exactly 100%

**Expected Result**: No element with `role="status"` is present

**Status**: PASS -- Verified via `TreeRow deviation warnings > does not show deviation warning when subcategories sum to exactly 100%`

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Type | Priority | Status |
|---------------------|--------------|------|----------|--------|
| AC: TreePanel renders single gender with sliders | TC-001, TC-004, TC-005 | Unit | Critical | PASS |
| AC: TreePanel displays h2, percentage, absolute value | TC-001, TC-002, TC-003 | Unit | Critical | PASS |
| AC: All existing TreePanel tests adapted to new API | TC-001 through TC-006 | Unit | Critical | PASS |
| AC: Free mode deviation warning in TreePanel | TC-007, TC-008 | Unit | Critical | PASS |
| AC: No deviation warning in auto mode | TC-009 | Unit | Critical | PASS |
| AC: TreeRow subcategory deviation in free mode | TC-011, TC-012, TC-013, TC-014, TC-015 | Unit | Critical | PASS |
| AC: Warnings disappear switching free to auto | TC-009 (auto mode suppresses) | Unit | Critical | PASS |

## Verification Checklist

### Code Quality

- [x] No `any` types used (grep confirmed: zero matches in TreePanel.tsx, TreeRow.tsx, App.tsx)
- [x] Named exports only (no `export default` in any modified file)
- [x] TreePanel.tsx: 124 lines (under 200-line limit)
- [x] TreeRow.tsx: 149 lines (under 200-line limit)
- [x] JSDoc on `TreePanelProps` interface (line 9: `/** Props for the TreePanel component. */`)
- [x] JSDoc on `TreeRowProps` interface (line 9: `/** Props for the TreeRow component. */`)
- [x] JSDoc on all props fields in both interfaces (verified via code review)
- [x] JSDoc on component function (`TreePanel` at line 56, `TreeRow` at line 27)
- [x] JSDoc on helper functions (`collectExpandableIds` at line 19, `formatDeviation` at line 44)

### API Change

- [x] TreePanel API changed from `tree: TreeNode` to `genderNode: TreeNode`
- [x] App.tsx updated to iterate `state.tree.children` and pass individual gender nodes
- [x] Barrel exports in `components/index.ts` include `TreePanel` and `TreePanelProps`

### Automated Verification

- [x] **Lint**: `pnpm lint --filter @template/labor-market-dashboard` -- PASS (0 errors, 0 warnings)
- [x] **Tests**: `pnpm test --filter @template/labor-market-dashboard` -- 251 tests passed, 0 failed
  - TreePanel.test.tsx: 16 tests passed (was 14, +4 deviation, -2 root)
  - TreeRow.test.tsx: 26 tests passed (was 21, +5 deviation)
- [x] **Build**: `pnpm build --filter @template/labor-market-dashboard` -- PASS (tsc --noEmit + vite build succeeded)

### Test Count Verification

| Test File | Expected | Actual | Delta | Status |
|-----------|----------|--------|-------|--------|
| TreePanel.test.tsx | 16 | 16 | +2 from original 14 (-2 root, +4 deviation) | PASS |
| TreeRow.test.tsx | 26 | 26 | +5 from original 21 (+5 deviation) | PASS |
| Total project tests | 251 | 251 | N/A | PASS |

## Regression Impact Analysis

### Affected Areas

- **TreePanel consumers**: Only `App.tsx` consumes TreePanel. Updated in this subtask with temporary compatibility code.
- **TreeRow**: Modified with deviation logic but no API change. All existing 21 tests continue to pass.
- **Other components**: Slider, PieChartPanel, ChartTooltip, ChartLegend -- NOT affected (no changes).
- **State management**: No changes to hooks or reducer -- deviation is computed read-only in the render path.

### Regression Test Results

All 251 tests across the project pass, including:
- 22 Slider tests (unchanged)
- 11 PieChartPanel tests (unchanged)
- 5 ChartTooltip tests (unchanged)
- 5 ChartLegend tests (unchanged)
- 19 useTreeState tests (unchanged)
- 28 calculations tests (unchanged)
- 26 defaultTree tests (unchanged)

No regressions detected.

## Issues Found

None.

## Observations

1. **Test file uses `within()` for scoped queries**: The actual TreePanel test implementation (lines 106-116) uses `within(header)` to scope percentage/absolute value queries to the header div. This is slightly different from the plan code (which used `screen.getByText` directly) but is actually better practice -- it prevents false positives if the same text appears elsewhere in the tree (e.g., slider percentage values).

2. **Deviation warning accessibility**: Both TreePanel and TreeRow use `role="status"` on the deviation warning `<p>` element. This is correct -- `role="status"` implies `aria-live="polite"`, meaning screen readers will announce changes to this region without interrupting the user.

3. **Component line counts are well within limits**: TreePanel at 124 lines and TreeRow at 149 lines are both comfortably under the 200-line maximum.

4. **Temporary App.tsx**: The root `<h1>` heading is absent (will be restored in subtask 8.2 via DashboardHeader). This is an acceptable transient state per the arch-review decision.

## Verdict

**APPROVED**

All acceptance criteria from subtask 8.3 are met. The TreePanel API has been correctly refactored from `tree` to `genderNode`. Deviation warnings display correctly in free mode for both gender-level (TreePanel) and subcategory-level (TreeRow), and are correctly hidden in auto mode and when sums equal 100%. All 16 TreePanel tests and 26 TreeRow tests pass. Lint is clean, build succeeds, and no regressions were found across the full 251-test suite.
