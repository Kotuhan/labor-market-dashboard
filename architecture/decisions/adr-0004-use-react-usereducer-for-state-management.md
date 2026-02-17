---
status: accepted
date: 2026-02-17
triggered-by: task-004
---

# ADR-0004: Use React useReducer for Dashboard State Management

## Context and Problem Statement

The Labor Market Dashboard needs a state management solution for a 55-node tree structure with two slider modes (auto-balance and free), node locking, and cascading absolute value recalculation. The PRD listed "Zustand / useReducer" as candidates, and the tech stack table had this as TBD. A decision was needed before implementing the core state layer in task-004.

## Decision Drivers

- State is a single tree structure (not multiple independent stores)
- State transitions are well-defined: 5 discrete action types with deterministic behavior
- Reducer must be directly unit-testable without React rendering (`renderHook` adds test complexity)
- No cross-component state sharing needed yet (single root component owns all state)
- No async operations in state management (all state transitions are synchronous)
- Bundle size matters for a GitHub Pages SPA (< 500KB gzipped target)

## Considered Options

- React `useReducer` with exported reducer function
- Zustand (external state management library)
- React `useState` with multiple state variables

## Decision Outcome

Chosen option: "React `useReducer` with exported reducer function", because the state transitions are a natural fit for a reducer pattern (discriminated union of 5 action types dispatched to a pure function), the reducer is directly testable as a plain function without React rendering, no additional dependency is needed (useReducer is built into React 19), and the single-tree state shape maps cleanly to a single reducer.

This decision was made by the user during PO analysis (Q4: "useReducer (not Zustand)").

### Consequences

- Good, because the reducer is a pure function `(DashboardState, TreeAction) => DashboardState` -- testable with 19 unit tests calling it directly, no `renderHook` needed
- Good, because no additional npm dependency -- useReducer ships with React 19, keeping bundle size minimal
- Good, because the 5-action discriminated union (`TreeAction`) provides exhaustive type checking via TypeScript's switch narrowing
- Good, because immutable tree updates via spread operator are straightforward for 55 nodes (< 1ms per dispatch, verified by performance test)
- Bad, because if the app grows to need cross-component state sharing (e.g., multiple dashboard panels), useReducer would need to be lifted to context or replaced with Zustand
- Bad, because there are no built-in devtools for useReducer (Zustand has devtools middleware); debugging state transitions requires manual logging
- Bad, because middleware patterns (logging, undo/redo, persistence) would require custom wrapper code rather than Zustand's built-in middleware support

## More Information

- Implementation: `apps/labor-market-dashboard/src/hooks/useTreeState.ts` (reducer + hook)
- Action types: `apps/labor-market-dashboard/src/types/actions.ts` (TreeAction discriminated union)
- The `treeReducer` function and `initialState` are both exported as named exports for direct testing
- Utility functions are separated into `src/utils/treeUtils.ts` (tree traversal) and `src/utils/calculations.ts` (math/balance) -- the reducer orchestrates these
- If future requirements demand global state or devtools, migrating to Zustand is low-friction: Zustand's store creation accepts the same `(state, action) => state` reducer shape
- Related: [ADR-0001](adr-0001-adopt-react-vite-typescript-frontend-stack.md) (React 19 provides useReducer)
