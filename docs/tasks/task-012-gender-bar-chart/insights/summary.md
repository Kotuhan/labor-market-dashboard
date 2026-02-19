# Task Summary: Gender Comparison Bar Chart by Industry

**Completed**: 2026-02-19
**Task ID**: task-012

## What Was Done

Added a grouped bar chart to the dashboard that shows male vs. female employment side by side for all 16 industries. The chart appears between the header and the gender section columns, letting users instantly see which industries have the largest gender employment gap without scanning between two separate panels.

## Key Decisions

- Industries are matched by KVED code (not array index) so the chart stays correct even when users add or remove custom industries
- X-axis labels are rotated 45 degrees and truncated to 12 characters to fit all 16 Ukrainian industry names; full names appear in the tooltip
- A new BarChartTooltip was created (rather than reusing ChartTooltip) because the bar chart needs to show both genders per industry, while the pie tooltip shows a single slice
- Fixed 400px chart height with responsive width, following the existing ResponsiveContainer pattern

## What Changed

- New components: GenderBarChart, BarChartTooltip (barrel-exported, React.memo, read-only)
- Extended chartDataUtils with toBarChartData() utility and BarChartDataEntry interface
- DashboardPage updated to render the bar chart above the gender section grid
- chartColors.ts annotated with a comment about the GENDER_COLORS.male / INDUSTRY_COLORS.G hex collision (arch-review condition)
- 13 new tests added across 3 test files (365 total tests passing)
- CLAUDE.md files and architecture docs updated to reflect new components and patterns

## Impact

- Users (journalists, policy-makers) can now answer "Which industries have the largest gender gap?" at a glance -- the most common analytical question -- without mental arithmetic
- The chart reacts in real time to slider changes, population adjustments, and gender ratio modifications
- Screen reader users have equivalent access via a sr-only data table
- Establishes the grouped bar chart pattern for future comparative visualizations
