# Architecture Update: task-012
Generated: 2026-02-19

## Impact Assessment

Minimal architectural impact. Task-012 added a grouped bar chart (GenderBarChart + BarChartTooltip) to the dashboard. Both components follow the established read-only visualization pattern (React.memo, figure+sr-only table, no dispatch, data transformation outside component). The bar chart uses Recharts 2.15.x -- the same library already chosen in ADR-0005 -- extending its usage from pie charts to bar charts. No new libraries, no new state management patterns, no routing changes, no new modules outside the existing component/utility structure.

The `toBarChartData()` utility was added to the existing `chartDataUtils.ts` file, matching industries across genders by KVED code. This follows the established pattern of co-locating chart data transformation functions and their interfaces in `utils/`.

## Updates Made

- `architecture/overview.md`: Updated Visualization row in System Components table to mention both pie and bar charts. Added 4 new module inventory entries (GenderBarChart, BarChartTooltip, and their test files). Updated Chart Data Utils entry to include `toBarChartData()` and `BarChartDataEntry`. Updated Read-Only Visualization Pattern section to list bar chart components. Updated Recharts Integration Convention section to document bar chart components, bar-specific color mapping (`GENDER_COLORS`), and dual tooltip pattern.
- `architecture/decisions/adr-0005-use-recharts-2x-for-pie-chart-visualization.md`: Updated "More Information" section to list bar chart Recharts components alongside pie chart components, and note the color palette distinction (KVED colors for pie, gender colors for bar).

## Retroactive ADRs Created

None -- no implicit decisions found. The bar chart uses the same Recharts 2.x library already covered by ADR-0005. The decision to use Recharts for bar charts (not just pie charts) is a natural extension of that ADR, not a new architectural decision. The ADR's reasoning (lightweight bundle, SVG rendering, no Redux dependency, React 19 compatibility) applies identically to bar chart components.

## Recommendations

- ADR-0005's title says "for Pie Chart Visualization" but it now covers bar charts too. If additional chart types are added (line charts, area charts, etc.), consider renaming the ADR to something broader like "Use Recharts 2.x for Data Visualization" via a superseding ADR. For now, the title is acceptable with the updated "More Information" section.
- The `GENDER_COLORS.male` hex value (`#3B82F6`) collides with `INDUSTRY_COLORS.G` (both blue-500). A code comment was added per arch-review condition. This is harmless since they are used in different chart contexts (bar vs pie), but be aware if future visualizations mix both color maps.
