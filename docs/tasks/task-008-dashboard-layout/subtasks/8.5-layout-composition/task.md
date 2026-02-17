# Subtask 8.5: Compose Dashboard Layout in App.tsx + Final Verification

## Parent Task
docs/tasks/task-008-dashboard-layout

## Description
Rewrite App.tsx as the composition root: wire useTreeState hook, render DashboardHeader at top, two GenderSection instances (male + female) in a CSS Grid layout. Run full verification (lint, test, build).

Covers TL design Steps 7 and 8.

## Acceptance Criteria

### Layout
* Given the dashboard loads on desktop (>=1024px), when the layout renders, then header bar spans full width at top, and male/female sections are visible below
* Given both gender sections are visible, then each contains TreePanel + industry pie chart

### State Wiring
* Given the App renders, then useTreeState provides state and dispatch to all children
* Given mode toggle is clicked, then all components reflect the new mode
* Given reset is confirmed, then all values return to defaults
* Given population input changes, then absolute values recalculate

### Verification
* `pnpm lint` passes
* `pnpm test` passes (all existing + new tests)
* `pnpm build` passes

## Files to Modify
- `apps/labor-market-dashboard/src/App.tsx` (complete rewrite)
- `apps/labor-market-dashboard/src/components/index.ts` (verify all 10 component exports)

## Dependencies
- Subtask 8.1 (ModeToggle, ResetButton)
- Subtask 8.2 (DashboardHeader)
- Subtask 8.3 (refactored TreePanel)
- Subtask 8.4 (GenderSection)
