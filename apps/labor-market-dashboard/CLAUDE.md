# Labor Market Dashboard

React + Vite + TypeScript + Tailwind CSS v4 single-page application.

**Package**: `@template/labor-market-dashboard`

## Tech Stack

- React 19, Vite 6, TypeScript 5.7 (strict)
- Tailwind CSS v4 (CSS-first config, `@tailwindcss/vite` plugin)
- ESLint v8 legacy format (`.eslintrc.cjs`)

## Commands

```bash
pnpm dev --filter @template/labor-market-dashboard   # Dev server (Vite, http://localhost:5173)
pnpm build --filter @template/labor-market-dashboard  # Type-check + bundle
pnpm lint --filter @template/labor-market-dashboard   # ESLint
```

## App Structure

```
apps/labor-market-dashboard/
  index.html              # HTML entry point (lang="uk")
  vite.config.ts          # Vite config (react + tailwindcss plugins, @ alias)
  vitest.config.ts        # Vitest config (separate from vite, @ alias, node env)
  tsconfig.json           # Extends @template/config/typescript/react
  tsconfig.node.json      # For vite.config.ts + vitest.config.ts
  .eslintrc.cjs           # Extends @template/config/eslint/react
  package.json            # type: "module", @template/config as workspace:*
  src/
    main.tsx              # React entry point (StrictMode)
    App.tsx               # Root component
    App.css               # App-specific styles (placeholder)
    index.css             # Tailwind entry: @import "tailwindcss"
    vite-env.d.ts         # Vite client type declarations
    types/
      tree.ts             # Core data model: TreeNode, GenderSplit, BalanceMode, DashboardState
      actions.ts          # TreeAction discriminated union (5 action types for useReducer)
      index.ts            # Barrel re-export (export type)
    data/
      defaultTree.ts      # Complete TreeNode tree constant (55 nodes, ~600 lines)
      dataHelpers.ts      # largestRemainder() utility (Hamilton's method rounding)
      index.ts            # Barrel re-export (value exports)
    utils/
      treeUtils.ts        # Immutable tree traversal/update helpers, SiblingInfo interface
      calculations.ts     # Auto-balance, normalization, recalc, deviation, lock guard
      index.ts            # Barrel re-export (value + type exports)
    hooks/
      useTreeState.ts     # useReducer-based state management (treeReducer + useTreeState hook)
      index.ts            # Barrel re-export
    __tests__/
      types/
        tree.test.ts      # Type-safety tests (expectTypeOf + runtime construction)
      data/
        defaultTree.test.ts  # 26 tests: structure, math, completeness, DashboardState
        dataHelpers.test.ts  # 8 tests: largestRemainder edge cases
      utils/
        treeUtils.test.ts    # 15 tests: find, update, immutability, sibling info
        calculations.test.ts # 28 tests: auto-balance, normalize, recalc, deviation, lock guard
      hooks/
        useTreeState.test.ts # 19 tests: all 5 actions, cascading recalc, performance
```

## Key Patterns

### Path Alias

`@` resolves to `./src` via both `vite.config.ts` (runtime) and `tsconfig.json` (type-checking):

```typescript
import { Something } from '@/components/Something';
```

### Tailwind CSS v4 (CSS-First Config)

Tailwind v4 uses CSS-first configuration. There is **no `tailwind.config.js`**. All config goes through CSS:

```css
/* src/index.css */
@import "tailwindcss";

/* Custom theme values use @theme directive, NOT a JS config file */
```

The `@tailwindcss/vite` plugin handles compilation (not PostCSS).

### Build Script

The build script is `tsc --noEmit && vite build` (type-check then bundle).

### Shared Configs

- TypeScript: `tsconfig.json` extends `@template/config/typescript/react`
- ESLint: `.eslintrc.cjs` extends `@template/config/eslint/react` via `require.resolve()`
- Both reference `tsconfig.node.json` for Vite config file linting

## Data Model

The core data model lives in `src/types/tree.ts`. Key design decisions:

- **Single recursive `TreeNode` interface** (not discriminated union) -- tree levels (root, gender, industry, subcategory) share the same shape. Level-specific logic is handled at runtime, not type level.
- **`BalanceMode`** is a string literal union (`'auto' | 'free'`), not an enum -- idiomatic for React state (`useState<BalanceMode>`).
- **`genderSplit`** is always required on every node (no optional/null) -- uniform shape avoids null checks.
- **`kvedCode?: string`** is the only optional field -- root and gender nodes have no KVED code.
- **`children: TreeNode[]`** -- empty array `[]` for leaf nodes, not `undefined` or `null`.
- Runtime constraints (percentage 0-100, male + female = 100, sibling percentages sum to 100 in auto mode) are NOT enforced at the type level.
- Barrel re-export in `types/index.ts` uses `export type { ... }` syntax (type-only, zero runtime JS).

## Default Data (`src/data/`)

The `defaultTree` constant provides Ukraine's labor market data as a pre-computed, hardcoded `TreeNode` literal. No runtime calculation, no builder pattern -- explicit literals for auditability.

### Tree Shape

- **55 nodes total**: 1 root + 2 gender + 32 industry (16 per gender) + 20 IT subcategories (10 per gender)
- **Root**: 13,500,000 employed, genderSplit `{ male: 52.66, female: 47.34 }` (derived from weighted industry data)
- **Gender nodes**: Male 52.66% / Female 47.34%
- **Industries**: 16 KVED sectors per gender, only IT (KVED J) has Level 3 children
- **IT subcategories**: 10 per gender (Розробка ПЗ, QA, PM, HR, DevOps, Аналітики, UI/UX, Data/ML, Маркетинг, Інші ролі)

### `largestRemainder(values, target, decimals)`

Exported from `dataHelpers.ts`. Rounds an array so values sum to exactly `target` using Hamilton's method (floor, then distribute remaining units by largest fractional remainder). Used for auto-balance logic in task-004.

### Barrel Export Convention

`data/index.ts` uses **value exports** (not `export type`), because `defaultTree` and `largestRemainder` are runtime values:
```typescript
export { defaultTree } from './defaultTree';
export { largestRemainder } from './dataHelpers';
```

Contrast with `types/index.ts` which uses `export type { ... }` for type-only re-exports.

### DO NOT

- Modify `defaultTree` values without re-running largest-remainder normalization across the affected sibling group -- percentages must sum to exactly 100.0
- Use the PRD's rounded 52/48 gender split -- use the derived 52.66/47.34 (see task-003 Q6 resolution)
- Add runtime calculation logic to `defaultTree.ts` -- it is purely static data; computation belongs in `utils/` or `hooks/`
- Use `absoluteValue` as source of truth -- `percentage` is the source of truth; absolute values are derived via `Math.round(parent.absoluteValue * percentage / 100)`

## State Management (`src/hooks/`, `src/utils/`)

The dashboard uses React `useReducer` (not Zustand) for all state management. The architecture follows a strict layered pattern:

```
useTreeState (thin hook)  -->  treeReducer (exported, testable)  -->  pure utility functions (utils/)
```

### Key Design Decisions

- **`treeReducer` is exported as a named function** for direct unit testing without React rendering (`renderHook` is not needed)
- **`initialState` is exported** for test assertions and reference equality checks
- **All tree mutations are immutable** -- recursive clone via spread operator, no structural sharing (negligible cost for 55 nodes)
- **Always recalculate absolute values from root** after any percentage change -- simplicity over optimization (<1ms for 55 nodes)
- **Locks persist across mode switches** -- `SET_BALANCE_MODE` does not clear locks

### Action Types (`src/types/actions.ts`)

5 actions as a discriminated union on `type` field:
- `SET_PERCENTAGE` -- triggers auto-balance (auto mode) or single-node update (free mode)
- `TOGGLE_LOCK` -- with lock guard (`canToggleLock` prevents locking the last unlocked sibling)
- `SET_BALANCE_MODE` -- free-to-auto normalizes all sibling groups to 100%
- `SET_TOTAL_POPULATION` -- recalculates all absolute values, percentages unchanged
- `RESET` -- returns `initialState` (reference to `defaultTree`)

### Utils Module (`src/utils/`)

Two files with distinct responsibilities:

- **`treeUtils.ts`**: Tree traversal and immutable update helpers (`findNodeById`, `findParentById`, `updateNodeInTree`, `updateChildrenInTree`, `collectSiblingInfo`). Also defines `SiblingInfo` interface.
- **`calculations.ts`**: Pure mathematical functions (`autoBalance`, `normalizeGroup`, `recalcAbsoluteValues`, `getSiblingDeviation`, `canToggleLock`). Also defines `PercentageUpdate` interface.

Interfaces (`SiblingInfo`, `PercentageUpdate`) are co-located with the functions that produce/consume them in `utils/`, not in `types/`. The barrel `utils/index.ts` re-exports them with `export type { ... }`.

### Barrel Export Convention (hooks/ and utils/)

`hooks/index.ts` uses **value exports** (runtime functions):
```typescript
export { initialState, treeReducer, useTreeState } from './useTreeState';
```

`utils/index.ts` uses **mixed exports** -- value exports for functions, `export type` for interfaces:
```typescript
export { autoBalance, canToggleLock, ... } from './calculations';
export type { PercentageUpdate } from './calculations';
```

### Auto-Balance Algorithm Summary

1. Separate locked, changed, and unlocked siblings
2. Clamp changed value to `[0, 100 - lockedSum]`
3. Distribute remaining to unlocked: proportionally if `oldUnlockedSum > 0`, equally if all at 0%
4. Apply `largestRemainder(allRaw, 100, 1)` for exact 100.0 sum

### DO NOT (State Management)

- Use `toBe(0)` for floating-point deviation checks -- use `toBeCloseTo(0, 1)` instead. `Math.round(-0.01 * 10) / 10` produces `-0` in JavaScript, which fails strict `toBe(0)` equality
- Put `SiblingInfo` or `PercentageUpdate` in `types/` -- they belong in `utils/` co-located with their producing functions
- Test `useTreeState` hook via `renderHook` -- test `treeReducer` directly instead (faster, no React dependency)
- Forget to recalculate absolute values after any percentage change -- the reducer always calls `recalcTreeFromRoot` after mutations

## Vitest Setup

Vitest is configured via a **separate `vitest.config.ts`** (not merged into `vite.config.ts`):

- Import `defineConfig` from `vitest/config` (not `vite`) for proper `test` field typing
- `@` path alias must be replicated from `vite.config.ts` (they do not share config)
- `globals: false` -- tests must explicitly import `describe`, `it`, `expect` from `vitest`
- `environment: 'node'` for non-DOM tests; change to `'jsdom'` when adding React Testing Library tests
- Do NOT include `react()` or `tailwindcss()` plugins in vitest config -- unnecessary for tests

### Test Directory Convention

Tests live in `src/__tests__/` mirroring the source structure:

```
src/types/tree.ts          -->  src/__tests__/types/tree.test.ts
src/data/defaultTree.ts    -->  src/__tests__/data/defaultTree.test.ts
src/data/dataHelpers.ts    -->  src/__tests__/data/dataHelpers.test.ts
src/utils/treeUtils.ts     -->  src/__tests__/utils/treeUtils.test.ts
src/utils/calculations.ts  -->  src/__tests__/utils/calculations.test.ts
src/hooks/useTreeState.ts  -->  src/__tests__/hooks/useTreeState.test.ts
```

### Type-Only Testing Pattern

For compile-time type assertions, use Vitest's `expectTypeOf`:

```typescript
import { expectTypeOf } from 'vitest';
import type { TreeNode } from '@/types/tree';

// Verify type shape
expectTypeOf<TreeNode>().toHaveProperty('id');

// Verify exact union type
expectTypeOf<BalanceMode>().toEqualTypeOf<'auto' | 'free'>();

// Verify type is not never (exists and is importable)
expectTypeOf<TreeNode>().not.toBeNever();
```

Use `import type` for type-only imports in test files. The `expectTypeOf` pattern consumes the type reference, satisfying `noUnusedLocals`.

## DO NOT

- Use `tsc -b` (project build mode) -- it emits `.d.ts.map` and `.js.map` files even with `noEmit` in referenced projects, polluting the directory. Use `tsc --noEmit` instead.
- Add `"references"` to `tsconfig.json` -- unnecessary without `tsc -b` and causes emit pollution
- Create a `tailwind.config.js` -- Tailwind v4 uses CSS-first config via `@import "tailwindcss"` and `@theme` directive
- Create a `postcss.config.js` -- the `@tailwindcss/vite` plugin replaces PostCSS for Vite projects
- Forget `@types/node` in devDependencies -- needed for `vite.config.ts` to resolve Node.js built-ins (`path`, `__dirname`)
- Forget to add new root-level config files (like `vitest.config.ts`) to `tsconfig.node.json` `include` array -- ESLint will fail to parse them otherwise
- Use `.tsx` extension for files that contain no JSX (e.g., type definitions, utilities) -- triggers `react-refresh/only-export-components` lint warning
- Use `enum` for small fixed sets of string values -- use string literal union types instead (e.g., `type BalanceMode = 'auto' | 'free'`)
