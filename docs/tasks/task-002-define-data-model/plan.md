# Implementation Plan: task-002 -- Define TypeScript Data Model

Generated: 2026-02-17

## Overview

This task creates the core TypeScript data model for the Labor Market Dashboard. It is a type-only task with no runtime logic or UI components. The deliverables are:

1. Vitest test runner setup (first in the monorepo)
2. Type definitions file (`TreeNode`, `GenderSplit`, `BalanceMode`, `DashboardState`)
3. Barrel export file
4. Type-safety tests
5. Full verification (lint, test, build)

All 4 PO open questions (Q1-Q4) are resolved and incorporated into the types below.

---

## File-by-File Changes

### File 1: `apps/labor-market-dashboard/package.json` (MODIFY)

**Purpose**: Add `vitest` devDependency and update the `test` script.

**Changes**:
- Add `"vitest": "^3.0.0"` to `devDependencies`
- Change `test` script from `echo "No tests yet" && exit 0` to `vitest run`

**Exact content after modification**:

```json
{
  "name": "@template/labor-market-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "lint": "eslint .",
    "test": "vitest run",
    "clean": "rm -rf dist node_modules .turbo"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@template/config": "workspace:*",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.7.3",
    "vite": "^6.0.0",
    "eslint": "^8.57.0",
    "vitest": "^3.0.0"
  }
}
```

**Key notes**:
- `vitest` is added as the last entry in `devDependencies` (alphabetical order is not strictly required in JSON, but placing it last avoids unnecessary diffs).
- After modifying `package.json`, run `pnpm install` from the monorepo root to update `pnpm-lock.yaml`.

---

### File 2: `apps/labor-market-dashboard/vitest.config.ts` (CREATE)

**Purpose**: Configure Vitest with the `@` path alias, matching the existing `vite.config.ts` pattern.

**Exact content**:

```typescript
import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
  },
});
```

**Key notes**:
- Uses `vitest/config` instead of `vite` for the `defineConfig` import -- this is the Vitest-idiomatic approach and provides proper typing for the `test` field.
- The `@` path alias is replicated from `vite.config.ts` (line 11-13) so that `@/types/tree` resolves correctly in test files.
- `globals: false` means tests must explicitly import `describe`, `it`, `expect` from `vitest`. This is explicit and avoids global namespace pollution.
- `environment: 'node'` is appropriate because this task has no DOM-dependent tests (type-only tests). Future tasks with React Testing Library will need `'jsdom'`.
- Do NOT include `react()` or `tailwindcss()` plugins here -- Vitest does not need them for type-only tests, and including them would add unnecessary build overhead.
- This file must be included in `tsconfig.node.json` (see File 3).

---

### File 3: `apps/labor-market-dashboard/tsconfig.node.json` (MODIFY)

**Purpose**: Add `vitest.config.ts` to the `include` array so TypeScript can type-check it.

**Current content**:
```json
{
  "extends": "@template/config/typescript/base",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "declaration": false,
    "declarationMap": false,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

**Exact content after modification** (only `include` changes):

```json
{
  "extends": "@template/config/typescript/base",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "declaration": false,
    "declarationMap": false,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

**Key notes**:
- Without this change, ESLint's `parserOptions.project` (which references `tsconfig.node.json`) would not cover `vitest.config.ts`, potentially causing lint errors.
- The `.eslintrc.cjs` already lists `"./tsconfig.node.json"` in `parserOptions.project`, so no ESLint config change is needed.

---

### File 4: `apps/labor-market-dashboard/src/types/tree.ts` (CREATE)

**Purpose**: Core type definitions -- `GenderSplit`, `BalanceMode`, `TreeNode`, `DashboardState`.

**Exact content**:

```typescript
/**
 * Gender split percentages. Both fields are required (resolved Q3).
 * Semantic constraint: male + female = 100 (enforced at runtime, not type level).
 */
export interface GenderSplit {
  /** Percentage of male workers (0-100) */
  male: number;
  /** Percentage of female workers (0-100) */
  female: number;
}

/**
 * Balance mode for slider behavior.
 * - 'auto': siblings rebalance to maintain 100% sum
 * - 'free': each slider operates independently
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
  /** Unique identifier for the node */
  id: string;
  /** Display label for the node */
  label: string;
  /** Share of parent node (0-100). Root node uses 100 by convention. */
  percentage: number;
  /** Computed absolute value: parent.absoluteValue * (percentage / 100) */
  absoluteValue: number;
  /** Gender split percentages. Always required on every node (resolved Q3). */
  genderSplit: GenderSplit;
  /** Child nodes. Empty array for leaf nodes. */
  children: TreeNode[];
  /** Original percentage value for reset functionality */
  defaultPercentage: number;
  /** Whether this node is locked during auto-balance redistribution */
  isLocked: boolean;
  /** Optional KVED sector code (resolved Q1), e.g. "A", "B-E", "G" */
  kvedCode?: string;
}

/**
 * Top-level dashboard state.
 * Contains a single root tree (resolved Q2).
 */
export interface DashboardState {
  /** Total employed population. Default: 13_500_000 */
  totalPopulation: number;
  /** Current slider balance mode */
  balanceMode: BalanceMode;
  /** Single root node of the labor market tree (resolved Q2) */
  tree: TreeNode;
}
```

**Key notes**:
- File extension is `.ts` (not `.tsx`) -- no JSX, avoids `react-refresh/only-export-components` lint warning.
- Named exports only, no default export.
- No `any` type anywhere.
- JSDoc comments document all resolved PO decisions (Q1-Q4).
- `kvedCode` is the only optional field (`?`). All other fields are required.
- `children: TreeNode[]` enables recursive tree structure. Empty `[]` for leaf nodes.

---

### File 5: `apps/labor-market-dashboard/src/types/index.ts` (CREATE)

**Purpose**: Barrel export using type-only re-exports.

**Exact content**:

```typescript
export type {
  BalanceMode,
  DashboardState,
  GenderSplit,
  TreeNode,
} from './tree';
```

**Key notes**:
- Uses `export type { ... }` syntax -- these are type-only re-exports that produce zero runtime JavaScript.
- Alphabetical ordering of exports for consistency.
- Consumers can import via `@/types` (barrel) or `@/types/tree` (direct).

---

### File 6: `apps/labor-market-dashboard/src/__tests__/types/tree.test.ts` (CREATE)

**Purpose**: Type-safety tests covering AC-01 through AC-06, plus `kvedCode` optionality and `children` array tests.

**Exact content**:

```typescript
import { describe, it, expect, expectTypeOf } from 'vitest';

import type {
  BalanceMode,
  DashboardState,
  GenderSplit,
  TreeNode,
} from '@/types/tree';

describe('TreeNode type', () => {
  it('allows constructing a valid 3-level tree without type assertions (AC-01, AC-05)', () => {
    const subcategory: TreeNode = {
      id: 'sub-1',
      label: 'Crop production',
      percentage: 60,
      absoluteValue: 420_000,
      genderSplit: { male: 65, female: 35 },
      children: [],
      defaultPercentage: 60,
      isLocked: false,
    };

    const industry: TreeNode = {
      id: 'ind-agriculture',
      label: 'Agriculture',
      percentage: 15.2,
      absoluteValue: 700_000,
      genderSplit: { male: 55, female: 45 },
      children: [subcategory],
      defaultPercentage: 15.2,
      isLocked: false,
      kvedCode: 'A',
    };

    const gender: TreeNode = {
      id: 'gender-male',
      label: 'Male',
      percentage: 52,
      absoluteValue: 7_020_000,
      genderSplit: { male: 100, female: 0 },
      children: [industry],
      defaultPercentage: 52,
      isLocked: false,
    };

    const root: TreeNode = {
      id: 'root',
      label: 'Total Employed',
      percentage: 100,
      absoluteValue: 13_500_000,
      genderSplit: { male: 52, female: 48 },
      children: [gender],
      defaultPercentage: 100,
      isLocked: false,
    };

    expect(root.id).toBe('root');
    expect(root.children).toHaveLength(1);
    expect(root.children[0].children[0].children[0].children).toHaveLength(0);
  });

  it('requires all mandatory fields on TreeNode (AC-01)', () => {
    expectTypeOf<TreeNode>().toHaveProperty('id');
    expectTypeOf<TreeNode>().toHaveProperty('label');
    expectTypeOf<TreeNode>().toHaveProperty('percentage');
    expectTypeOf<TreeNode>().toHaveProperty('absoluteValue');
    expectTypeOf<TreeNode>().toHaveProperty('genderSplit');
    expectTypeOf<TreeNode>().toHaveProperty('children');
    expectTypeOf<TreeNode>().toHaveProperty('defaultPercentage');
    expectTypeOf<TreeNode>().toHaveProperty('isLocked');
  });

  it('allows kvedCode to be omitted (optional field, resolved Q1)', () => {
    const nodeWithoutKved: TreeNode = {
      id: 'root',
      label: 'Total Employed',
      percentage: 100,
      absoluteValue: 13_500_000,
      genderSplit: { male: 52, female: 48 },
      children: [],
      defaultPercentage: 100,
      isLocked: false,
    };

    const nodeWithKved: TreeNode = {
      id: 'ind-agriculture',
      label: 'Agriculture',
      percentage: 15.2,
      absoluteValue: 700_000,
      genderSplit: { male: 55, female: 45 },
      children: [],
      defaultPercentage: 15.2,
      isLocked: false,
      kvedCode: 'A',
    };

    expect(nodeWithoutKved.kvedCode).toBeUndefined();
    expect(nodeWithKved.kvedCode).toBe('A');
  });

  it('accepts empty children array for leaf nodes', () => {
    const leaf: TreeNode = {
      id: 'leaf-1',
      label: 'Leaf Node',
      percentage: 10,
      absoluteValue: 100_000,
      genderSplit: { male: 50, female: 50 },
      children: [],
      defaultPercentage: 10,
      isLocked: false,
    };

    expect(leaf.children).toEqual([]);
  });

  it('accepts populated children array', () => {
    const child: TreeNode = {
      id: 'child-1',
      label: 'Child',
      percentage: 50,
      absoluteValue: 500_000,
      genderSplit: { male: 50, female: 50 },
      children: [],
      defaultPercentage: 50,
      isLocked: false,
    };

    const parent: TreeNode = {
      id: 'parent-1',
      label: 'Parent',
      percentage: 100,
      absoluteValue: 1_000_000,
      genderSplit: { male: 50, female: 50 },
      children: [child],
      defaultPercentage: 100,
      isLocked: false,
    };

    expect(parent.children).toHaveLength(1);
    expectTypeOf(parent.children).toEqualTypeOf<TreeNode[]>();
  });
});

describe('DashboardState type', () => {
  it('allows constructing a valid DashboardState (AC-02)', () => {
    const rootNode: TreeNode = {
      id: 'root',
      label: 'Total Employed',
      percentage: 100,
      absoluteValue: 13_500_000,
      genderSplit: { male: 52, female: 48 },
      children: [],
      defaultPercentage: 100,
      isLocked: false,
    };

    const state: DashboardState = {
      totalPopulation: 13_500_000,
      balanceMode: 'auto',
      tree: rootNode,
    };

    expect(state.totalPopulation).toBe(13_500_000);
    expect(state.balanceMode).toBe('auto');
    expect(state.tree.id).toBe('root');
  });
});

describe('BalanceMode type', () => {
  it('is a union of "auto" and "free" (AC-03)', () => {
    expectTypeOf<BalanceMode>().toEqualTypeOf<'auto' | 'free'>();
  });

  it('is used as DashboardState.balanceMode type (AC-03)', () => {
    expectTypeOf<DashboardState['balanceMode']>().toEqualTypeOf<
      'auto' | 'free'
    >();
  });
});

describe('GenderSplit type', () => {
  it('has required male and female number fields (AC-04)', () => {
    const split: GenderSplit = { male: 52, female: 48 };

    expect(split.male).toBe(52);
    expect(split.female).toBe(48);

    expectTypeOf<GenderSplit['male']>().toBeNumber();
    expectTypeOf<GenderSplit['female']>().toBeNumber();
  });

  it('can be used standalone for calculations (AC-04)', () => {
    const split: GenderSplit = { male: 60, female: 40 };
    const total = split.male + split.female;

    expect(total).toBe(100);
    expectTypeOf(split).toEqualTypeOf<GenderSplit>();
  });
});

describe('Type exports (AC-06)', () => {
  it('exports all 4 types from @/types/tree', () => {
    // These compile-time checks verify all types are importable and defined
    expectTypeOf<TreeNode>().not.toBeNever();
    expectTypeOf<DashboardState>().not.toBeNever();
    expectTypeOf<BalanceMode>().not.toBeNever();
    expectTypeOf<GenderSplit>().not.toBeNever();
  });
});

// NOTE: AC-07 (no `any` types) is verified by `pnpm lint` via the
// @typescript-eslint/no-explicit-any: "error" rule in the shared ESLint config.
// It is not testable via Vitest.
```

**Key notes**:
- Imports use `@/types/tree` path alias to verify path resolution (AC-06).
- Uses `import type` for all type imports -- these are type-only imports, appropriate since we only use them for `expectTypeOf` and variable annotations.
- `expectTypeOf` from Vitest provides compile-time type assertions without runtime overhead.
- Each test maps to specific acceptance criteria (annotated in test names).
- The `noUnusedLocals` concern from TL design is mitigated because every imported type is consumed by either `expectTypeOf` or variable annotations in the test body.
- No `any` type anywhere in the test file.

---

## Files Summary

| # | File Path | Action | Purpose |
|---|-----------|--------|---------|
| 1 | `apps/labor-market-dashboard/package.json` | MODIFY | Add vitest dep, update test script |
| 2 | `apps/labor-market-dashboard/vitest.config.ts` | CREATE | Vitest config with `@` path alias |
| 3 | `apps/labor-market-dashboard/tsconfig.node.json` | MODIFY | Include `vitest.config.ts` |
| 4 | `apps/labor-market-dashboard/src/types/tree.ts` | CREATE | Core type definitions |
| 5 | `apps/labor-market-dashboard/src/types/index.ts` | CREATE | Barrel re-export |
| 6 | `apps/labor-market-dashboard/src/__tests__/types/tree.test.ts` | CREATE | Type-safety tests |

**Directories to create** (these do not exist yet):
- `apps/labor-market-dashboard/src/types/`
- `apps/labor-market-dashboard/src/__tests__/`
- `apps/labor-market-dashboard/src/__tests__/types/`

---

## Implementation Order

1. **Modify `package.json`** -- add vitest, update test script
2. **Run `pnpm install`** -- install vitest, update lockfile
3. **Modify `tsconfig.node.json`** -- add vitest.config.ts to include
4. **Create `vitest.config.ts`** -- Vitest configuration
5. **Create `src/types/tree.ts`** -- type definitions
6. **Create `src/types/index.ts`** -- barrel export
7. **Create `src/__tests__/types/tree.test.ts`** -- tests
8. **Run verification commands** -- lint, test, build

---

## Patterns to Follow

### Import Order (ESLint `import/order` rule)

The shared ESLint base config enforces import ordering with newlines between groups:

```typescript
// 1. builtin
import { resolve } from 'path';

// 2. external (blank line before)
import { describe, it, expect, expectTypeOf } from 'vitest';

// 3. internal (blank line before -- @/ alias imports)
import type { TreeNode } from '@/types/tree';
```

### Named Exports Only

Per project convention, all exports are named (no `export default`). The one exception is `App.tsx` which currently uses `export default App` -- but new files should use named exports.

### Type-Only Imports and Exports

When importing/exporting only types, use the `type` keyword:

```typescript
// Import
import type { TreeNode } from '@/types/tree';

// Re-export
export type { TreeNode } from './tree';
```

### JSDoc Documentation

All interfaces and type aliases should have JSDoc comments. Fields should have inline JSDoc comments when the field name alone is not self-explanatory.

---

## Potential Issues and Mitigations

### 1. `noUnusedLocals` in test files

**Risk**: TypeScript's `noUnusedLocals: true` (from `base.json`) may flag type imports in test files as unused if they are only used in type annotations.

**Mitigation**: All imported types are consumed in the test body via either `expectTypeOf<Type>()` calls or variable type annotations (e.g., `const node: TreeNode = ...`). The `expectTypeOf` pattern from Vitest explicitly references the type at the value level, satisfying the compiler.

### 2. Vitest version compatibility

**Risk**: `vitest ^3.0.0` requires Node.js >= 18. The project requires Node.js >= 22 (`package.json` engines), so this is not an issue.

**Mitigation**: None needed. Node.js 22+ is already enforced.

### 3. ESLint on `vitest.config.ts`

**Risk**: The ESLint config's `parserOptions.project` includes `tsconfig.node.json`. If `vitest.config.ts` is not in `tsconfig.node.json`'s `include`, ESLint may fail to parse it.

**Mitigation**: File 3 explicitly adds `vitest.config.ts` to `tsconfig.node.json`'s `include` array.

### 4. Turbo test pipeline

**Risk**: `turbo.json` defines `test` as depending on `build`. If `build` fails, `test` will not run.

**Mitigation**: The implementation order ensures type files are created before running tests. `pnpm build` should pass after Step 5 (type definitions created), and `pnpm test` will run after that.

---

## Verification Steps

After all files are created/modified, run these commands in order:

```bash
# 1. Install dependencies (after package.json modification)
pnpm install

# 2. Verify vitest is installed
pnpm --filter @template/labor-market-dashboard exec vitest --version

# 3. Run lint (verifies AC-07: no any types, plus import order)
pnpm lint

# 4. Run tests (verifies AC-01 through AC-06)
pnpm test

# 5. Run build (verifies AC-08: tsc --noEmit + vite build)
pnpm build
```

**Expected results**:
- `pnpm install`: exits 0, lockfile updated
- `vitest --version`: prints version 3.x.x
- `pnpm lint`: exits 0, zero errors
- `pnpm test`: exits 0, all tests pass (expect ~10 test cases, 0 failures)
- `pnpm build`: exits 0, `dist/` directory created

---

## Acceptance Criteria Traceability

| AC | Verified By | How |
|----|------------|-----|
| AC-01 | Test 1, Test 2 | Construct TreeNode with all fields; `expectTypeOf` checks properties |
| AC-02 | Test (DashboardState) | Construct DashboardState with all fields |
| AC-03 | Test (BalanceMode) | `expectTypeOf<BalanceMode>().toEqualTypeOf<'auto' \| 'free'>()` |
| AC-04 | Test (GenderSplit) | Construct standalone GenderSplit; verify both fields required |
| AC-05 | Test 1 | 3-level tree construction compiles without assertions |
| AC-06 | Test (exports) | Import all 4 types, verify not `never` |
| AC-07 | `pnpm lint` | `@typescript-eslint/no-explicit-any: "error"` rule |
| AC-08 | `pnpm build` + `pnpm lint` | Both exit 0 |

---

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
