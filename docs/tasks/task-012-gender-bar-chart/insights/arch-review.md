# Architecture Review: task-012
Generated: 2026-02-19
Iteration: 1

## Verdict: APPROVED

## Review Summary

The TL design for the gender comparison bar chart is well-aligned with established architectural patterns. It correctly follows the read-only visualization pattern from PieChartPanel, uses Recharts 2.x per ADR-0005, respects component boundary conventions, and integrates cleanly into the existing DashboardPage composition. Two minor conditions must be addressed before or during implementation.

## Checklist
- [x] Consistent with existing ADRs
- [x] Event contracts maintained or properly extended
- [x] Component boundaries respected
- [x] Protocol conventions followed
- [x] No undocumented architectural decisions

## Detailed Assessment

### ADR Compliance

- **ADR-0001 (React 19 + Vite 6 + TypeScript)**: Design uses React.memo, TypeScript interfaces with JSDoc, named exports. Fully compliant.
- **ADR-0004 (useReducer state management)**: Component is read-only (no dispatch, no internal state). Correctly derives display data from tree state passed as props. No state management additions. Fully compliant.
- **ADR-0005 (Recharts 2.x)**: Design explicitly specifies Recharts 2.x `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `CartesianGrid`, `ResponsiveContainer`. All are available in Recharts 2.15.x. No Recharts 3.x components referenced. Uses hex color strings for `fill` props via `GENDER_COLORS`. Fully compliant.
- **ADR-0006 (wouter routing)**: No routing changes. Chart is embedded in existing DashboardPage route. Not affected.

### Pattern Compliance

- **Read-only visualization pattern**: Correctly specifies `React.memo` with named function pattern (`memo(function GenderBarChart(...))`), `<figure role="img">` wrapper, sr-only data table, no dispatch, no internal data state. Matches PieChartPanel precedent.
- **Barrel export pattern**: Design specifies adding `GenderBarChart` + `GenderBarChartProps` and `BarChartTooltip` + `BarChartTooltipProps` to `components/index.ts` with value + type export pattern. Correct.
- **Props naming**: Uses `maleNode: TreeNode` and `femaleNode: TreeNode` (not `children`). Correct per the `children` naming prohibition.
- **Named exports only**: All components use named exports. No default exports. Correct.
- **Component size**: `GenderBarChart` estimated at ~130 lines, `BarChartTooltip` at ~60 lines. Both under the 200-line limit.
- **Data transformation outside component**: `toBarChartData()` is a pure utility function in `chartDataUtils.ts`, keeping chart-library-specific transforms testable without React. Matches the established pattern.
- **Interface co-location**: `BarChartDataEntry` is defined in `chartDataUtils.ts` alongside the producing function `toBarChartData()`. This follows the convention where `PieDataEntry` and `SiblingInfo` are co-located with their producing functions in `utils/`.
- **Format utility reuse**: Design uses `formatAbsoluteValue()` from `utils/format.ts` for Y-axis formatting. Correct.
- **Hex colors for Recharts**: Uses `GENDER_COLORS.male` and `GENDER_COLORS.female` (hex constants from `chartColors.ts`), not CSS custom properties. Correct per ADR-0005 and app CLAUDE.md.
- **Tests**: Design specifies ResizeObserver mock for Recharts components in jsdom, DOM structure assertions, accessibility checks. Matches existing PieChartPanel test approach.

### Component Boundaries

- **DashboardPage modification**: The design correctly modifies `DashboardPage.tsx` (the composition root for the dashboard route), not `App.tsx` (the router boundary). The `maleNode` and `femaleNode` variables are already extracted in DashboardPage. Placement between header and grid is clean.
- **No cross-boundary leaks**: `GenderBarChart` does not receive the full tree root -- it gets two gender nodes as separate props. This is consistent with how `GenderSection` receives `genderNode`.
- **New BarChartTooltip vs reusing ChartTooltip**: The decision to create a new tooltip component rather than extending `ChartTooltip` is architecturally sound. The two tooltips have fundamentally different data shapes (single-slice vs. industry-with-both-genders). SRP is maintained.

### Data Flow

The data flow is clean and consistent with existing patterns:
```
useTreeState (App.tsx) -> DashboardPage (props) -> GenderBarChart (maleNode, femaleNode)
                                                      -> toBarChartData() (pure transform)
                                                      -> Recharts BarChart (render)
```

This mirrors the existing flow to PieChartPanel and introduces no new data channels or state management patterns.

## Conditions

1. **Update `utils/index.ts` barrel exports**: The design mentions updating `utils/index.ts` to add `toBarChartData` (value export) and `BarChartDataEntry` (type export). During implementation, ensure the barrel follows the existing grouped pattern in `utils/index.ts` -- add the new exports to the existing `chartDataUtils` import group, not as a separate block.

2. **Verify `GENDER_COLORS.male` collision with `INDUSTRY_COLORS.G`**: Both `GENDER_COLORS.male` and `INDUSTRY_COLORS.G` (Торгівля) use the same hex value `#3B82F6` (blue-500). In the bar chart this is not a problem because bars use gender colors exclusively and industry identification is via X-axis labels. However, the existing overlap should be noted in `chartColors.ts` via a code comment during implementation, so future chart types that combine both color schemes are aware of the collision.

## Architecture Impact

- **No new architectural decisions**: The design extends an existing visualization pattern to a new chart type. No new protocols, no state management changes, no dependency additions.
- **Module inventory**: Two new components (`GenderBarChart`, `BarChartTooltip`) and one new utility function (`toBarChartData`) will be added. The `architecture/overview.md` module inventory should be updated during the arch-update stage after implementation.
- **Component count**: The barrel `components/index.ts` currently exports 10 components + DashboardPage + layout components. Adding 2 more keeps the component library manageable.
