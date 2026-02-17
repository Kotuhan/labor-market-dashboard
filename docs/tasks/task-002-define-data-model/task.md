---
id: task-002
title: Define TypeScript Data Model and Tree Structure
status: backlog
priority: high
dependencies: [task-001]
created_at: 2026-02-17
---

# Define TypeScript Data Model and Tree Structure

## Problem (PO)

Every subsequent feature in the Labor Market Dashboard -- sliders, pie charts, auto-balance logic, the default data tree, state management -- depends on a well-defined TypeScript data model. Without explicit, shared type definitions, developers will invent ad-hoc shapes for tree nodes, gender splits, and dashboard state, leading to inconsistencies that compound as the codebase grows.

From the user's perspective: "As an analyst, I need the dashboard to faithfully represent Ukraine's labor market as a 3-level tree (gender -> industry -> subcategory) with percentages, absolute values, and gender splits at every node. If the underlying data model is wrong or incomplete, every visualization and calculation built on top of it will be wrong too."

This is the critical-path dependency: task-001 (scaffolding) is done, and every remaining task (sliders, pie charts, state management, default data) is blocked until the data model is defined. Getting the model right now is cheap; changing it later means refactoring every consumer.

## Success Criteria (PO)

1. `pnpm build` succeeds with zero TypeScript errors across the monorepo.
2. Every field specified in PRD Section 5 (`TreeNode` and `DashboardState`) is present in the exported interfaces.
3. A developer can construct a 3-level tree (root -> gender -> industry -> subcategory) using only the defined types, with no `any` or type assertions required.
4. Gender split calculations and balance mode logic can be expressed using the defined utility types without additional type casts.
5. Importing types from `@/types/tree` works via the established `@` path alias and provides full IntelliSense.
6. Unit tests confirm that well-formed tree nodes compile and that malformed data is rejected by TypeScript (compile-time safety).

## Acceptance Criteria (PO)

### AC-01: TreeNode interface exists with all PRD fields

* Given the file `src/types/tree.ts` exists in the labor-market-dashboard app
  When a developer imports `TreeNode` from `@/types/tree`
  Then the interface contains all of: `id` (string), `label` (string), `percentage` (number), `absoluteValue` (number), `genderSplit` (object with `male` and `female` as numbers), `children` (TreeNode[]), `defaultPercentage` (number), `isLocked` (boolean)

### AC-02: DashboardState interface exists with all PRD fields

* Given the file `src/types/tree.ts` exists
  When a developer imports `DashboardState` from `@/types/tree`
  Then the interface contains: `totalPopulation` (number), `balanceMode` ('auto' | 'free'), `tree` (TreeNode)

### AC-03: Balance mode is a union type

* Given a variable typed as `DashboardState['balanceMode']`
  When assigned a value other than `'auto'` or `'free'`
  Then TypeScript reports a compile-time error

### AC-04: GenderSplit utility type

* Given a utility type or interface for gender split
  When used in TreeNode and in standalone calculations
  Then `male` and `female` are both required number fields (0-100 range semantically, enforced by runtime validation, not the type system)

### AC-05: Recursive tree construction compiles

* Given the TreeNode interface with `children: TreeNode[]`
  When a developer constructs a 3-level deep tree (root with gender children, each gender with industry children, each industry with subcategory children)
  Then the code compiles without errors and without type assertions

### AC-06: Types are re-exportable

* Given the types are defined in `src/types/tree.ts`
  When another module imports them via `@/types/tree`
  Then all exported types (`TreeNode`, `DashboardState`, `BalanceMode`, `GenderSplit`) are available

### AC-07: No `any` types used

* Given all type definitions in `src/types/`
  When reviewed or linted
  Then no `any` type appears anywhere in the type definitions

### AC-08: Build and lint pass

* Given the new type files are added
  When running `pnpm build` and `pnpm lint`
  Then both commands succeed with zero errors

## Out of Scope (PO)

- **Default data population**: The actual Ukraine labor market data (13.5M employed, 15+ industries, 75+ subcategories) belongs to a separate task for `src/data/defaultTree.ts`. This task defines the shape, not the content.
- **State management implementation**: Zustand store or useReducer hook. This task defines `DashboardState` as a type, not as a runtime store.
- **Auto-balance algorithm**: The `autoBalance()` function and slider redistribution logic. This task only ensures `isLocked` and `balanceMode` fields exist in the types.
- **Runtime validation**: Zod schemas, runtime range checks (e.g., percentage 0-100), or data sanitization. Types provide compile-time safety only.
- **UI components**: No React components, sliders, pie charts, or visual elements.
- **Gender split enforcement at type level**: The constraint that `male + female = 100` is a runtime invariant, not a TypeScript type constraint.
- **Percentage sum enforcement at type level**: The constraint that sibling percentages sum to 100% in auto-balance mode is a runtime concern.
- **Tree depth enforcement at type level**: The recursive `TreeNode` type does not restrict depth to exactly 3 levels.
- **Color or visualization fields**: Industry colors are a UI concern, not a core data model concern.

## Open Questions (PO)

* **Q1** (RESOLVED): Add optional `kvedCode?: string` field to TreeNode. KVED codes co-located with nodes.
* **Q2** (RESOLVED): Single root tree. One root node (Total 13.5M) with Male/Female as Level 1 children. Matches PRD spec.
* **Q3** (RESOLVED): `genderSplit` always required on every node. Uniform shape, no null checks.
* **Q4** (RESOLVED): Root node always has `percentage: 100` (convention). No optional fields.

---

## Technical Notes (TL)

- **Affected modules**: `apps/labor-market-dashboard/src/types/` (new directory)
- **New modules/entities to create**:
  - `apps/labor-market-dashboard/src/types/tree.ts` -- core type definitions (`TreeNode`, `GenderSplit`, `BalanceMode`, `DashboardState`)
  - `apps/labor-market-dashboard/src/types/index.ts` -- barrel export for all types
  - `apps/labor-market-dashboard/src/__tests__/types/tree.test.ts` -- type-safety tests
  - `apps/labor-market-dashboard/vitest.config.ts` -- Vitest test runner configuration
- **DB schema change required?** No. Frontend-only SPA with no database.
- **Architectural considerations**:
  - Single flat `TreeNode` interface (not discriminated union) per PRD Section 5. Recursive `children: TreeNode[]` keeps tree traversal generic.
  - `GenderSplit` extracted as standalone interface for reuse in standalone calculations (AC-04).
  - `BalanceMode` as string literal union type (`'auto' | 'free'`), not enum -- idiomatic for React state.
  - `kvedCode?: string` added per resolved Q1 -- optional because root and gender nodes have no KVED code.
  - `genderSplit` always required on every node per resolved Q3 -- uniform shape, no null checks.
  - Root node `percentage: 100` per resolved Q4 -- documented in JSDoc, enforced at runtime.
  - No `level`/`depth` field -- derivable at runtime, avoids sync issues. Can be added later if needed.
  - No `color` field -- UI concern, mapped externally.
- **Known risks or trade-offs**:
  - Low: `noUnusedLocals` may flag unused type imports in tests. Mitigated by `expectTypeOf` pattern that consumes types.
  - Low: Vitest not yet installed. Must add as devDependency (required for tests).
- **Test plan**: Unit tests using Vitest `expectTypeOf` for compile-time type assertions plus runtime construction tests. No integration tests needed.
- **Estimated effort**: 0.5 days
- **Risk level**: Low

## Implementation Steps (TL)

### Step 1 -- Install Vitest and configure test runner

- **Files**: `apps/labor-market-dashboard/package.json` (modify), `apps/labor-market-dashboard/vitest.config.ts` (create)
- **Details**:
  - Add `vitest` (^3.0.0) as devDependency.
  - Create `vitest.config.ts` with `@` path alias (reuse pattern from `vite.config.ts`).
  - Update `test` script from `echo "No tests yet" && exit 0` to `vitest run`.
- **Verification**: `pnpm install` succeeds; `pnpm test --filter @template/labor-market-dashboard` runs without errors.

### Step 2 -- Create type definitions file

- **Files**: `apps/labor-market-dashboard/src/types/tree.ts` (create)
- **Details**:
  - Define and export: `GenderSplit` (interface), `BalanceMode` (type alias), `TreeNode` (interface), `DashboardState` (interface).
  - Include JSDoc comments documenting resolved PO decisions (Q1-Q4).
  - Named exports only. No `any` type. No default exports.
  - See `insights/tl-design.md` "Type Definitions (Reference Design)" section for exact shapes.
- **Verification**: `pnpm build --filter @template/labor-market-dashboard` succeeds (tsc --noEmit passes).

### Step 3 -- Create barrel export

- **Files**: `apps/labor-market-dashboard/src/types/index.ts` (create)
- **Details**:
  - Re-export all types: `export type { TreeNode, DashboardState, BalanceMode, GenderSplit } from './tree';`
  - Use `export type` syntax (type-only re-exports).
- **Verification**: `pnpm build` still passes.

### Step 4 -- Write type-safety tests

- **Files**: `apps/labor-market-dashboard/src/__tests__/types/tree.test.ts` (create)
- **Details**:
  - Test 1 (AC-01, AC-05): Construct a valid 3-level tree. Verify it compiles without type assertions.
  - Test 2 (AC-02): Construct a valid `DashboardState`.
  - Test 3 (AC-03): `expectTypeOf<DashboardState['balanceMode']>().toEqualTypeOf<'auto' | 'free'>()`.
  - Test 4 (AC-04): Construct standalone `GenderSplit`, verify both fields required.
  - Test 5 (AC-06): Import all 4 types from `@/types/tree`, verify they are defined.
  - Test 6: Verify `kvedCode` is optional (can be omitted from valid `TreeNode`).
  - Test 7: Verify `children` accepts empty array (leaf) and populated array.
  - AC-07 (no `any`) verified by `pnpm lint`, not Vitest.
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes with all tests green.

### Step 5 -- Final verification: lint, test, build

- **Commands**: `pnpm lint`, `pnpm test`, `pnpm build`
- **Verification**: All three exit with code 0. No errors, no skipped tests.

---

## Implementation Log (DEV)

<!-- To be filled during implementation -->

---

## QA Notes (QA)

<!-- To be filled by QA agent -->
