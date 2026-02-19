# Technical Design: task-012
Generated: 2026-02-19

## Overview

Add a full-width grouped bar chart (`GenderBarChart`) to `DashboardPage.tsx`, placed between `DashboardHeader` and the `GenderSection` grid. The chart compares male vs. female absolute employment values across all 16 industries, using Recharts 2.x `BarChart` with two `Bar` elements (one per gender). The component follows the existing **read-only visualization pattern** established by `PieChartPanel`: `React.memo`, data-as-props, no dispatch, `<figure>` wrapper with sr-only data table, and data transformation via a pure utility function in `chartDataUtils.ts`.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/` only (UI-only enhancement)
- **New modules/entities to create**:
  - `src/components/GenderBarChart.tsx` -- grouped bar chart component
  - `src/components/BarChartTooltip.tsx` -- custom tooltip for bar chart (bar-specific: shows industry name, both gender values, percentages)
  - `src/__tests__/components/GenderBarChart.test.tsx` -- component tests
  - `src/__tests__/components/BarChartTooltip.test.tsx` -- tooltip tests
  - `src/__tests__/utils/chartDataUtils.test.ts` -- extended with `toBarChartData` tests (existing file)
- **DB schema change required?** No
- **Architectural considerations**:
  - Data transform function `toBarChartData()` goes in existing `chartDataUtils.ts` (co-located with `toChartData()`)
  - New `BarChartTooltip` is needed because existing `ChartTooltip` is pie-specific (shows one slice; bar chart tooltip should show industry name + both male and female values in one tooltip popup)
  - `GenderBarChart` receives both gender nodes as separate props (`maleNode: TreeNode`, `femaleNode: TreeNode`), not the full tree root
  - X-axis labels: 45-degree angle rotation + truncation at 12 characters to fit 16 Ukrainian labels
  - Y-axis: formatted in thousands using `formatAbsoluteValue()` (displays "тис." values)
  - Chart height: fixed 400px (sufficient for 16 industry groups, consistent with desktop viewport)
- **Known risks or trade-offs**:
  - **X-axis label readability** (Medium): 16 Ukrainian industry names are long. Mitigation: 45-degree rotation + 12-char truncation + full name in tooltip. May need adjustment after visual testing.
  - **Custom industry mismatch** (Low): If user adds a custom industry to only one gender, that industry will show only one bar. `toBarChartData()` handles this via left-join on KVED code with 0-value fallback.
  - **Performance** (Low): `React.memo` prevents unnecessary re-renders. 32 bars (16 groups x 2) is trivial for Recharts.
- **Test plan**: Unit tests for `toBarChartData()` utility; component tests for DOM structure, accessibility, tooltip rendering. No integration tests needed -- the component is stateless read-only.

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| New `BarChartTooltip` component (not reusing `ChartTooltip`) | `ChartTooltip` is pie-specific: shows one slice's name/value. Bar chart tooltip needs to show industry name + both genders' values simultaneously (Recharts grouped bar tooltip passes all bars' data in `payload[]`). Fundamentally different structure. | Extend `ChartTooltip` with conditional logic -- rejected: violates SRP, makes pie tooltip harder to reason about |
| `toBarChartData()` in existing `chartDataUtils.ts` | Co-locates all chart data transforms in one file. File is currently 137 lines; adding ~40 lines keeps it under 200. Follows the established pattern of keeping Recharts-specific transforms together. | New file `barChartDataUtils.ts` -- rejected: premature file split, creates unnecessary import surface |
| `maleNode` + `femaleNode` props (not `tree: TreeNode`) | Follows the existing convention: `GenderSection` receives `genderNode`, `PieChartPanel` receives `nodes`. Avoids coupling the bar chart to the full tree structure. DashboardPage already extracts both gender nodes. | `nodes: TreeNode[]` (gender children array) -- viable but less self-documenting; `tree: TreeNode` -- rejected: leaks tree root into read-only component |
| Fixed 400px chart height | 16 industry groups need vertical space for readable bars. `ResponsiveContainer width="100%" height={400}` -- width-responsive, height-fixed. Matches the pattern used by `PieChartPanel` (fixed height per size variant). | Fully responsive height -- rejected: Recharts bar charts don't auto-size well with many groups; percentage-based height causes layout shifts |
| X-axis: 45-degree rotation + 12-char truncation | Ukrainian industry names average 15-20 characters. Horizontal labels overlap at 16 groups. 45-degree rotation with truncation is the standard Recharts approach. Full label shown in tooltip on hover. | Vertical labels (90 degrees) -- harder to read; Abbreviations -- requires manually curated abbreviation map; Responsive font size -- unreliable across breakpoints |
| Match industries by KVED code, not array index | Both genders have the same 16 industries in the same order currently, but custom industries (task-011) can be added per-gender. KVED-based matching is robust. Industries without a match on the other gender get 0 value. | Index-based matching -- fragile when custom industries differ between genders |

## Implementation Steps

### Step 1 -- Add `toBarChartData()` utility function

Add a new data transform function to `src/utils/chartDataUtils.ts` and export it from `src/utils/index.ts`.

**Interface:**
```typescript
/** Single data point for the gender comparison bar chart. */
export interface BarChartDataEntry {
  /** Ukrainian industry label (for X-axis) */
  industry: string;
  /** KVED code (for stable identification) */
  kvedCode: string;
  /** Male absolute value */
  male: number;
  /** Female absolute value */
  female: number;
  /** Male percentage of male gender total */
  malePercentage: number;
  /** Female percentage of female gender total */
  femalePercentage: number;
}
```

**Logic:**
1. Build a map of KVED code -> `{ label, maleValue, femaleValue, malePercentage, femalePercentage }` from both gender nodes' children.
2. Iterate male industries first (preserves default ordering), then append any female-only industries.
3. For each industry, lookup the matching KVED code in the other gender. If not found, use 0.
4. Return `BarChartDataEntry[]`.

- **Files to create/modify**:
  - Modify: `apps/labor-market-dashboard/src/utils/chartDataUtils.ts` (add `BarChartDataEntry` interface + `toBarChartData()` function)
  - Modify: `apps/labor-market-dashboard/src/utils/index.ts` (add value export for `toBarChartData`, type export for `BarChartDataEntry`)
- **Verification**: Add unit tests in existing `apps/labor-market-dashboard/src/__tests__/utils/chartDataUtils.test.ts`. Tests: (1) returns 16 entries for default tree, (2) correct male/female absolute values, (3) correct percentage values, (4) handles missing KVED in one gender (0 fallback), (5) preserves industry order from male node.

---

### Step 2 -- Create `BarChartTooltip` component

Create a new custom tooltip component for the bar chart. When Recharts triggers a tooltip on a bar group, it passes a `payload` array with entries for both male and female bars.

**Component structure:**
```
<div> (styled card)
  <industry-name>
  <male-row>: color swatch + "Чоловіки" + absolute value (formatAbsoluteValue) + percentage (formatPercentage)
  <female-row>: color swatch + "Жінки" + absolute value (formatAbsoluteValue) + percentage (formatPercentage)
</div>
```

The tooltip receives `active`, `payload`, and `label` from Recharts. Guard clause returns null if not active or payload is empty.

- **Files to create/modify**:
  - Create: `apps/labor-market-dashboard/src/components/BarChartTooltip.tsx` (~60 lines)
  - Modify: `apps/labor-market-dashboard/src/components/index.ts` (add barrel export)
- **Verification**: Unit tests in `apps/labor-market-dashboard/src/__tests__/components/BarChartTooltip.test.tsx`. Tests: (1) renders null when not active, (2) renders null with empty payload, (3) shows industry name + both gender rows with formatted values, (4) correct color swatches.

---

### Step 3 -- Create `GenderBarChart` component

Create the main bar chart component following the read-only visualization pattern from `PieChartPanel`.

**Props interface:**
```typescript
export interface GenderBarChartProps {
  /** Male gender tree node */
  maleNode: TreeNode;
  /** Female gender tree node */
  femaleNode: TreeNode;
}
```

**Component structure (~120-150 lines):**
```
<figure role="img" aria-label="Порівняння зайнятості за статтю та галузями">
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={toBarChartData(maleNode, femaleNode)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="industry"
        angle={-45}
        textAnchor="end"
        height={80}
        interval={0}
        tick={{ fontSize: 11 }}
        tickFormatter={(label) => truncate(label, 12)}
      />
      <YAxis tickFormatter={(value) => formatAbsoluteValue(value)} />
      <Tooltip content={<BarChartTooltip />} />
      <Legend />
      <Bar dataKey="male" name="Чоловіки" fill={GENDER_COLORS.male} />
      <Bar dataKey="female" name="Жінки" fill={GENDER_COLORS.female} />
    </BarChart>
  </ResponsiveContainer>

  {/* sr-only data table */}
  <table className="sr-only">
    <caption>Порівняння зайнятості за статтю та галузями</caption>
    <thead>
      <tr>
        <th>Галузь</th>
        <th>Чоловіки</th>
        <th>Жінки</th>
      </tr>
    </thead>
    <tbody>
      {data.map(entry => (
        <tr key={entry.kvedCode}>
          <td>{entry.industry}</td>
          <td>{formatAbsoluteValue(entry.male)}</td>
          <td>{formatAbsoluteValue(entry.female)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</figure>
```

**Key details:**
- Wrapped in `React.memo` (named function pattern: `memo(function GenderBarChart(...))`)
- `margin.bottom: 80` provides space for rotated X-axis labels
- `interval={0}` on XAxis ensures all 16 labels render (no auto-skipping)
- `truncate()` is a local private helper: `(str: string, max: number) => str.length > max ? str.slice(0, max) + '...' : str`
- Recharts `<Legend>` is used directly (not a custom legend) -- gender legend only has 2 items (unlike pie chart's 16), so the default horizontal layout works well
- Y-axis uses `formatAbsoluteValue` which already produces Ukrainian "тис." format

- **Files to create/modify**:
  - Create: `apps/labor-market-dashboard/src/components/GenderBarChart.tsx` (~130 lines)
  - Modify: `apps/labor-market-dashboard/src/components/index.ts` (add barrel export for GenderBarChart + GenderBarChartProps)
- **Verification**: Unit tests in `apps/labor-market-dashboard/src/__tests__/components/GenderBarChart.test.tsx`. Tests: (1) renders figure with role="img" and aria-label, (2) sr-only data table has 16 rows + header, (3) data table shows formatted values, (4) renders with empty industry children (edge case).

---

### Step 4 -- Integrate `GenderBarChart` into `DashboardPage`

Add the bar chart between `DashboardHeader` and the `GenderSection` grid in `DashboardPage.tsx`.

**Placement:**
```tsx
<DashboardHeader ... />
<main className="mx-auto max-w-7xl px-4 py-6">
  {/* NEW: Gender comparison bar chart */}
  <GenderBarChart maleNode={maleNode} femaleNode={femaleNode} />

  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
    <GenderSection ... />
    <GenderSection ... />
  </div>
</main>
```

The bar chart goes inside `<main>` within the `max-w-7xl` container, above the existing grid. Add `mt-6` to the grid div for spacing.

- **Files to create/modify**:
  - Modify: `apps/labor-market-dashboard/src/components/DashboardPage.tsx` (import GenderBarChart, add to JSX)
- **Verification**: Visual: run `pnpm dev`, verify chart renders above gender sections. Automated: existing DashboardPage has no tests (composition root pattern), and adding tests for integration is unnecessary per established pattern.

---

### Step 5 -- Run linter, tests, and build

Run the full verification suite to ensure no regressions.

- **Files to create/modify**: None (verification only)
- **Verification**:
  - `pnpm lint` -- no errors
  - `pnpm test` -- all tests pass (existing + new), no skips
  - `pnpm build` -- successful build, no type errors

## Complexity Assessment

- **Estimated effort**: 1 day
- **Risk level**: Low
  - No state management changes (read-only component)
  - No new dependencies (Recharts BarChart already available in 2.x)
  - No database changes
  - No routing changes
  - Follows well-established patterns from PieChartPanel
- **Dependencies**:
  - Task 009 (Recharts integration) -- completed
  - Recharts 2.15.x already installed as dependency

## Test Strategy

### Unit tests

- **`toBarChartData()`** (in `chartDataUtils.test.ts`): 5 tests covering default data, value correctness, percentage correctness, KVED mismatch handling, ordering.
- **`BarChartTooltip`** (new file): 4 tests covering inactive state, empty payload, rendered content, color swatches.
- **`GenderBarChart`** (new file): 4 tests covering figure/ARIA structure, sr-only data table row count, formatted values, edge case with empty children.

### Integration tests

Not needed. The component is stateless and read-only. Integration behavior (reactivity to slider changes) is guaranteed by React's re-render model: when tree state changes, DashboardPage re-renders, passing new `maleNode`/`femaleNode` props to `GenderBarChart`, which recomputes `toBarChartData()` and renders updated bars.

### E2E tests

Not needed for this task. E2E coverage for chart reactivity can be added as part of a future E2E test suite.

## Open Technical Questions

No new technical questions discovered during design. All design decisions are resolvable from existing patterns and codebase conventions.
