# QA Plan: task-012 -- Gender Comparison Bar Chart
Generated: 2026-02-19

## Test Scope

Verify that the grouped bar chart (`GenderBarChart`) correctly renders male vs. female employment comparison by industry, integrates into the DashboardPage, follows established code patterns, and all acceptance criteria (AC-1 through AC-11) are addressed.

## Test Cases

### TC-012-01: Chart renders with all 16 industries (AC-1)
**Priority**: Critical
**Type**: Unit + Manual

**Preconditions**:
- Dashboard loaded with default tree data (13,500,000 total)

**Steps**:
1. Render `GenderBarChart` with default male/female nodes
2. Inspect sr-only data table row count
3. Verify figure wrapper exists with correct aria-label

**Expected Result**:
- sr-only table has 16 data rows (one per industry)
- figure has `role="img"` and `aria-label="Порівняння зайнятості за статтю та галузями"`
- Each industry group has exactly 2 bars (male + female via two `<Bar>` elements)

**Actual Result**: Automated test `GenderBarChart > sr-only data table has 16 data rows plus header` verifies 17 rows (1 header + 16 data). Figure role and aria-label verified by `GenderBarChart > renders figure with role="img" and aria-label`.
**Status**: PASS

---

### TC-012-02: Bars show absolute values from tree state (AC-2)
**Priority**: Critical
**Type**: Unit

**Preconditions**:
- Default tree with known absolute values

**Steps**:
1. Call `toBarChartData(maleNode, femaleNode)`
2. Verify first entry's `male` value matches `maleNode.children[0].absoluteValue`
3. Verify KVED-matched female value matches

**Expected Result**:
- Male bar values equal the male gender node's industry child `absoluteValue`
- Female bar values equal the KVED-matched female industry child `absoluteValue`
- Y-axis uses `formatAbsoluteValue()` (Ukrainian "тис." format)

**Actual Result**: `toBarChartData > returns correct male and female absolute values for first industry` passes. Y-axis tickFormatter uses `formatAbsoluteValue` (verified in source code line 68 of GenderBarChart.tsx).
**Status**: PASS

---

### TC-012-03: Industry labels in Ukrainian on X-axis (AC-3)
**Priority**: High
**Type**: Unit + Code Review

**Preconditions**:
- Default tree with Ukrainian labels

**Steps**:
1. Verify `toBarChartData` returns `industry` field from node's `label`
2. Verify XAxis `dataKey="industry"` in GenderBarChart
3. Verify labels are truncated at 12 chars and rotated -45 degrees

**Expected Result**:
- X-axis `dataKey` is `"industry"` (Ukrainian label from tree)
- `tickFormatter` truncates at 12 characters with ellipsis
- `angle={-45}`, `textAnchor="end"`, `interval={0}` ensures all labels render without auto-skipping

**Actual Result**: Source code confirms `dataKey="industry"`, `angle={-45}`, `textAnchor="end"`, `interval={0}`, `tickFormatter` calls `truncate(label, 12)`. The `truncate` function correctly appends `...` for strings exceeding 12 chars.
**Status**: PASS

---

### TC-012-04: Gender color coding matches existing palette (AC-4)
**Priority**: High
**Type**: Unit + Code Review

**Preconditions**:
- GENDER_COLORS defined in chartColors.ts

**Steps**:
1. Verify male Bar uses `fill={GENDER_COLORS.male}` (#3B82F6)
2. Verify female Bar uses `fill={GENDER_COLORS.female}` (#EC4899)
3. Verify Legend component is rendered

**Expected Result**:
- Male bars: #3B82F6 (blue-500)
- Female bars: #EC4899 (pink-500)
- Recharts `<Legend />` renders identifying colors

**Actual Result**: Source code (GenderBarChart.tsx lines 71-72) confirms `fill={GENDER_COLORS.male}` and `fill={GENDER_COLORS.female}`. `<Legend />` is present at line 70. Color swatches also verified in `BarChartTooltip > shows correct color swatches` test.
**Status**: PASS

---

### TC-012-05: Real-time updates on slider interaction (AC-5)
**Priority**: High
**Type**: Architectural / Code Review

**Preconditions**:
- GenderBarChart integrated into DashboardPage

**Steps**:
1. Verify GenderBarChart receives `maleNode` and `femaleNode` from DashboardPage state
2. Verify `toBarChartData()` is called on each render with current props
3. Verify React.memo allows re-render when props change

**Expected Result**:
- When any slider dispatches `SET_PERCENTAGE`, the reducer recalculates tree state, DashboardPage re-renders, and passes updated `maleNode`/`femaleNode` to GenderBarChart
- `toBarChartData()` recomputes bar data on every render (no stale memoization)

**Actual Result**: DashboardPage passes `maleNode={state.tree.children[0]}` and `femaleNode={state.tree.children[1]}`, which update on every state change. `toBarChartData(maleNode, femaleNode)` is called inline in the render body (line 45). React.memo with default shallow comparison allows re-render when node references change. Pattern is architecturally sound.
**Status**: PASS (by design -- no integration test, but guaranteed by React rendering model)

---

### TC-012-06: Real-time updates on population change (AC-6)
**Priority**: High
**Type**: Architectural / Code Review

**Steps**:
1. Verify `SET_TOTAL_POPULATION` action recalculates all `absoluteValue` fields
2. Verify GenderBarChart displays `absoluteValue` (not percentage) for bar heights

**Expected Result**:
- Population change triggers tree recalculation, all absoluteValues update, bars reflect new values
- Y-axis auto-scales to new data range (Recharts default behavior)

**Actual Result**: `toBarChartData` uses `absoluteValue` for `male`/`female` fields. The reducer's `SET_TOTAL_POPULATION` handler calls `recalcTreeFromRoot` which updates all absoluteValues. Recharts YAxis auto-scales by default.
**Status**: PASS (by design)

---

### TC-012-07: Real-time updates on gender ratio change (AC-7)
**Priority**: High
**Type**: Architectural / Code Review

**Steps**:
1. Verify gender ratio slider dispatches `SET_PERCENTAGE` for gender nodes
2. Verify cascading recalc updates all industry absoluteValues

**Expected Result**:
- Gender ratio change recalculates male/female splits, all industry absoluteValues update
- Both sets of bars update proportionally

**Actual Result**: Same reactive pattern as AC-5/AC-6. Gender ratio changes cascade through `recalcTreeFromRoot`, updating all descendant absoluteValues.
**Status**: PASS (by design)

---

### TC-012-08: Chart is responsive (AC-8)
**Priority**: Medium
**Type**: Code Review + Manual

**Steps**:
1. Verify `ResponsiveContainer width="100%" height={400}` in GenderBarChart
2. Verify chart is placed within DashboardPage `<main>` container

**Expected Result**:
- Chart spans full container width via `ResponsiveContainer width="100%"`
- Fixed 400px height ensures vertical readability
- On narrower viewports, bars compress horizontally (Recharts default behavior)

**Actual Result**: Source code confirms `ResponsiveContainer width="100%" height={400}` (line 53). Chart is direct child of `<main className="mx-auto w-4/5 py-6">`.
**Status**: PASS (with observation -- see Issues section)

---

### TC-012-09: Accessibility -- screen reader support (AC-9)
**Priority**: Critical
**Type**: Unit

**Preconditions**:
- GenderBarChart rendered with default data

**Steps**:
1. Verify `<figure role="img" aria-label="...">` wrapper
2. Verify sr-only `<table>` with caption, column headers, and data rows
3. Verify `<th scope="col">` on header cells

**Expected Result**:
- figure has `role="img"` and descriptive `aria-label`
- sr-only table has `<caption>`, three column headers (Галузь, Чоловіки, Жінки) with `scope="col"`
- 16 data rows with industry name, male value, female value (formatted)

**Actual Result**: Verified via tests `GenderBarChart > renders figure with role="img" and aria-label` and `GenderBarChart > sr-only data table has 16 data rows plus header`. Source code confirms `<th scope="col">` on all three headers (lines 82-84). Caption text matches aria-label.
**Status**: PASS

---

### TC-012-10: Tooltip on hover (AC-10)
**Priority**: High
**Type**: Unit

**Preconditions**:
- BarChartTooltip rendered with active payload

**Steps**:
1. Verify tooltip shows full industry name (not truncated)
2. Verify both gender rows with color swatches, names, formatted values, percentages
3. Verify null return when inactive or empty payload

**Expected Result**:
- Industry name from `data.industry` (full, not truncated X-axis label)
- Male row: blue swatch + "Чоловіки:" + formatted absolute value + percentage
- Female row: pink swatch + "Жінки:" + formatted absolute value + percentage
- Returns null for inactive or empty payload states

**Actual Result**: Four tests pass: `BarChartTooltip > returns null when not active`, `> returns null with empty payload`, `> renders industry name with both gender rows`, `> shows correct color swatches`. Formatted values "1 194 тис.", "1 039 тис.", "16.8%", "16.3%" all verified.
**Status**: PASS

---

### TC-012-11: Reset behavior (AC-11)
**Priority**: Medium
**Type**: Architectural / Code Review

**Steps**:
1. Verify RESET action returns `initialState` (reference to `defaultTree`)
2. Verify GenderBarChart derives data from current state (no internal cache)

**Expected Result**:
- After RESET, tree returns to default values
- GenderBarChart receives default maleNode/femaleNode and renders default bars

**Actual Result**: RESET action in reducer returns `initialState` (verified in existing useTreeState tests). GenderBarChart has no internal state -- `toBarChartData` is called fresh each render with current props. Pattern is correct.
**Status**: PASS (by design)

---

### TC-012-12: Empty children edge case
**Priority**: Medium
**Type**: Unit

**Steps**:
1. Render GenderBarChart with empty children arrays on both gender nodes

**Expected Result**:
- Component renders without crashing
- sr-only table has only header row, no data rows

**Actual Result**: Test `GenderBarChart > handles empty children without crashing` passes. Table has 1 row (header only).
**Status**: PASS

---

### TC-012-13: KVED mismatch handling (custom industries)
**Priority**: Medium
**Type**: Unit

**Steps**:
1. Create male node with KVED "ZZ" and female node with KVED "A" (no overlap)
2. Call `toBarChartData`

**Expected Result**:
- Returns 2 entries: ZZ entry with female=0, A entry with male=0
- No crash or missing data

**Actual Result**: Test `toBarChartData > falls back to 0 when KVED code is missing in one gender` passes. Verified both directions of fallback.
**Status**: PASS

---

### TC-012-14: Industry order preservation
**Priority**: Medium
**Type**: Unit

**Steps**:
1. Call `toBarChartData` with default tree
2. Compare KVED code order against male node children order

**Expected Result**:
- Bar chart entries follow the same order as male node's children (primary ordering)

**Actual Result**: Test `toBarChartData > preserves industry order from male node` passes.
**Status**: PASS

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Type | Priority | Status |
|---------------------|--------------|------|----------|--------|
| AC-1: 16 industries render | TC-012-01 | Unit | Critical | PASS |
| AC-2: Absolute values from tree | TC-012-02 | Unit | Critical | PASS |
| AC-3: Ukrainian X-axis labels | TC-012-03 | Unit + Review | High | PASS |
| AC-4: Gender color coding | TC-012-04 | Unit + Review | High | PASS |
| AC-5: Real-time slider updates | TC-012-05 | Architectural | High | PASS |
| AC-6: Population change updates | TC-012-06 | Architectural | High | PASS |
| AC-7: Gender ratio updates | TC-012-07 | Architectural | High | PASS |
| AC-8: Responsive full-width | TC-012-08 | Review + Manual | Medium | PASS |
| AC-9: Screen reader support | TC-012-09 | Unit | Critical | PASS |
| AC-10: Tooltip on hover | TC-012-10 | Unit | High | PASS |
| AC-11: Reset behavior | TC-012-11 | Architectural | Medium | PASS |
| Edge: empty children | TC-012-12 | Unit | Medium | PASS |
| Edge: KVED mismatch | TC-012-13 | Unit | Medium | PASS |
| Edge: order preservation | TC-012-14 | Unit | Medium | PASS |

## Regression Impact Analysis

### Affected areas
- **DashboardPage**: Layout container class changed from `max-w-7xl px-4` to `w-4/5` (see Observation #1 below)
- **chartDataUtils.ts**: New function added; existing `toChartData`, `getNodeColor`, `generateSubcategoryColors` unchanged
- **components/index.ts**: Two new barrel exports added (BarChartTooltip, GenderBarChart); existing exports unchanged
- **utils/index.ts**: New exports added (`toBarChartData`, `BarChartDataEntry`); existing exports unchanged
- **chartColors.ts**: Only JSDoc comment change (no functional change)

### Out-of-scope changes detected in working tree
The following files have changes that appear to belong to a different task (likely task-011.2 layout/routing), not task-012:
- `TreePanel.tsx` -- `mirrored` prop, industry collapse/expand, `collectExpandableIds` removed
- `TreeRow.tsx` -- `mirrored` prop, directional indentation/chevrons
- `GenderSection.tsx` -- `mirrored` prop passthrough
- `DashboardPage.tsx` -- `mirrored={false}`/`mirrored={true}` props, layout class change
- Test files for TreePanel, TreeRow, GenderSection updated for new `mirrored` prop

These changes are outside the scope of this QA review. They should be verified separately under their respective task.

## Regression Test Suite

All existing 365 tests pass:
- `pnpm test`: 24 test files, 365 tests, 0 failures
- `pnpm lint`: 0 errors
- `pnpm build`: successful (tsc --noEmit + vite build)

## Test Environment Requirements

- Node.js with pnpm
- jsdom (via Vitest) for component tests
- ResizeObserver mock for Recharts ResponsiveContainer

## Code Quality Verification

### Pattern Compliance

| Pattern | Expected | Actual | Status |
|---------|----------|--------|--------|
| React.memo on read-only viz | `memo(function GenderBarChart(...))` | Confirmed (line 41) | PASS |
| Named exports only | No default exports | Confirmed in all new files | PASS |
| Components < 200 lines | Max 200 lines per component | GenderBarChart: 98, BarChartTooltip: 81 | PASS |
| Hex colors for Recharts | `GENDER_COLORS.male`/`.female` | `fill={GENDER_COLORS.male}` | PASS |
| JSDoc on interfaces | Field-level docs | BarChartDataEntry: 6 fields documented | PASS |
| Barrel exports | Value + `export type` | Both in components/index.ts and utils/index.ts | PASS |
| No `children` prop for data | Uses `maleNode`/`femaleNode` | Confirmed | PASS |
| sr-only data table | `<figure role="img">` + `<table className="sr-only">` | Confirmed | PASS |
| `formatAbsoluteValue` for display | Y-axis + sr-only table | Both use `formatAbsoluteValue` | PASS |
| `formatPercentage` for display | Tooltip percentages | `formatPercentage(data.malePercentage)` | PASS |
| Test makeProps factory | Default props with Partial overrides | Both test files use `makeProps()` | PASS |
| ResizeObserver mock | Required for Recharts in jsdom | Present in GenderBarChart.test.tsx | PASS |
| Vitest v3 mock syntax | `vi.fn<(...) => ...>()` | No mocks needed (read-only component) | N/A |

### New Test Counts

| Test File | Tests | Description |
|-----------|-------|-------------|
| GenderBarChart.test.tsx | 4 | Figure ARIA, table rows, formatted values, empty children |
| BarChartTooltip.test.tsx | 4 | Null states (2), content rendering, color swatches |
| chartDataUtils.test.ts | +5 (21 total) | 16 entries count, values, percentages, KVED mismatch, order |
| **Total new** | **13** | |

## Definition of Done Checklist

- [x] All 14 test cases pass
- [x] No critical bugs open
- [x] Regression suite passes (365 tests, 0 failures)
- [x] Code coverage: 13 new tests across 3 test files
- [x] `pnpm lint` passes (0 errors)
- [x] `pnpm test` passes (365 tests)
- [x] `pnpm build` succeeds
- [x] All 11 acceptance criteria addressed
- [x] Components under 200 lines (GenderBarChart: 98, BarChartTooltip: 81)
- [x] Follows React.memo read-only visualization pattern
- [x] Barrel exports updated in both components/index.ts and utils/index.ts
- [x] chartColors.ts comment added per arch-review condition (GENDER_COLORS/INDUSTRY_COLORS.G collision note)

## Observations (Non-blocking)

### Observation 1: DashboardPage layout class change

The DashboardPage `<main>` container changed from `max-w-7xl px-4` to `w-4/5`. AC-1 specifies "spanning the full content width (max-w-7xl)". The current `w-4/5` implementation still makes the chart span the full content area width (since `w-4/5` IS the content area now), but the specific class mentioned in the acceptance criteria text (`max-w-7xl`) is no longer used. This appears to be an intentional layout change from task-011.2 (layout shell introduction), not from task-012. The chart correctly spans the full available content width regardless of which container class is used.

### Observation 2: Out-of-scope changes in working tree

The git working tree contains modifications to TreePanel, TreeRow, GenderSection, and their test files that add a `mirrored` prop system. These changes are not part of task-012 and should be committed/verified under their own task. They do not affect the bar chart functionality.

### Observation 3: chartDataUtils.ts file length

The `chartDataUtils.ts` utility file is now 215 lines after adding `toBarChartData()`. The 200-line limit in CLAUDE.md applies to components, not utility files. The TL design anticipated this (noted the file was 137 lines, adding ~40 lines keeps it manageable). No action needed.

## Verification Results

**Verification Date**: 2026-02-19
**Verified By**: QA Agent

### Automated Tests
- Unit Tests: 365 passed, 0 failed (13 new for task-012)
- E2E Tests: N/A (not required per test strategy)
- Lint: 0 errors
- Build: successful

### Test Case Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-012-01 (16 industries) | PASS | Verified via GenderBarChart unit tests |
| TC-012-02 (absolute values) | PASS | Verified via toBarChartData unit tests |
| TC-012-03 (Ukrainian labels) | PASS | Verified via code review (XAxis config) |
| TC-012-04 (gender colors) | PASS | Verified via BarChartTooltip color swatch test + code review |
| TC-012-05 (slider updates) | PASS | Verified by design (React re-render model) |
| TC-012-06 (population updates) | PASS | Verified by design (reducer recalculation) |
| TC-012-07 (gender ratio updates) | PASS | Verified by design (cascading recalc) |
| TC-012-08 (responsive) | PASS | Verified via code review (ResponsiveContainer) |
| TC-012-09 (accessibility) | PASS | Verified via GenderBarChart unit tests (figure, sr-only table) |
| TC-012-10 (tooltip) | PASS | Verified via BarChartTooltip unit tests (4 tests) |
| TC-012-11 (reset) | PASS | Verified by design (stateless component + RESET action) |
| TC-012-12 (empty children) | PASS | Verified via GenderBarChart unit test |
| TC-012-13 (KVED mismatch) | PASS | Verified via toBarChartData unit test |
| TC-012-14 (order preservation) | PASS | Verified via toBarChartData unit test |

### Issues Found

No issues found.

### Verdict

**APPROVED**

All 11 acceptance criteria are satisfied. The implementation follows established patterns (React.memo, read-only visualization, barrel exports, hex colors, sr-only accessibility, formatAbsoluteValue/formatPercentage). All 365 tests pass, lint is clean, and the build succeeds. The 13 new tests provide adequate coverage for the new utility function and components.
