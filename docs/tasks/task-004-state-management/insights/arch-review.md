# Architecture Review: task-004
Generated: 2026-02-17
Iteration: 1

## Verdict: APPROVED

## Review Summary

The TL design is well-structured, thoroughly documented, and fully consistent with all existing ADRs, type conventions, data conventions, and established project patterns. The design introduces no undocumented architectural decisions and correctly reuses existing infrastructure (`largestRemainder`, `TreeNode`, `DashboardState`). The approach of pure functions in `utils/` with a thin `useReducer` hook is sound and testable.

## Checklist
- [x] Consistent with existing ADRs
- [x] Event contracts maintained or properly extended
- [x] Component boundaries respected
- [x] Protocol conventions followed
- [x] No undocumented architectural decisions

## Detailed Review

### ADR Consistency

**ADR-0001 (React 19 + Vite 6 + TypeScript 5.7)**: The design uses `useReducer` (built-in React 19 hook), TypeScript strict mode conventions (no `any`, proper generics), and the established build/type-check pattern (`tsc --noEmit && vite build`). No new framework dependencies introduced. Consistent.

**ADR-0002 (Tailwind CSS v4)**: The design explicitly states "No JSX, no CSS, no Tailwind" for this task. No styling concerns are introduced. Not applicable but not violated.

**ADR-0003 (ESLint v8 legacy format)**: The design specifies `.ts` extensions for all new files (no `.tsx`), which avoids the `react-refresh/only-export-components` lint warning documented in the app CLAUDE.md. Verification step 9 includes `pnpm lint`. Consistent.

### Type Definition Conventions

- **Named exports only**: The design uses named exports throughout (`export function treeReducer`, `export function autoBalance`, `export type TreeAction`). Consistent with the project convention (no default exports except legacy `App.tsx`).
- **JSDoc**: The design includes JSDoc on the `TreeAction` union type and on `SiblingInfo`/`PercentageUpdate` interfaces. Consistent with the convention requiring JSDoc on all interfaces and type aliases.
- **String literal union over enum**: `TreeAction` uses string literal discriminants (`'SET_PERCENTAGE'`, `'TOGGLE_LOCK'`, etc.) rather than enums. Consistent with the project preference for string unions.
- **Barrel re-exports**: The design adds `export type { TreeAction } from './actions'` to `types/index.ts`, using the established `export type` syntax for the type-only barrel. Consistent.

### Data Conventions

- **Percentages as source of truth**: The design treats percentages as the source of truth and derives absolute values via `Math.round(parentAbsoluteValue * percentage / 100)` -- exactly matching the established convention in `architecture/overview.md` and `apps/labor-market-dashboard/CLAUDE.md`.
- **`largestRemainder` reuse**: The design imports and reuses `largestRemainder` from `@/data/dataHelpers` for all percentage rounding (with `target=100, decimals=1`). Consistent with the data convention that all sibling percentages must sum to exactly 100.0 at 1 decimal place.
- **Node ID scheme**: The design operates on `nodeId: string` throughout and uses `findNodeById`, `findParentById` helpers. It does not introduce any new ID conventions and respects the existing kebab-case scheme.
- **`defaultTree` treated as read-only**: The design uses `defaultTree` only in `initialState` for reset, never mutating it. Consistent with the convention that `defaultTree.ts` is purely static data.

### Component Boundaries

- **Utils layer (`src/utils/`)**: The design correctly places pure calculation logic in `utils/calculations.ts` and tree traversal helpers in `utils/treeUtils.ts`. This matches the planned module inventory in `architecture/overview.md` (which lists `calculations.ts` and `format.ts` under `src/utils/`).
- **Hooks layer (`src/hooks/`)**: The `useTreeState` hook is a thin wrapper around `useReducer`, consistent with the planned `useTreeState` in the module inventory. The design explicitly defers `useAutoBalance` to a future task, which is appropriate since the auto-balance logic is embedded in the reducer actions rather than being a separate hook.
- **Types layer (`src/types/`)**: New `actions.ts` file for the `TreeAction` discriminated union is a clean separation. The design correctly does not modify existing `tree.ts` types.
- **No UI leakage**: The design produces zero JSX, zero CSS, and zero DOM interaction. All output is pure functions and a React hook. This respects the boundary between state management and UI components (tasks 005-009).

### Test Conventions

- **Test directory structure**: All test files are placed in `src/__tests__/` mirroring the source structure (`__tests__/utils/calculations.test.ts`, `__tests__/utils/treeUtils.test.ts`, `__tests__/hooks/useTreeState.test.ts`). Consistent with the established convention.
- **`.ts` extension**: All test files use `.ts` (not `.tsx`) since they contain no JSX. Consistent.
- **Test strategy**: Tests call pure functions and the exported `treeReducer` directly, avoiding unnecessary React rendering. This follows the pattern of testing logic in isolation (matching the existing type-only tests in `__tests__/types/tree.test.ts`).
- **Vitest config**: The design relies on the existing `vitest.config.ts` with `environment: 'node'`, which is correct for non-DOM tests.

### Existing State Shape Compatibility

The design uses the existing `DashboardState` interface unchanged:
```typescript
interface DashboardState {
  totalPopulation: number;
  balanceMode: BalanceMode;
  tree: TreeNode;
}
```
This matches exactly what is defined in `src/types/tree.ts`. No modifications to existing types are required. The `initialState` derives `totalPopulation` from `defaultTree.absoluteValue` (13,500,000), which is consistent.

### Architecture Decision: `useReducer` over Zustand

The design documents using `useReducer` instead of Zustand per the user's decision (resolved Q4 in `task.md`). While `architecture/overview.md` lists "Zustand / useReducer" as the state management technology, the user has explicitly chosen `useReducer`. This is a valid narrowing of the original plan and does not contradict any ADR. The overview document should be updated during the arch-update stage to reflect this decision.

### Intermediate Types (`SiblingInfo`, `PercentageUpdate`)

The design co-locates `SiblingInfo` and `PercentageUpdate` interfaces in `utils/calculations.ts` rather than in `types/`. This is a reasonable decision: these are internal utility types used only by the calculation functions, not part of the public API surface. They include JSDoc annotations. This does not violate any convention.

### Performance

The design targets <16ms per dispatch for 55 nodes, with expected actual performance <2ms. The approach of always recalculating from root (O(55) nodes) rather than optimizing partial recalculation is justified by the small tree size. This meets NFR-01 (<100ms slider latency) documented in `architecture/overview.md`.

### Immutability Strategy

The design uses structural cloning (spread operator + recursive function) for immutable tree updates. This is the standard React pattern for `useReducer` state. For 55 nodes, the overhead is negligible. No external immutability library (like Immer) is introduced, keeping the zero-dependency approach consistent with the user's preference for `useReducer` over Zustand.

## Architecture Impact

This task establishes the state management pattern for the entire dashboard. Key architectural implications:

- **State management pattern is now `useReducer`** (not Zustand). The `architecture/overview.md` should be updated during arch-update to reflect this narrowed decision.
- **Auto-balance algorithm** becomes the core domain logic. Its implementation in pure functions (`utils/calculations.ts`) sets the pattern for future algorithmic additions.
- **Tree update pattern** (`updateNodeInTree`, `updateChildrenInTree`) establishes how all future tree mutations will work.
- **Action type pattern** (`TreeAction` discriminated union) sets the dispatch API for all UI components in tasks 005-009.

No new ADR is needed -- the choice of `useReducer` was a user decision that narrows an already-documented option, not a new architectural direction.
