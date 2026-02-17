---
status: accepted
date: 2026-02-17
triggered-by: task-006
---

# ADR-0005: Use Recharts 2.x for Pie Chart Visualization

## Context and Problem Statement

The Labor Market Dashboard needs an interactive pie chart library to visualize gender and industry distribution data. The PRD specifies "Recharts" for pie charts with animations and tooltips. Recharts has two active major versions: 2.x (2.15.x latest) and 3.x (3.7.0 latest), with significantly different dependency profiles. The project uses React 19 and has adopted `useReducer` for state management (per ADR-0004), with a bundle size target of < 500KB gzipped.

## Decision Drivers

- PRD specifies Recharts for pie chart visualization
- Bundle size target: < 500KB gzipped (NFR-07)
- State management uses React `useReducer` (per ADR-0004) -- no Redux in the dependency tree
- React 19 compatibility required (per ADR-0001)
- Charts render SVG (not Canvas) for accessibility and DOM-testability
- Library must support custom tooltips with Ukrainian formatting and animated transitions

## Considered Options

- Recharts 2.15.x (latest 2.x stable)
- Recharts 3.7.x (latest 3.x stable)
- Chart.js with react-chartjs-2 (Canvas-based)
- Custom SVG implementation (no library)

## Decision Outcome

Chosen option: "Recharts 2.15.x", because it provides React 19 compatibility with a lightweight dependency profile that aligns with the project's `useReducer`-based architecture. Recharts 3.x was rejected because it introduces `@reduxjs/toolkit`, `immer`, `react-redux`, and `reselect` as transitive dependencies -- adding ~80KB gzipped and an entire Redux runtime to a project that explicitly chose to avoid external state libraries (per ADR-0004). Chart.js was rejected because Canvas rendering is harder to test with React Testing Library and provides less accessible SVG output. Custom SVG was rejected as disproportionate effort for the feature scope.

This decision was made during TL design (Q1 resolution) and validated during arch-review.

### Consequences

- Good, because Recharts 2.x dependencies (`lodash`, `react-smooth`, `victory-vendor`, `recharts-scale`) are lightweight (~150KB gzipped total), well within the 500KB budget
- Good, because Recharts 2.x ships with built-in TypeScript declarations (no `@types/recharts` needed)
- Good, because SVG rendering integrates with jsdom for testing DOM structure (figure, ARIA, data table) without a headless browser
- Good, because the Recharts `<Tooltip content={<CustomComponent />}>` API enables custom tooltip components that reuse existing Ukrainian formatting utilities
- Bad, because Recharts 2.x has a `react-is@^18.3.1` transitive dependency that may produce peer warnings with React 19 (functionally harmless -- React 19 includes `react-is`)
- Bad, because Recharts 2.x is the older major version and will eventually receive fewer updates than 3.x
- Bad, because SVG geometry (arc sizes, positions) cannot be meaningfully tested in jsdom -- visual regression testing would require browser-based tools

## More Information

- Recharts 2.x components used: `PieChart`, `Pie`, `Cell`, `Tooltip`, `ResponsiveContainer`
- Color mapping requires hex strings (not CSS custom properties) via `<Cell fill={color}>`
- Animation: 300ms duration, `ease-out` easing, `isAnimationActive={true}`
- `ResizeObserver` mock required for testing Recharts components in jsdom
- Color palette: Fixed KVED-code-to-hex mapping in `src/data/chartColors.ts` (16 Tailwind palette colors)
- If Recharts 3.x later removes the Redux dependency or provides a lightweight build, this ADR should be re-evaluated
- Related: [ADR-0001](adr-0001-adopt-react-vite-typescript-frontend-stack.md) (React 19), [ADR-0004](adr-0004-use-react-usereducer-for-state-management.md) (useReducer over Zustand -- same lightweight philosophy)
