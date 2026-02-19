# Implementation Plan: task-012 — Gender Comparison Bar Chart

## File Changes

### 1. Modify: `apps/labor-market-dashboard/src/utils/chartDataUtils.ts`

Add `BarChartDataEntry` interface and `toBarChartData()` function.

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

`toBarChartData(maleNode: TreeNode, femaleNode: TreeNode): BarChartDataEntry[]`
- Build a map from female industries by KVED code
- Iterate male industries, match by KVED, fallback to 0 for missing
- Append any female-only industries at the end

### 2. Modify: `apps/labor-market-dashboard/src/utils/index.ts`

Add to the chartDataUtils export group:
- Value export: `toBarChartData`
- Type export: `BarChartDataEntry`

### 3. Create: `apps/labor-market-dashboard/src/components/BarChartTooltip.tsx`

Custom tooltip for the grouped bar chart. ~55 lines.

Props: `active?: boolean`, `payload?: RechartsBarPayloadItem[]`, `label?: string`

Structure:
- Guard: return null if !active or empty payload
- Show label (industry name)
- For each payload item: color swatch + gender name + formatAbsoluteValue + formatPercentage
- Styled card matching ChartTooltip pattern

### 4. Create: `apps/labor-market-dashboard/src/components/GenderBarChart.tsx`

Main bar chart component. ~130 lines. React.memo.

Props: `maleNode: TreeNode`, `femaleNode: TreeNode`

Structure:
- `<figure role="img" aria-label="Порівняння зайнятості за статтю та галузями">`
- `<ResponsiveContainer width="100%" height={400}>`
- `<BarChart>` with CartesianGrid, XAxis (45° rotation, truncated labels), YAxis (formatAbsoluteValue), Tooltip (BarChartTooltip), Legend, 2 Bars (male/female with GENDER_COLORS)
- sr-only `<table>` with all 16 industries

### 5. Modify: `apps/labor-market-dashboard/src/components/index.ts`

Add barrel exports for:
- `BarChartTooltip` + `BarChartTooltipProps`
- `GenderBarChart` + `GenderBarChartProps`

### 6. Modify: `apps/labor-market-dashboard/src/components/DashboardPage.tsx`

Import `GenderBarChart`. Place above the grid div inside `<main>`:
```tsx
<GenderBarChart maleNode={maleNode} femaleNode={femaleNode} />
<div className="mt-6 grid ...">
```

### 7. Create: `apps/labor-market-dashboard/src/__tests__/components/BarChartTooltip.test.tsx`

4 tests:
1. Returns null when not active
2. Returns null with empty payload
3. Renders industry name + both gender rows
4. Shows correct color swatches

### 8. Create: `apps/labor-market-dashboard/src/__tests__/components/GenderBarChart.test.tsx`

4 tests (with ResizeObserver mock):
1. Renders figure with role="img" and aria-label
2. sr-only table has 16 data rows
3. Table shows formatted values
4. Handles empty children edge case

### 9. Extend: `apps/labor-market-dashboard/src/__tests__/utils/chartDataUtils.test.ts`

5 new tests in a `toBarChartData` describe block:
1. Returns 16 entries for default tree
2. Correct male/female absolute values
3. Correct percentage values
4. Missing KVED in one gender → 0 fallback
5. Preserves male industry order

### 10. Modify: `apps/labor-market-dashboard/src/data/chartColors.ts`

Add code comment per arch-review condition: note GENDER_COLORS.male / INDUSTRY_COLORS.G hex collision.

## Verification

- `pnpm lint` — no errors
- `pnpm test` — all tests pass
- `pnpm build` — successful
