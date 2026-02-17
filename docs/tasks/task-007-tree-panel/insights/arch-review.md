# Architecture Review: task-007

Generated: 2026-02-17
Iteration: 1

## Verdict: APPROVED

## Review Summary

The TL design for the TreePanel + TreeRow component split is well-aligned with all existing ADRs, established component patterns (Slider, PieChartPanel), and project conventions. The design makes no undocumented architectural decisions and introduces no new dependencies. It correctly categorizes expand/collapse as UI-only state that does not belong in the reducer (per ADR-0004).

## Checklist

- [x] Consistent with existing ADRs
- [x] Event contracts maintained or properly extended
- [x] Component boundaries respected
- [x] Protocol conventions followed
- [x] No undocumented architectural decisions

## Detailed Review

### ADR-0001 (React 19 + Vite 6 + TypeScript 5.7)

The design uses only React 19 built-in APIs (`useState`, `useCallback`, `memo`). No new framework or build tool dependencies. Named exports follow TypeScript conventions. The `.tsx` extension is correctly specified for files containing JSX. The test file extension convention (`.tsx` for component tests with JSX) is also correct.

### ADR-0002 (Tailwind CSS v4)

Indentation uses `paddingLeft` via inline style (`depth * 24`), which is appropriate for dynamic values that cannot be expressed as static Tailwind classes. Tailwind utility classes (`h-11 w-11`, `pl-6`, `pl-12`) are used for static dimensions. No `tailwind.config.js` or PostCSS configuration introduced.

### ADR-0003 (ESLint v8 legacy format)

No linting configuration changes. New files will be covered by existing `.eslintrc.cjs` configuration.

### ADR-0004 (useReducer for state management)

This is the most architecturally relevant ADR for this task. The design correctly identifies that expand/collapse state is **UI-only state** -- it has no business logic implications, does not affect calculations, and does not need to survive state resets. Using `useState<Set<string>>` in TreePanel (rather than adding it to `DashboardState` / `TreeAction`) is the right call. ADR-0004 scopes the reducer to "5 discrete action types with deterministic behavior" for the tree data model. Expand/collapse is visual chrome, not data.

The design also correctly notes that `dispatch` from `useReducer` is referentially stable (ADR-0004 consequence), so `React.memo` on TreeRow will be effective for the dispatch prop without wrapping it.

### ADR-0005 (Recharts 2.x)

No Recharts changes. The tree panel does not render charts -- it renders sliders. No conflict.

### Component Boundaries

- **TreePanel (container)**: Manages expand/collapse state, renders root header and gender sections. Does not render sliders directly -- delegates to TreeRow. This is consistent with the container/presentational split seen in PieChartPanel (which delegates to ChartTooltip and ChartLegend).
- **TreeRow (recursive leaf)**: Renders a single node with embedded Slider. Wrapped in `React.memo` using the named function pattern `memo(function TreeRow(...))` -- identical to the PieChartPanel pattern established in task-006.
- **200-line constraint**: The split ensures each file stays under 200 lines. TreeRow handles per-node rendering + recursion. TreePanel handles state + layout. This is a clean separation.

### Controlled Component Pattern

TreeRow follows the established controlled pattern from Slider (per app CLAUDE.md "Controlled Component Pattern" section):
- No internal data state for percentage -- value comes from `node` prop
- Dispatch actions upward via `dispatch` prop
- `React.memo` for performance (new for TreeRow, but established by PieChartPanel)

### Naming Conventions

- Props interfaces: `TreePanelProps`, `TreeRowProps` -- consistent with `SliderProps`, `PieChartPanelProps`
- Named exports only (no default exports) -- consistent with all components except legacy App.tsx
- The design correctly proposes converting App.tsx from default export to named export, aligning with convention
- Barrel exports: value export for component + `export type` for props interface -- matches existing `components/index.ts` pattern
- No use of `children` prop name for data arrays -- `node` and `siblings` props are used (respects the "DO NOT name a prop `children` when passing `TreeNode[]` data" rule)

### Accessibility

- Chevron toggle button: `<button>` element (native keyboard support), `aria-expanded` attribute, `aria-label` with node label
- Touch targets: `h-11 w-11` (44x44px) per WCAG 2.5.5 -- same as Slider lock button
- Inline SVG chevrons: `aria-hidden="true"` pattern consistent with Slider lock icons

### `useCallback` Usage

The design specifies `useCallback` on `handleToggleExpand` in TreePanel. This is necessary and correct: TreeRow is wrapped in `React.memo`, so the toggle callback must be referentially stable across renders. This is an exception to the general "no premature useCallback" guidance in the app CLAUDE.md, because memo'd children are a valid reason for referential stability. The design explicitly documents this rationale.

### Test Strategy

- Test directory mirrors source: `__tests__/components/TreeRow.test.tsx` and `TreePanel.test.tsx`
- `.tsx` extension for files with JSX -- correct
- `makeProps()` factory pattern, `afterEach(cleanup)`, `vi.fn()` for dispatch -- matches Slider.test.tsx and PieChartPanel.test.tsx patterns
- Minimal test tree (not 55-node defaultTree) for TreePanel tests -- correct for unit test isolation
- Test counts (~15-20 for TreeRow, ~10-12 for TreePanel) are proportionate to component complexity

### No New Dependencies

Pure React implementation. No icon library, no animation library, no tree virtualization library. Inline SVG chevrons follow the Slider lock icon precedent.

## Conditions

- When updating `App.tsx` to named export (Step 4), verify that `main.tsx` imports are updated accordingly. The current `App.tsx` uses `export default App` and `main.tsx` likely uses a default import.

## Architecture Impact

This task adds two new UI components (TreePanel, TreeRow) to the component inventory but does not change the data model, state management architecture, or any existing module interfaces. The component count in `src/components/` grows from 4 to 6. The barrel export in `components/index.ts` gains 2 value exports and 2 type exports.

No new ADR is needed -- the design follows all established patterns without introducing new architectural decisions.
