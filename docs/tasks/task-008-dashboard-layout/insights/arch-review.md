# Architecture Review: task-008

Generated: 2026-02-17
Iteration: 1

## Verdict: APPROVED with conditions

## Review Summary

The TL design is well-structured, follows established architectural patterns, and makes sound composition decisions. It correctly uses existing utilities (`getSiblingDeviation`, `generateSubcategoryColors`, `toChartData`), respects the useReducer state management pattern (ADR-0004), reuses Recharts 2.x components (ADR-0005), and stays within Tailwind CSS v4 conventions (ADR-0002). Two minor conditions are required before implementation.

## Checklist

- [x] Consistent with existing ADRs
- [x] Event contracts maintained or properly extended
- [x] Component boundaries respected
- [x] Protocol conventions followed
- [x] No undocumented architectural decisions

## Conditions

1. **Heading hierarchy must be preserved (accessibility pattern)**: The current TreePanel renders `<h1>` for the root label and `<h2>` for gender sections. The design states the DashboardHeader title should be "text, not `<h1>`" (Step 3). If the root `<h1>` is removed from TreePanel and no `<h1>` is added to DashboardHeader, the page will have no `<h1>` element, breaking the heading hierarchy (`<h2>` without a preceding `<h1>` violates WCAG 1.3.1). **Condition**: The DashboardHeader component MUST render the application title as an `<h1>` element (it becomes the page-level heading since the root header is removed from TreePanel). This maintains the existing `<h1>` -> `<h2>` hierarchy documented in `architecture/overview.md` under "Container + Recursive Component Pattern" and in the app's CLAUDE.md under "Tree Panel Pattern".

2. **Update barrel exports with `export type` for all new component props interfaces**: The design mentions barrel exports in `components/index.ts` for all four new components (ModeToggle, ResetButton, DashboardHeader, GenderSection) but does not explicitly state that each must include `export type { XxxProps }` alongside the value export `export { Xxx }`. This is a mandatory convention per `apps/labor-market-dashboard/CLAUDE.md` ("Barrel Export Convention: Value export for the component, `export type` for the props interface. All future components follow this pattern.") **Condition**: Each new component MUST be added to the barrel with both value and type exports. The existing barrel pattern in `components/index.ts` must be followed exactly.

## Architecture Impact

This task introduces four new components and refactors one existing component. The architectural impact is moderate:

- **TreePanel API change**: The `TreePanelProps` interface changes from `{ tree: TreeNode, balanceMode, dispatch }` to `{ genderNode: TreeNode, balanceMode, dispatch }`. This is a breaking change to the component contract, but it is contained within the same task (App.tsx is the only consumer) and the tests are updated in the same step. No external consumers exist.
- **New component: DashboardHeader**: Becomes the top-level page header and the sole location of the `<h1>` heading. Owns the population input (new UI surface for the existing `SET_TOTAL_POPULATION` action) and composes ModeToggle + ResetButton.
- **New component: GenderSection**: Introduces a new composition boundary -- pairs TreePanel with PieChartPanel per gender. This is a layout concern, not a new architectural pattern.
- **New component: ModeToggle**: First UI surface for the `SET_BALANCE_MODE` action (previously only testable via the reducer). No new action types created.
- **New component: ResetButton**: First UI surface for the `RESET` action. Uses browser `confirm()` as the confirmation mechanism (no modal component needed).
- **TreeRow enhancement**: Gains two new responsibilities -- inline deviation warnings (free mode) and conditional mini PieChartPanel rendering. TreeRow is already 131 lines; adding these features should be monitored against the 200-line component limit. If TreeRow approaches the limit, the mini pie chart rendering could be extracted into a small helper component.
- **No new action types**: All dispatched actions (`SET_BALANCE_MODE`, `SET_TOTAL_POPULATION`, `RESET`) already exist in the `TreeAction` discriminated union (per `src/types/actions.ts`). No reducer changes needed.
- **No new state**: All new components are controlled -- they receive state as props and dispatch actions upward. Expand/collapse state remains as local `useState` in TreePanel (per ADR-0004).
- **No new dependencies**: No npm packages added.
