# Architecture Update: task-004
Generated: 2026-02-17

## Impact Assessment

Task-004 introduced the core state management layer for the Labor Market Dashboard. This is a significant architectural addition that establishes the state management pattern for all future UI features. Three new module areas were created (`hooks/`, `utils/`, `types/actions.ts`) within the existing SPA, and a key technology decision (useReducer over Zustand) was formalized.

Key architectural impacts:
- **New state management pattern**: React `useReducer` with an exported pure reducer function, establishing a layered architecture: `useTreeState` (thin hook) -> `treeReducer` (exported, testable) -> pure utility functions (`utils/`)
- **New action protocol**: `TreeAction` discriminated union with 5 action types (`SET_PERCENTAGE`, `TOGGLE_LOCK`, `SET_BALANCE_MODE`, `SET_TOTAL_POPULATION`, `RESET`) -- this becomes the contract for all UI components that modify state
- **Immutable tree update pattern**: Recursive clone via spread operator (no Immer), acceptable for the 55-node tree size
- **Module boundaries**: Clear separation between tree traversal (`treeUtils.ts`) and mathematical operations (`calculations.ts`), with interfaces co-located in `utils/` rather than `types/`

## Updates Made

- `architecture/overview.md`:
  - Updated "State Management" row in System Components table: "Zustand / useReducer" -> "React useReducer" with ADR-0004 reference
  - Updated "State" row in Tech Stack table: version changed from "TBD" to "19.x (built-in)", ADR reference added
  - Moved 10 implemented modules from "Planned" to "Implemented" section in Module Inventory (actions.ts, treeUtils.ts, calculations.ts, utils/index.ts, useTreeState.ts, hooks/index.ts, and 3 test files)
  - Removed `useAutoBalance` from Planned (auto-balance logic is integrated into `calculations.ts` and the reducer, not a separate hook)
  - Expanded Auto-Balance Algorithm section with implementation details (function names, edge cases, lock guard, mode switch normalization)
  - Added ADR-0004 to Architectural Decisions table

- `architecture/CLAUDE.md`:
  - Updated next available ADR number from 0004 to 0005

## Retroactive ADRs Created

- **ADR-0004**: Use React useReducer for dashboard state management (`architecture/decisions/adr-0004-use-react-usereducer-for-state-management.md`)
  - Documents the user's decision (PO Q4) to use `useReducer` over Zustand
  - Captures decision drivers: single tree state, 5 deterministic actions, direct testability, no async, zero dependency cost
  - Documents consequences: good (pure function testing, no dependency, exhaustive type checking, < 1ms performance) and bad (no devtools, no middleware, lifting needed if state sharing required)
  - Notes migration path to Zustand if future requirements demand it

## Recommendations

1. **Future state scaling**: If the dashboard grows to need multiple state consumers (e.g., separate panels, undo/redo, persistence), consider migrating from `useReducer` to Zustand. The reducer shape is compatible -- Zustand accepts the same `(state, action) => state` pattern. ADR-0004 should be superseded at that point.

2. **Performance monitoring**: The current approach recalculates the entire tree on every dispatch (< 1ms for 55 nodes, verified by test). If the tree structure grows significantly (e.g., subcategories added to all industries), consider structural sharing or memoized selectors.

3. **`useAutoBalance` removal**: The TL design originally planned a separate `useAutoBalance` hook. The implementation integrated auto-balance logic directly into `calculations.ts` and the reducer, which is simpler. This is correctly reflected in the updated Planned modules list (removed `useAutoBalance`).

4. **`format.ts` still pending**: The number formatting utility (`src/utils/format.ts`) remains in the Planned section. It will likely be needed when UI components are implemented (task-005 or similar).
