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
      index.ts            # Barrel re-export (export type)
    __tests__/
      types/
        tree.test.ts      # Type-safety tests (expectTypeOf + runtime construction)
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
src/utils/calculations.ts  -->  src/__tests__/utils/calculations.test.ts  (future)
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
