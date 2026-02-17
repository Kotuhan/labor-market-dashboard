# Architecture Review: task-006
Generated: 2026-02-17
Iteration: 1

## Verdict: APPROVED (with conditions)

## Review Summary

The TL design for pie chart visualization components is architecturally sound. It correctly follows the established controlled component pattern (ADR-0004), maintains proper module boundaries (data in `data/`, utilities in `utils/`, components in `components/`), uses the existing barrel export conventions, and makes a well-reasoned dependency choice (Recharts 2.15.x over 3.x to avoid bundle bloat from Redux/immer). One naming issue must be addressed before implementation, and two documentation updates are required as conditions of approval.

## Checklist
- [x] Consistent with existing ADRs
- [x] Event contracts maintained or properly extended
- [x] Component boundaries respected
- [x] Protocol conventions followed
- [x] No undocumented architectural decisions

## Detailed Review

### ADR-0001 (React 19 + Vite 6 + TypeScript 5.7)

**Status: Consistent.** The design uses React 19 compatible Recharts 2.15.x, adds a production dependency (not a framework change), and follows TypeScript strict mode with proper interface definitions. All new files use the `@` path alias pattern established in the Vite config. The `React.memo` wrapper and `useEffect` for prop sync follow React 19 patterns. No deviation from the frontend stack decision.

### ADR-0002 (Tailwind CSS v4 CSS-first config)

**Status: Consistent.** The design correctly uses hex color values directly for Recharts `<Cell fill={color}>` rather than attempting to access Tailwind theme via JS config (which does not exist per ADR-0002). The responsive strategy uses Tailwind responsive classes (`flex-row`, `flex-col`) on wrapper divs, not inside Recharts components. Custom tooltip and legend styling uses Tailwind utility classes. No `tailwind.config.js` is created. The acknowledgment in ADR-0002 that "charting libraries need programmatic access to theme colors via CSS custom properties rather than importing a JS config object" is addressed by the design's approach of using hex constants derived from Tailwind's palette.

### ADR-0003 (ESLint v8 legacy format)

**Status: Consistent.** No changes to ESLint configuration. New files follow existing extension patterns.

### ADR-0004 (React useReducer for state management)

**Status: Consistent.** The pie chart components are explicitly read-only visualizations -- they receive `TreeNode` data as props and render charts. They do not manage data state internally and do not dispatch actions. This respects the unidirectional data flow established by ADR-0004: state lives in `useReducer`, components receive it as props. The `PieChartPanel` correctly takes `TreeNode[]` and `BalanceMode` as props rather than accessing global state.

The choice of Recharts 2.x over 3.x specifically avoids introducing `@reduxjs/toolkit` and `immer` as transitive dependencies, which would conflict with the project's lightweight `useReducer` approach. This shows good alignment with ADR-0004's rationale about bundle size and simplicity.

### Component Boundaries

**Status: Consistent.** The design follows the established single-file component pattern (not directory-based), matching the Slider precedent. File placement is correct:
- Color constants in `src/data/` (alongside `defaultTree.ts`) -- data concern
- Data transformation in `src/utils/` (alongside `calculations.ts`) -- utility concern
- Components in `src/components/` (alongside `Slider.tsx`) -- UI concern

Barrel exports follow the exact conventions documented in the app CLAUDE.md: value exports for components, `export type` for interfaces, mixed exports in `utils/`.

### Naming Conventions

**Status: Consistent, with one concern (see Conditions).** Node ID scheme (`nodeId` field in `PieDataEntry`) aligns with the established kebab-case identifiers. Ukrainian labels are preserved. The `ChartSize` type uses string literal union (`'standard' | 'mini'`) rather than enum, following the project convention (per CLAUDE.md: "String literal union types preferred over enums for small fixed sets").

**Concern**: The `PieChartPanelProps` interface uses `children: TreeNode[]` as a prop name. In React, `children` is a reserved prop name with special semantics (it refers to JSX children passed between opening/closing tags). Using `children` for a different purpose (an array of TreeNode data) will cause type conflicts with `React.PropsWithChildren` and create confusion. This must be renamed (e.g., `nodes`, `items`, or `data`).

### Test Strategy

**Status: Consistent.** Tests follow the established patterns: `makeProps()` factory, `afterEach(cleanup)`, `vi.fn()` with v3 syntax, test files in `src/__tests__/` mirroring source structure, `.ts` for non-JSX tests and `.tsx` for component tests. The test count (~36 new tests) is proportional to the implementation scope.

### Performance

**Status: Consistent.** The design respects NFR-01 (< 100ms slider update latency) by keeping the `toChartData()` transformation as O(n) where n=16, and using `React.memo` to prevent unnecessary re-renders. The decision not to use `useMemo` for the trivial transformation is justified and follows the established pattern (no premature optimization, per the Slider component precedent).

### Accessibility

**Status: Consistent.** The `<figure>` wrapper with `role="img"` and `aria-label`, combined with an `sr-only` data table fallback, provides a reasonable accessible experience. This aligns with NFR-03 (Lighthouse Accessibility > 90). Color swatches using `aria-hidden="true"` and semantic `<ul>/<li>` markup for the legend follow WCAG practices.

## Conditions

The following conditions must be met during implementation:

1. **Rename `children` prop in `PieChartPanelProps`**: The prop name `children` conflicts with React's reserved `children` prop. Rename it to `nodes`, `items`, or `data` in the `PieChartPanelProps` interface and all references. This is a correctness issue, not a stylistic preference -- using `children: TreeNode[]` will cause TypeScript type conflicts when the component is wrapped with `React.memo` or used with `React.PropsWithChildren`.

2. **Update `architecture/overview.md` after implementation**: The overview's "Tech Stack" table currently lists Recharts as "TBD" for version. After implementation, update the Recharts row to show `2.15.x` with the rationale "Pie chart support, React 19 compatible, lightweight dependencies". Also update the Module Inventory's "Implemented" table with the new modules (chartColors, chartDataUtils, PieChartPanel, ChartTooltip, ChartLegend and their tests). This update will happen during the arch-update stage.

3. **Document the `react-is` peer dependency workaround**: If a `peerDependencyRules` override is added to `package.json` to suppress the `react-is` warning, this should be noted in the app-level CLAUDE.md under a "Known Workarounds" section so future developers understand why it exists.

## Architecture Impact

This task introduces the first external runtime dependency beyond React itself (Recharts 2.15.x). It does not change the state management architecture, the data model, or the component interaction patterns. The new components are purely additive read-only visualizations.

- **New dependency**: `recharts@^2.15.0` (production)
- **New data module**: `chartColors.ts` establishes the color palette convention (KVED-to-color mapping) that will be reused by any future chart types
- **New utility module**: `chartDataUtils.ts` introduces the `PieDataEntry` interface and data transformation pattern
- **New components**: 3 components (PieChartPanel, ChartTooltip, ChartLegend), all following the controlled read-only pattern
- **No architectural decision needs a new ADR**: The Recharts version choice and color palette approach are implementation details within the existing architecture, not architectural decisions that change system-level patterns
