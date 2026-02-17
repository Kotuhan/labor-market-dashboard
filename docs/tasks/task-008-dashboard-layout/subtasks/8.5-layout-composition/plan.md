# Implementation Plan: Subtask 8.5 -- Layout Composition in App.tsx + Final Verification

Generated: 2026-02-17

## Overview

This is the final subtask of task-008. It rewrites `App.tsx` as the dashboard composition root: wiring `useTreeState`, rendering `DashboardHeader` (sticky top bar), and two `GenderSection` instances (male + female) in a responsive CSS Grid layout. It also verifies that the barrel exports in `components/index.ts` are complete (all 10 components), and runs the full verification suite (lint, test, build).

No new test file is created for `App.tsx` -- it is a thin composition root with no business logic. All behavior is tested via the individual component test suites created in subtasks 8.1-8.4.

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/labor-market-dashboard/src/App.tsx` | **Rewrite** | Complete rewrite from temporary 8.3 stub to final dashboard layout |
| `apps/labor-market-dashboard/src/components/index.ts` | **Verify** | Confirm all 10 component exports (value + type) are present |

## Pre-Implementation Checklist

Before making changes, verify these dependencies from prior subtasks are in place:

- [x] `ModeToggle.tsx` exists with `ModeToggleProps` export (subtask 8.1)
- [x] `ResetButton.tsx` exists with `ResetButtonProps` export (subtask 8.1)
- [x] `DashboardHeader.tsx` exists with `DashboardHeaderProps` export (subtask 8.2)
- [x] `TreePanel.tsx` refactored to accept `genderNode: TreeNode` (subtask 8.3)
- [x] `GenderSection.tsx` exists with `GenderSectionProps` export (subtask 8.4)
- [x] `useTreeState` hook returns `{ state: DashboardState, dispatch }` (unchanged)
- [x] Barrel exports in `components/index.ts` have all 10 components (already verified)

## Step 1: Rewrite App.tsx

### Current State (temporary 8.3 stub)

The current `App.tsx` is a temporary build-compatibility stub that renders `TreePanel` instances directly in a basic wrapper. It lacks the `DashboardHeader`, the proper grid layout, and the `GenderSection` wrapper.

```typescript
// Current -- temporary stub from subtask 8.3
import { TreePanel } from '@/components';
import { useTreeState } from '@/hooks';

export function App() {
  const { state, dispatch } = useTreeState();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        {state.tree.children.map((genderNode) => (
          <TreePanel
            key={genderNode.id}
            genderNode={genderNode}
            balanceMode={state.balanceMode}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}
```

### Target State -- Complete Code for App.tsx (Copy-Paste Ready)

```typescript
import { DashboardHeader, GenderSection } from '@/components';
import { useTreeState } from '@/hooks';

/**
 * Dashboard composition root.
 *
 * Wires useTreeState hook and distributes state/dispatch to:
 * - DashboardHeader: sticky top bar with title, population input, mode toggle, reset
 * - GenderSection (x2): male and female tree + pie chart panels
 *
 * App.tsx contains no business logic -- it is purely compositional.
 * All behavior is tested via individual component test suites.
 */
export function App() {
  const { state, dispatch } = useTreeState();

  const maleNode = state.tree.children[0];
  const femaleNode = state.tree.children[1];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        totalPopulation={state.totalPopulation}
        balanceMode={state.balanceMode}
        dispatch={dispatch}
      />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GenderSection
            genderNode={maleNode}
            balanceMode={state.balanceMode}
            dispatch={dispatch}
          />
          <GenderSection
            genderNode={femaleNode}
            balanceMode={state.balanceMode}
            dispatch={dispatch}
          />
        </div>
      </main>
    </div>
  );
}
```

### Key Design Decisions

1. **Index-based access for gender nodes** (`children[0]` / `children[1]`): The `defaultTree` structure guarantees exactly two children at the root level -- male (index 0) and female (index 1). This is a fixed data contract established in task-002 and task-003. Using `find()` by ID adds unnecessary complexity for a static two-element array. The TL design explicitly lists both approaches and the index approach is simpler.

2. **No `App.css` import**: The current `App.tsx` does not import `App.css` (the temporary stub already removed it). The `App.css` file contains only a placeholder comment (`/* App-specific styles will go here */`). Since all styling uses Tailwind classes, the `App.css` import is not needed. The file can remain in the codebase but is not imported.

3. **Tailwind class ordering**: `grid-cols-1` as the default (mobile/small screens), `lg:grid-cols-2` for desktop (>=1024px). This follows mobile-first responsive design convention.

4. **No `key` prop on GenderSection**: Since the two `GenderSection` instances are rendered explicitly (not via `.map()`), no `key` prop is required.

5. **Sticky header**: The `DashboardHeader` component already applies `sticky top-0 z-10` classes in its own implementation (see `DashboardHeader.tsx` line 84). No additional sticky styling is needed in `App.tsx`.

6. **Under 200 lines**: The final `App.tsx` is approximately 35 lines -- well within the 200-line component limit.

7. **Semantic HTML**: The `<main>` element wraps the content area below the header. The `<header>` is inside `DashboardHeader`. The `<h1>` heading lives in `DashboardHeader` (per arch-review condition 1). Gender sections use `<section aria-label>` via `TreePanel`.

### What Changed From the Temporary Stub

| Aspect | Temporary (8.3) | Final (8.5) |
|--------|-----------------|-------------|
| Header | None | `DashboardHeader` with population input, mode toggle, reset |
| Layout | Single `max-w-3xl` container with card | Full-width `max-w-7xl` with CSS Grid |
| Gender sections | `TreePanel` via `.map()` with key | `GenderSection` (TreePanel + PieChartPanel) explicitly rendered |
| Background | `bg-slate-50` with white card shadow | `bg-slate-50` page background (sections handle their own styling) |
| Imports | Only `TreePanel`, `useTreeState` | `DashboardHeader`, `GenderSection`, `useTreeState` |
| Comment | Temporary update comment | Full JSDoc describing composition root |

## Step 2: Verify Barrel Exports (components/index.ts)

The barrel file already contains all 10 component exports (value + type) in alphabetical order. **No changes are needed.** This step is a read-only verification.

**Expected exports (10 components, all with value + type exports):**

| # | Component | Value Export | Type Export(s) |
|---|-----------|-------------|----------------|
| 1 | ChartLegend | `export { ChartLegend }` | `export type { ChartLegendProps, LegendItem }` |
| 2 | ChartTooltip | `export { ChartTooltip }` | `export type { ChartTooltipProps }` |
| 3 | DashboardHeader | `export { DashboardHeader }` | `export type { DashboardHeaderProps }` |
| 4 | GenderSection | `export { GenderSection }` | `export type { GenderSectionProps }` |
| 5 | ModeToggle | `export { ModeToggle }` | `export type { ModeToggleProps }` |
| 6 | PieChartPanel | `export { PieChartPanel }` | `export type { PieChartPanelProps }` |
| 7 | ResetButton | `export { ResetButton }` | `export type { ResetButtonProps }` |
| 8 | Slider | `export { Slider }` | `export type { SliderProps }` |
| 9 | TreePanel | `export { TreePanel }` | `export type { TreePanelProps }` |
| 10 | TreeRow | `export { TreeRow }` | `export type { TreeRowProps }` |

**Status: COMPLETE** -- no modifications required. The barrel was incrementally updated in subtasks 8.1-8.4.

## Step 3: Run Full Verification

### 3a. Lint Check

```bash
pnpm lint
```

Expected: 0 errors, 0 warnings. The only change is `App.tsx` which uses named imports from barrel, named export, and standard Tailwind classes.

Potential lint concern: Import ordering. ESLint enforces external packages first, then `@/` aliases grouped and separated by blank line. The new `App.tsx` has only `@/` imports, grouped together -- this should pass.

### 3b. Test Suite

```bash
pnpm test
```

Expected: All existing tests pass. No new tests are added in this subtask. The test suites to verify include:

**Component tests (10 files):**
- `src/__tests__/components/DashboardHeader.test.tsx` (subtask 8.2)
- `src/__tests__/components/GenderSection.test.tsx` (subtask 8.4)
- `src/__tests__/components/TreePanel.test.tsx` (refactored in subtask 8.3)
- `src/__tests__/components/TreeRow.test.tsx` (updated in subtask 8.4)
- `src/__tests__/components/ModeToggle.test.tsx` (subtask 8.1)
- `src/__tests__/components/ResetButton.test.tsx` (subtask 8.1)
- `src/__tests__/components/Slider.test.tsx` (unchanged)
- `src/__tests__/components/PieChartPanel.test.tsx` (unchanged)
- `src/__tests__/components/ChartTooltip.test.tsx` (unchanged)
- `src/__tests__/components/ChartLegend.test.tsx` (unchanged)

**Non-component tests (8 files):**
- `src/__tests__/utils/treeUtils.test.ts`
- `src/__tests__/utils/calculations.test.ts`
- `src/__tests__/utils/format.test.ts`
- `src/__tests__/utils/chartDataUtils.test.ts`
- `src/__tests__/data/defaultTree.test.ts`
- `src/__tests__/data/dataHelpers.test.ts`
- `src/__tests__/data/chartColors.test.ts`
- `src/__tests__/hooks/useTreeState.test.ts`
- `src/__tests__/types/tree.test.ts`

### 3c. Build Check

```bash
pnpm build
```

Expected: `tsc --noEmit` passes (no type errors), `vite build` produces a successful bundle. This validates that:
- All imports resolve correctly (`@/components`, `@/hooks`)
- `DashboardHeader` and `GenderSection` prop types match what `App.tsx` passes
- No unused imports or variables
- The full component tree is type-safe from root to leaf

### 3d. Manual Visual Check (Optional but Recommended)

```bash
pnpm dev --filter @template/labor-market-dashboard
```

Open `http://localhost:5173` and verify:
- Sticky header bar at top with "Зайняте населення" title (`<h1>`), population input, mode toggle, reset button
- Two gender sections below in side-by-side grid (on viewports >= 1024px)
- Single-column stacking on narrow viewports (< 1024px)
- Each gender section has: heading (`<h2>`), percentage + absolute value, industry tree with sliders, industry pie chart
- Mode toggle switches between "Авто" and "Вільний"
- In free mode, deviation warnings appear when percentages do not sum to 100%
- Reset button shows confirm dialog and resets all values on confirmation
- Population input accepts numeric entry, dispatches on blur/Enter, reverts on invalid input

## Potential Issues

1. **None expected**: This subtask is purely compositional. The only code change is replacing the temporary `App.tsx` stub with imports of already-tested components. All component interfaces were verified compatible during subtasks 8.1-8.4.

2. **If lint fails on import order**: Ensure `@/components` import comes before `@/hooks` (alphabetical grouping within the `@/` alias group, per ESLint import ordering rules). The provided code already follows this order.

3. **If build fails on type mismatch**: Verify that `state.tree.children[0]` and `state.tree.children[1]` produce `TreeNode` types that match `GenderSectionProps.genderNode`. This is guaranteed by the `DashboardState.tree: TreeNode` type where `children: TreeNode[]`.

4. **No risk of missing `App.css`**: The `App.css` file is not imported in the temporary stub either. The file still exists on disk but is not referenced. No build error will occur.

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
