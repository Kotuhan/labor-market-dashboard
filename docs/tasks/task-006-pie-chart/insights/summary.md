# PO Summary: task-006

Generated: 2026-02-17

## What Was Done

Added pie chart visualization components to the Labor Market Dashboard so users can visually see how industries compare as proportional slices rather than just reading numbers. Three new React components (PieChartPanel, ChartTooltip, ChartLegend), a color palette data file, and a data transformation utility were built using Recharts 2.x, with 45 new tests all passing.

## Key Decisions

- **Recharts 2.15.x chosen over 3.x**: The newer 3.x version pulls in Redux and immer as transitive dependencies, which conflicts with the project's lightweight useReducer approach. Version 2.x is lighter and fully React 19 compatible.
- **Fixed KVED-to-color mapping**: Each of the 16 industries has a permanent color (from Tailwind palette) stored in `chartColors.ts`, ensuring the same industry always gets the same color across male and female charts.
- **Ghost slice for free mode**: When percentages do not sum to 100% in free mode, a gray "unallocated" slice appears. When they exceed 100%, an overflow badge displays the total.
- **`nodes` prop instead of `children`**: Architecture review caught a conflict with React's reserved `children` prop and mandated the rename before implementation.
- **300ms animation duration**: Standard UI transition speed, responsive enough during rapid slider experimentation.

## What Changed

- **New files (10)**: `chartColors.ts` (data), `chartDataUtils.ts` (utils), `PieChartPanel.tsx`, `ChartTooltip.tsx`, `ChartLegend.tsx` (components), plus 5 corresponding test files
- **Modified files (4)**: `package.json` (added recharts dependency), barrel exports in `data/index.ts`, `utils/index.ts`, `components/index.ts`
- **Architecture artifacts**: ADR-0005 created (Recharts 2.x selection), `architecture/overview.md` updated with new modules and conventions
- **CLAUDE.md files**: Both root and app-level CLAUDE.md updated with Recharts patterns, color palette conventions, and read-only component pattern
- **Test count**: 142 existing + 45 new = 187 total tests passing

## Impact

- Users can now see gender split and industry proportions as interactive pie charts that update in real time when sliders are dragged
- The dashboard moves from a numbers-only tool to a visual modeling tool, which is the core value proposition for analysts and policy-makers
- **Unblocks task-007** (expandable tree panel UI) and **task-008** (dashboard layout + mode controls), which compose these chart components into the full page layout
- Milestone M2 (interactive prototype) is now achievable with layout integration as the remaining step
