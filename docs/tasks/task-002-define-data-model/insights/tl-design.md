# Technical Design: task-002
Generated: 2026-02-17

## Overview

Define the core TypeScript data model for the Labor Market Dashboard: `TreeNode`, `GenderSplit`, `BalanceMode`, and `DashboardState` interfaces/types in `src/types/tree.ts`. This is a type-only task -- no runtime code, no UI components, no state management. The deliverable is a single `.ts` file with exported types, plus Vitest setup and a type-safety test file. All 4 PO open questions have been resolved and their decisions are incorporated into the design below.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/src/types/` (new directory)
- **New modules/entities to create**:
  - `apps/labor-market-dashboard/src/types/tree.ts` -- core type definitions
  - `apps/labor-market-dashboard/src/types/index.ts` -- barrel export
  - `apps/labor-market-dashboard/src/__tests__/types/tree.test.ts` -- type-safety tests
  - `apps/labor-market-dashboard/vitest.config.ts` -- Vitest configuration
- **DB schema change required?** No. This is a frontend-only SPA with no database.
- **Architectural considerations**:
  - Single flat `TreeNode` interface (not discriminated union) per PRD Section 5. Recursive children pattern keeps tree traversal generic.
  - `GenderSplit` extracted as standalone interface for reuse in standalone calculations (AC-04).
  - `BalanceMode` as a string literal union type (not enum) for simpler usage with React state.
  - `kvedCode?: string` added per resolved Q1 -- optional because not all nodes represent KVED sectors (e.g., root, gender nodes).
  - `genderSplit` is always required on every node per resolved Q3 -- uniform shape, no null checks needed.
  - Root node convention: `percentage: 100` per resolved Q4 -- documented in JSDoc, enforced at runtime (not type level).
- **Known risks or trade-offs**:
  - **Low risk**: `noUnusedLocals` may flag unused type imports in test files. Mitigation: use `expectTypeOf` pattern which consumes types, or use `// @ts-expect-error` for negative tests.
  - **Low risk**: Vitest not yet installed. Must add as devDependency in this task (required for AC-08 test step).
- **Test plan**: Unit tests using Vitest `expectTypeOf` for compile-time type assertions plus runtime construction tests. No integration tests needed (type-only task).

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Single `TreeNode` interface (not discriminated union) | PRD Section 5 defines a single recursive interface. Simpler for tree traversal algorithms (auto-balance, recalculation). Level-specific logic can use the `children` length or a future `level` field at runtime. | Discriminated union (`RootNode \| GenderNode \| IndustryNode \| SubcategoryNode`) -- rejected because it complicates recursive functions and the PRD does not require level-specific type safety. |
| `GenderSplit` as a standalone exported interface | AC-04 requires it for standalone calculations. Also makes `TreeNode` definition cleaner. | Inline `{ male: number; female: number }` in TreeNode -- rejected for reusability. |
| `BalanceMode` as string literal union type | Lighter than enum, works naturally with React state (`useState<BalanceMode>`), and is the idiomatic TypeScript approach for small fixed sets. | `enum BalanceMode { Auto = 'auto', Free = 'free' }` -- rejected because enums create runtime objects and are less ergonomic with state management. |
| `kvedCode` as optional field on TreeNode | Resolved Q1: co-locate with node. Optional because root and gender nodes have no KVED code. Avoids a separate mapping structure. | Separate `Record<string, string>` mapping -- rejected by PO decision. |
| No `level` or `depth` field on TreeNode | PO recommendation noted it, but PRD does not include it and it is derivable at runtime from tree position. Adding it would create a redundancy that must be kept in sync. Can be added in a future task if needed. | Adding `level: 0 \| 1 \| 2 \| 3` -- deferred. |
| No `color` field on TreeNode | Explicitly out of scope per PO analysis. Colors are a UI concern mapped externally. | -- |
| Vitest setup included in this task | AC-08 requires tests to pass. Current test script is `echo "No tests yet"`. Vitest must be installed and configured for type-safety tests to run. | Defer Vitest setup to a separate task -- rejected because this task's acceptance criteria require passing tests. |
| `.ts` file (not `.tsx`) for types | Type definitions do not contain JSX. Using `.ts` avoids the `react-refresh/only-export-components` lint warning that would fire on a `.tsx` file exporting non-component values. | -- |

## Type Definitions (Reference Design)

The developer should implement the following types in `src/types/tree.ts`:

```typescript
/**
 * Gender split percentages. Both fields are required (resolved Q3).
 * Semantic constraint: male + female = 100 (enforced at runtime, not type level).
 */
export interface GenderSplit {
  male: number;   // 0-100
  female: number; // 0-100
}

/**
 * Balance mode for slider behavior.
 * 'auto' = siblings rebalance to sum 100%
 * 'free' = each slider independent
 */
export type BalanceMode = 'auto' | 'free';

/**
 * A node in the labor market tree structure.
 *
 * Tree levels:
 * - Level 0 (Root): Total employed population. percentage = 100 (convention, resolved Q4).
 * - Level 1 (Gender): Male / Female. percentage = share of root.
 * - Level 2 (Industry): KVED sectors. percentage = share of gender parent.
 * - Level 3 (Subcategory): Detailed breakdowns. percentage = share of industry parent.
 *
 * @example
 * const root: TreeNode = {
 *   id: 'root',
 *   label: 'Total Employed',
 *   percentage: 100,
 *   absoluteValue: 13_500_000,
 *   genderSplit: { male: 52, female: 48 },
 *   children: [maleNode, femaleNode],
 *   defaultPercentage: 100,
 *   isLocked: false,
 * };
 */
export interface TreeNode {
  id: string;
  label: string;
  percentage: number;          // 0-100, share of parent node
  absoluteValue: number;       // Computed from parent's absoluteValue * (percentage / 100)
  genderSplit: GenderSplit;    // Always required (resolved Q3)
  children: TreeNode[];        // Empty array for leaf nodes
  defaultPercentage: number;   // Original value for reset functionality
  isLocked: boolean;           // Whether this node is locked during auto-balance
  kvedCode?: string;           // Optional KVED sector code (resolved Q1), e.g. "A", "B-E", "G"
}

/**
 * Top-level dashboard state.
 * Contains a single root tree (resolved Q2).
 */
export interface DashboardState {
  totalPopulation: number;     // Default: 13_500_000
  balanceMode: BalanceMode;
  tree: TreeNode;              // Single root node (resolved Q2)
}
```

## Implementation Steps

### Step 1 -- Install Vitest and configure test runner

- **Files to create/modify**:
  - `apps/labor-market-dashboard/package.json` (add `vitest` devDependency)
  - `apps/labor-market-dashboard/vitest.config.ts` (new file)
  - `apps/labor-market-dashboard/package.json` `test` script (update from echo to `vitest run`)
- **Details**:
  - Install `vitest` as devDependency: add `"vitest": "^3.0.0"` to devDependencies.
  - Create `vitest.config.ts` that references the `@` path alias (reuse from `vite.config.ts` pattern).
  - Update the `test` script in `package.json` from `echo "No tests yet" && exit 0` to `vitest run`.
  - Verify Vitest is recognized by running `pnpm test --filter @template/labor-market-dashboard` (should report "no test files found" at this stage, but the command itself should succeed or exit cleanly).
- **Verification**: `pnpm install` succeeds; `vitest --version` works; `pnpm test` exits without errors.

### Step 2 -- Create type definitions file

- **Files to create**:
  - `apps/labor-market-dashboard/src/types/tree.ts`
- **Details**:
  - Define and export: `GenderSplit` (interface), `BalanceMode` (type alias), `TreeNode` (interface), `DashboardState` (interface).
  - Follow the reference design above exactly.
  - Include JSDoc comments documenting each interface and the resolved PO decisions (Q1-Q4).
  - Use named exports only (no default exports).
  - No `any` type anywhere.
- **Verification**: `pnpm build --filter @template/labor-market-dashboard` succeeds (tsc --noEmit passes).

### Step 3 -- Create barrel export

- **Files to create**:
  - `apps/labor-market-dashboard/src/types/index.ts`
- **Details**:
  - Re-export all types from `./tree`: `export type { TreeNode, DashboardState, BalanceMode, GenderSplit } from './tree';`
  - Use `export type` syntax (type-only re-exports) since these are all types/interfaces.
- **Verification**: A hypothetical `import { TreeNode } from '@/types'` would resolve correctly. `pnpm build` still passes.

### Step 4 -- Write type-safety tests

- **Files to create**:
  - `apps/labor-market-dashboard/src/__tests__/types/tree.test.ts`
- **Details**:
  - **Test 1 (AC-01, AC-05)**: Construct a valid 3-level tree (root -> gender -> industry -> subcategory) using `TreeNode`. Assert it compiles without type assertions. Use `expectTypeOf` to confirm the constructed object satisfies `TreeNode`.
  - **Test 2 (AC-02)**: Construct a valid `DashboardState` with `totalPopulation`, `balanceMode`, and `tree`. Assert it compiles.
  - **Test 3 (AC-03)**: Use `expectTypeOf<DashboardState['balanceMode']>().toEqualTypeOf<'auto' | 'free'>()` to verify the union type.
  - **Test 4 (AC-04)**: Construct a standalone `GenderSplit` object and verify both `male` and `female` are required numbers.
  - **Test 5 (AC-06)**: Import all 4 exported types from `@/types/tree` and verify they are defined (not `never`).
  - **Test 6 (AC-07)**: This is a lint rule (`no-explicit-any`), verified by `pnpm lint`, not by Vitest. Document this in the test file as a comment.
  - **Test 7**: Verify `kvedCode` is optional (can be omitted from a valid `TreeNode`).
  - **Test 8**: Verify `children` accepts empty array (leaf node) and populated array.
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes with all tests green.

### Step 5 -- Verification: run lint, test, and build

- **Commands**:
  - `pnpm lint` -- must pass with zero errors
  - `pnpm test` -- must pass with all tests green, no skips
  - `pnpm build` -- must pass with zero errors
- **Verification**: All three commands exit with code 0.

## Complexity Assessment

- **Estimated effort**: 0.5 days (half a day)
- **Risk level**: Low
- **Dependencies**: task-001 (project scaffolding) -- already completed
- **Rationale**: This task creates a single `.ts` type file, a barrel export, a Vitest config, and a test file. No runtime logic, no state management, no UI. The main effort is in Vitest setup (Step 1) and thorough type-safety tests (Step 4).

## Test Strategy

- **Unit tests**: Type-safety tests using Vitest `expectTypeOf` (compile-time assertions) and runtime object construction (runtime assertions). See Step 4 for full test list.
- **Integration tests**: Not needed. Type definitions have no runtime behavior to integrate.
- **E2E tests**: Not applicable.
- **Lint verification**: `pnpm lint` verifies AC-07 (no `any` types) via the `@typescript-eslint/no-explicit-any: "error"` rule.

## Open Technical Questions

None. All PO open questions (Q1-Q4) are resolved. No new technical questions were discovered during design.
