# Architecture Update: task-006
Generated: 2026-02-17

## Impact Assessment

Task-006 introduced the project's first charting library (Recharts 2.15.x) and established the read-only visualization pattern as a second component category alongside the existing controlled interactive pattern. This is a meaningful architectural change: it adds a new production dependency, defines a reusable data-to-chart transformation layer, establishes a fixed color palette as data, and introduces testing conventions for SVG-rendering libraries in jsdom.

Key architectural changes:
- **New production dependency**: `recharts@^2.15.0` -- first external UI library beyond React itself
- **New component pattern**: Read-only visualization (React.memo, no state, no dispatch) distinct from controlled interactive components (Slider)
- **New data layer**: Color palette constants keyed by KVED code (`chartColors.ts`), establishing a convention for stable visual identity across chart types
- **New utility layer**: `chartDataUtils.ts` with `toChartData()` function that transforms TreeNode data to Recharts-compatible format, establishing a boundary between domain data and chart-library-specific structures
- **Ghost slice convention**: Free mode visualization of percentage deviation (under-100% gray slice, over-100% overflow badge)

## Updates Made

- `architecture/overview.md`:
  - Updated Recharts version from "TBD" to "2.15.x" in Tech Stack table, added ADR-0005 reference
  - Added 11 new module entries to Implemented inventory (5 source files + 5 test files + 1 chart color data file)
  - Removed PieChart from Planned inventory (now implemented)
  - Added "Read-Only Visualization Pattern" section under Development Conventions
  - Added "Recharts Integration Convention" section under Development Conventions
  - Added ADR-0005 to Architectural Decisions table

- `architecture/decisions/adr-0005-use-recharts-2x-for-pie-chart-visualization.md`:
  - Created retroactive ADR documenting the choice of Recharts 2.x over 3.x, Chart.js, and custom SVG
  - Key rationale: Recharts 3.x adds Redux/immer transitive dependencies (~80KB gzipped) which conflicts with the project's lightweight useReducer philosophy (ADR-0004)
  - Cross-referenced with ADR-0001 (React 19) and ADR-0004 (useReducer)

- `architecture/CLAUDE.md`:
  - Updated next available ADR number from 0005 to 0006

## Retroactive ADRs Created

- ADR-0005: Use Recharts 2.x for Pie Chart Visualization -- The choice of Recharts 2.x over 3.x is a system-level decision affecting the dependency graph, bundle size, and alignment with the state management philosophy (ADR-0004). This implicit decision was made during TL design (Q1 resolution) and validated during arch-review but was not formally documented as an ADR until now.

## Recommendations

- **Bundle size monitoring**: With Recharts added (~150KB gzipped), the project is approaching meaningful bundle size. Consider adding a bundle analysis step (e.g., `rollup-plugin-visualizer`) before the next charting feature to track progress toward the 500KB NFR-07 target.
- **Recharts 3.x re-evaluation**: If Recharts 3.x releases a lightweight build without Redux dependencies in the future, ADR-0005 should be re-evaluated. Monitor the recharts changelog.
- **Visual regression testing**: jsdom cannot verify SVG geometry, animation timing, or responsive breakpoints. If visual correctness becomes a concern (especially after integrating charts into the main dashboard layout), consider adding Playwright or Chromatic for visual regression tests as a separate task.
- **Color palette accessibility**: The 16-color KVED palette was chosen for visual distinction on white backgrounds. When the dashboard integrates sliders + charts together, verify that color contrast ratios meet WCAG AA standards (especially for the lighter colors like yellow-400 for KVED R).
