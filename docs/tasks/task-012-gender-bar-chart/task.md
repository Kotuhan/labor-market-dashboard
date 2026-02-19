---
id: task-012
title: Gender Comparison Bar Chart by Industry
status: backlog
priority: medium
dependencies: [9]
created_at: 2026-02-19
---

# Gender Comparison Bar Chart by Industry

## Problem (PO)

The dashboard currently shows male and female industry data in two separate GenderSection columns. Comparing male vs. female employment for a given industry requires scanning back and forth between columns and mentally comparing absolute values -- cognitively expensive and error-prone across 16 industries.

Users need a single comparative visualization at the top of the dashboard that answers the question: "Which industries have the largest gender employment gap?" -- at a glance, without mental arithmetic.

**User perspective:** "I can see each gender's industries separately, but I cannot quickly compare male vs. female employment side by side for every industry at once. I want a chart that shows the gap immediately."

**Impact of inaction:** The most common analytical question (gender gap by industry) remains unanswerable at a glance. Journalist and policy-maker personas lose a key visualization for reports and briefings.

## Success Criteria (PO)

1. User can identify which industries have the largest male-female employment gap within 3 seconds of looking at the chart
2. Bar chart updates within < 100ms when any slider changes values (NFR-01 compliance)
3. All 16 industries are visible without horizontal scrolling on desktop (1024px+)
4. Chart uses the same gender color coding as the rest of the dashboard (male=#3B82F6, female=#EC4899)
5. Screen reader users can access equivalent comparison data via sr-only fallback

## Acceptance Criteria (PO)

### AC-1: Chart renders with all 16 industries

* Given the dashboard is loaded with default data
  When the user views the area between DashboardHeader and GenderSection columns
  Then a grouped bar chart is visible spanning the full content width (max-w-7xl)
  And the chart displays 16 industry groups on the X-axis
  And each group contains exactly 2 bars (male and female)

### AC-2: Bars show absolute values from tree state

* Given the default tree with 13,500,000 total employed
  When the chart renders
  Then the male bar for each industry reflects the absolute value from the male gender node's corresponding industry child
  And the female bar reflects the absolute value from the female gender node's corresponding industry child
  And the Y-axis scale is labeled in thousands of workers

### AC-3: Industry labels in Ukrainian on X-axis

* Given the chart is rendered
  When the user reads the X-axis labels
  Then each label displays the Ukrainian industry name from the tree node's label field
  And labels are readable without overlap (truncated, rotated, or otherwise adapted)

### AC-4: Gender color coding matches existing palette

* Given the chart renders
  When the user views the bars
  Then male bars use color #3B82F6 (GENDER_COLORS.male)
  And female bars use color #EC4899 (GENDER_COLORS.female)
  And a legend identifies which color represents which gender

### AC-5: Real-time updates on slider interaction

* Given the user changes any industry slider in a GenderSection panel
  When the tree state updates
  Then the corresponding bar updates its height to reflect the new absolute value
  And the update occurs within < 100ms

### AC-6: Real-time updates on population change

* Given the user changes the total population in DashboardHeader
  When the tree state recalculates all absolute values
  Then all bars update their heights proportionally
  And the Y-axis scale adjusts to the new data range

### AC-7: Real-time updates on gender ratio change

* Given the user adjusts the gender ratio slider
  When the tree state recalculates absolute values for both genders
  Then all bars update to reflect the new male/female absolute values per industry

### AC-8: Chart is responsive (full-width)

* Given the viewport width is >= 1024px (desktop)
  When the chart renders
  Then it spans the full content width and all 16 groups are visible without horizontal scrolling

* Given the viewport width is < 1024px
  When the chart renders
  Then it still spans full width and remains usable (bars may be narrower, labels adapted)

### AC-9: Accessibility -- screen reader support

* Given a screen reader user navigates to the bar chart
  When the chart region is reached
  Then it is wrapped in a semantic element with an accessible label
  And a sr-only data table lists each industry with male and female absolute values

### AC-10: Tooltip on hover

* Given the chart is rendered
  When the user hovers over a bar
  Then a tooltip shows the industry name, gender, absolute value (Ukrainian "тис." formatting), and percentage

### AC-11: Reset behavior

* Given the user has modified sliders and clicks Reset
  When the tree state resets to initialState
  Then the bar chart returns to default absolute values for all industries

## Out of Scope (PO)

- **Sorting/reordering industries** -- bars follow fixed tree data order, no user-controlled sorting
- **Stacked bar chart mode** -- only grouped (side-by-side) bars, no stacked/grouped toggle
- **Click-to-drill-down** -- clicking bars does not navigate to subcategories; chart is read-only
- **Subcategory-level bars** -- only Level 2 (industry) bars, no Level 3 subcategory visualization
- **Download/export** -- no image export or data download from the chart
- **Horizontal bar chart** -- vertical orientation only (industries on X, values on Y)
- **Free mode ghost bars** -- unlike pie chart, no "unallocated" ghost bars in free mode
- **Animation on initial load** -- animated entrance is nice-to-have, not required for acceptance
- **Mobile optimization below 320px** -- functional at 1024px+ (P0); graceful degradation below is sufficient

## Open Questions (PO)

No open questions requiring user decision. All design choices resolved from user request and existing patterns:

| Question | Resolution | Source |
|----------|-----------|--------|
| Chart library? | Recharts 2.x (existing, not 3.x) | CLAUDE.md |
| Bar colors? | GENDER_COLORS: male=#3B82F6, female=#EC4899 | User request, chartColors.ts |
| Placement? | Below DashboardHeader, above GenderSection grid | User request |
| Y-axis values? | Absolute values in thousands | User request |
| X-axis labels? | Ukrainian industry names from tree | Data conventions |
| Interactive? | No, read-only (React.memo pattern) | PieChartPanel precedent |
| Reactive to sliders? | Yes, derives from tree state | Existing reactive pattern |

---

## Technical Notes (TL)

- **Affected modules**: `apps/labor-market-dashboard/` only (UI-only enhancement, no backend)
- **New modules/entities to create**:
  - `src/components/GenderBarChart.tsx` -- grouped bar chart component (React.memo, read-only visualization)
  - `src/components/BarChartTooltip.tsx` -- custom tooltip showing industry name + both genders' values
  - `src/__tests__/components/GenderBarChart.test.tsx` -- component tests (ResizeObserver mock)
  - `src/__tests__/components/BarChartTooltip.test.tsx` -- tooltip tests
  - Extend `src/utils/chartDataUtils.ts` with `toBarChartData()` function + `BarChartDataEntry` interface
  - Extend `src/__tests__/utils/chartDataUtils.test.ts` with `toBarChartData` tests
- **DB schema change required?** No
- **Architectural considerations**:
  - Follows read-only visualization pattern from `PieChartPanel` (React.memo, no dispatch, figure + sr-only table)
  - New `BarChartTooltip` needed because `ChartTooltip` is pie-specific (single slice); bar tooltip shows both genders
  - `toBarChartData()` matches industries by KVED code (not index) for robustness with custom industries
  - X-axis: 45-degree rotation + 12-char truncation for Ukrainian labels; full name in tooltip
  - Y-axis: `formatAbsoluteValue()` for Ukrainian "тис." format
  - Chart height: fixed 400px with `ResponsiveContainer` for width responsiveness
  - Recharts default `<Legend>` component used (only 2 items: male/female -- no need for custom scrollable legend)
- **Known risks or trade-offs**:
  - X-axis label readability (Medium): 16 Ukrainian names are long. Mitigated by rotation + truncation + tooltip.
  - Custom industry mismatch (Low): `toBarChartData()` handles with 0-value fallback via KVED matching.
- **Test plan**: Unit tests for `toBarChartData()` utility (5 tests). Component tests for `BarChartTooltip` (4 tests) and `GenderBarChart` (4 tests) -- DOM structure, accessibility, formatted values.

## Implementation Steps (TL)

### Step 1 -- Add `toBarChartData()` utility function

Add a new data transform function to `src/utils/chartDataUtils.ts` that takes both gender nodes and produces an array of `BarChartDataEntry` objects. Each entry pairs male and female absolute values for the same industry (matched by KVED code). Export the function and interface from `src/utils/index.ts`.

- **Files**:
  - Modify: `apps/labor-market-dashboard/src/utils/chartDataUtils.ts`
  - Modify: `apps/labor-market-dashboard/src/utils/index.ts`
  - Modify: `apps/labor-market-dashboard/src/__tests__/utils/chartDataUtils.test.ts`
- **Verification**: `pnpm test` -- new tests pass: (1) returns 16 entries for default tree, (2) correct male/female values, (3) correct percentages, (4) KVED mismatch handling, (5) order preservation.

### Step 2 -- Create `BarChartTooltip` component

Create a custom tooltip component for the grouped bar chart. Receives `active`, `payload[]`, and `label` from Recharts. Shows industry name, male color swatch + value + percentage, female color swatch + value + percentage. Returns null when inactive.

- **Files**:
  - Create: `apps/labor-market-dashboard/src/components/BarChartTooltip.tsx`
  - Modify: `apps/labor-market-dashboard/src/components/index.ts` (barrel export)
  - Create: `apps/labor-market-dashboard/src/__tests__/components/BarChartTooltip.test.tsx`
- **Verification**: `pnpm test` -- new tests pass: (1) null when inactive, (2) null on empty payload, (3) renders industry name + both gender rows, (4) correct color swatches.

### Step 3 -- Create `GenderBarChart` component

Create the main bar chart component using Recharts `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`. Props: `maleNode: TreeNode`, `femaleNode: TreeNode`. Wrapped in `React.memo`. Includes `<figure role="img">` wrapper and sr-only data table for accessibility.

- **Files**:
  - Create: `apps/labor-market-dashboard/src/components/GenderBarChart.tsx`
  - Modify: `apps/labor-market-dashboard/src/components/index.ts` (barrel export)
  - Create: `apps/labor-market-dashboard/src/__tests__/components/GenderBarChart.test.tsx`
- **Verification**: `pnpm test` -- new tests pass: (1) figure with role="img" + aria-label, (2) sr-only table with 16 data rows, (3) formatted values in table, (4) empty children edge case.

### Step 4 -- Integrate `GenderBarChart` into `DashboardPage`

Add `GenderBarChart` to `DashboardPage.tsx`, placed inside `<main>` above the GenderSection grid. Pass `maleNode` and `femaleNode` which are already extracted in the component.

- **Files**:
  - Modify: `apps/labor-market-dashboard/src/components/DashboardPage.tsx`
- **Verification**: `pnpm dev` -- visually verify chart renders between header and gender sections. Chart updates when sliders change.

### Step 5 -- Run linter, tests, and build

Full verification suite to ensure no regressions.

- **Files**: None (verification only)
- **Verification**:
  - `pnpm lint` -- no errors
  - `pnpm test` -- all tests pass, no skips
  - `pnpm build` -- successful, no type errors

---

## Implementation Log (DEV)

_To be filled during implementation._

---

## QA Notes (QA)

_To be filled by QA verification._

### Test Cases

_To be filled by QA verification._

### Test Results

- Pending
