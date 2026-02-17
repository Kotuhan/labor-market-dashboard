# Task Summary: Implement Core State Management and Auto-Balance Logic

**Completed**: 2026-02-17
**Task ID**: task-004

## What Was Done

Built the interactive engine that lets users adjust labor market percentages and see the entire tree of numbers recalculate instantly. When a user moves one industry's percentage, all sibling industries automatically rebalance to maintain a 100% total, with locked industries staying fixed. A "free" mode is also available for unconstrained experimentation.

## Key Decisions

- Chose React's built-in `useReducer` over the external Zustand library -- keeps the dependency footprint at zero and fits the single-component scope of the dashboard. Documented as ADR-0004.
- Percentages are rounded to 1 decimal place using the largest-remainder (Hamilton's) method, guaranteeing sibling percentages always sum to exactly 100.0 -- no floating-point drift.
- All logic lives in pure utility functions separate from the React hook, making it testable without rendering any components.
- Locking the last unlocked sibling in a group is proactively prevented, so auto-balance always has at least one target for redistribution.

## What Changed

- **Types** (`src/types/actions.ts`) -- 5 action types for percentage changes, locking, mode switching, population changes, and reset
- **Tree utilities** (`src/utils/treeUtils.ts`) -- immutable tree traversal and update helpers
- **Calculation engine** (`src/utils/calculations.ts`) -- auto-balance, normalization, cascading recalculation, deviation tracking, and lock guard
- **State hook** (`src/hooks/useTreeState.ts`) -- reducer and React hook wiring all logic together
- **Tests** -- 62 new test cases (107 total), covering all edge cases including performance verification under 16ms

## Impact

- The dashboard now has a fully functional state layer -- the bridge between static data and interactive UI
- Tasks 005 through 010 (sliders, pie charts, tree panel, mode toggle, summary bar, integration) are all unblocked
- Every "what-if" scenario described in the PRD can now be modeled programmatically; only UI rendering remains
