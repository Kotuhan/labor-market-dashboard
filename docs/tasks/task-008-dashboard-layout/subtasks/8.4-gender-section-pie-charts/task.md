# Subtask 8.4: Create GenderSection + Mini Subcategory Pie Charts

## Parent Task
docs/tasks/task-008-dashboard-layout

## Description
Create the GenderSection wrapper component that pairs a gender's refactored TreePanel with its industry PieChartPanel side-by-side. Also add mini IT subcategory pie charts to TreeRow for expanded industry nodes with children.

Covers TL design Steps 5 and 6.

## Acceptance Criteria

### GenderSection
* Given a gender section is visible, when the user views it, then it contains TreePanel (industries with sliders) and an industry pie chart for that gender
* Given a gender's pie chart, when sliders are adjusted, then the pie chart updates in real-time
* Given the pie chart, then it uses INDUSTRY_COLORS and has appropriate aria-label

### Mini IT Subcategory Pie Charts
* Given the IT industry node is expanded, when the user views the expanded section, then a mini pie chart shows the 10 subcategory percentages
* Given an IT subcategory slider is adjusted in auto mode, then the mini pie chart updates
* Given a leaf industry node (no children), then no mini pie chart is rendered
* Given a collapsed industry node with children, then no mini pie chart is visible

## Files to Create
- `apps/labor-market-dashboard/src/components/GenderSection.tsx`
- `apps/labor-market-dashboard/src/__tests__/components/GenderSection.test.tsx`

## Files to Modify
- `apps/labor-market-dashboard/src/components/TreeRow.tsx` (add mini pie chart rendering)
- `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx` (add mini pie chart tests)
- `apps/labor-market-dashboard/src/components/index.ts` (add barrel export)

## Dependencies
- Subtask 8.3 (TreePanel must be refactored to single-gender API)
