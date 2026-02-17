# PO Analysis: task-002
Generated: 2026-02-17

## Problem Statement

Every subsequent feature in the Labor Market Dashboard -- sliders, pie charts, auto-balance logic, the default data tree, state management -- depends on a well-defined TypeScript data model. Without explicit, shared type definitions, developers will invent ad-hoc shapes for tree nodes, gender splits, and dashboard state, leading to inconsistencies that compound as the codebase grows.

From the user's perspective: "As an analyst, I need the dashboard to faithfully represent Ukraine's labor market as a 3-level tree (gender -> industry -> subcategory) with percentages, absolute values, and gender splits at every node. If the underlying data model is wrong or incomplete, every visualization and calculation built on top of it will be wrong too."

This task is important NOW because:
- Task-001 (project scaffolding) is complete and the app shell is ready.
- Every remaining task (sliders, pie charts, state management, default data) is blocked until the data model is defined.
- Getting the model right at this stage is cheap; changing it later means refactoring every consumer.

If we do nothing: each feature team would define its own ad-hoc types, leading to duplicate definitions, type mismatches, and costly rework when integrating components.

## Success Criteria

1. **Type compilation**: `pnpm build` succeeds with zero TypeScript errors across the monorepo.
2. **Interface completeness**: Every field specified in PRD Section 5 (`TreeNode` and `DashboardState`) is present in the exported interfaces.
3. **Tree traversability**: A developer can construct a 3-level tree (root -> gender -> industry -> subcategory) using only the defined types, with no `any` or type assertions required.
4. **Utility type coverage**: Gender split calculations and balance mode logic can be expressed using the defined utility types without additional type casts.
5. **Developer ergonomics**: Importing types from `@/types/tree` works via the established `@` path alias and provides full IntelliSense in VS Code.
6. **Test validation**: Unit tests confirm that well-formed tree nodes compile and that malformed data is rejected by TypeScript (compile-time safety).

## Acceptance Criteria

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

## Out of Scope

The following are explicitly NOT part of this task:

- **Default data population**: The actual Ukraine labor market data (13.5M employed, 15+ industries, 75+ subcategories) belongs to a separate task for `src/data/defaultTree.ts`. This task defines the shape, not the content.
- **State management implementation**: Zustand store or useReducer hook implementation. This task defines `DashboardState` as a type, not as a runtime store.
- **Auto-balance algorithm**: The `autoBalance()` function and slider redistribution logic. This task only ensures `isLocked` and `balanceMode` fields exist in the types.
- **Runtime validation**: Zod schemas, runtime range checks (e.g., percentage 0-100), or data sanitization. Types provide compile-time safety only.
- **UI components**: No React components, sliders, pie charts, or visual elements.
- **Gender split enforcement at type level**: The constraint that `male + female = 100` is a runtime invariant, not a TypeScript type constraint. The types define both as `number`.
- **Percentage sum enforcement at type level**: The constraint that sibling percentages sum to 100% in auto-balance mode is a runtime concern.
- **Tree depth enforcement at type level**: The recursive `TreeNode` type does not restrict depth to exactly 3 levels. Depth is a data concern, not a type concern.
- **KVED code field**: The PRD data tables include KVED codes (A, B-E, G, etc.) but the PRD's TypeScript interface in Section 5 does not include a `kvedCode` field. Whether to add it is an open question.
- **Color field**: The PRD defines a color palette for industries but the TreeNode interface does not include a `color` field. Visualization-specific fields are out of scope for the core data model.

## Open Questions

* **Q1**: The PRD's `TreeNode` interface does not include a `kvedCode` field, yet the data tables heavily reference KVED sector codes (A, B-E, G, etc.). Should the data model include an optional `kvedCode?: string` field on TreeNode, or should KVED codes live only in the default data layer (e.g., as comments or a separate mapping)? --> Owner: **PO (User)**

* **Q2**: The PRD's `DashboardState` has `tree: TreeNode` (a single root). But the UI wireframe shows the root level as "Total employed" with two children (Male/Female). Should the root `TreeNode` represent the total population (with gender nodes as children), or should `DashboardState` hold two separate trees (one per gender)? The PRD Section 5 implies a single root, but this affects state management design. --> Owner: **PO (User)**

* **Q3**: The `genderSplit` field exists on every `TreeNode`, including Level 3 subcategories. At the gender level (Level 1), the `genderSplit` is redundant (a "Male" node is 100% male). Should `genderSplit` be optional (`genderSplit?: GenderSplit`) to avoid meaningless data at the gender level, or should it always be present for uniformity? --> Owner: **PO (User)**

* **Q4**: Should the `percentage` field on the root node have a defined semantic? For non-root nodes, `percentage` means "share of parent." For the root, there is no parent. Should root always have `percentage: 100`, or should this field be optional for the root? --> Owner: **TL (to recommend, User to decide)**

## Recommendations

- **For TL**: Consider whether `TreeNode` should use a discriminated union pattern (e.g., `RootNode | GenderNode | IndustryNode | SubcategoryNode`) for stronger typing at each level, versus the simpler single-interface approach from the PRD. The single interface is more flexible for recursive operations; the discriminated union is safer for level-specific logic.
- **For TL**: Consider adding a `level: number` or `depth: number` field to TreeNode for easier runtime traversal and conditional rendering (e.g., showing different UI at each tree depth).
- **For DEV**: Export all types as named exports (not default exports) for better tree-shaking and IntelliSense.
- **For QA**: Type-level tests can be written using `expectTypeOf` from Vitest to verify compile-time correctness without runtime assertions.
