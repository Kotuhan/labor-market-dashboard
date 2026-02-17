# Architecture Overview

## System Components

### Labor Market Dashboard (SPA)

Single-page application for interactive labor market modeling.

**Location**: `apps/labor-market-dashboard/`
**Package**: `@template/labor-market-dashboard`

| Component | Technology | Purpose |
|-----------|------------|---------|
| App Shell | React 19 / Vite 6 | Component framework, fast HMR (per ADR-0001) |
| State Management | Zustand / useReducer | Tree state, auto-balance logic |
| Visualization | Recharts | Animated pie charts with tooltips |
| Styling | Tailwind CSS v4 | CSS-first config, `@tailwindcss/vite` plugin (per ADR-0002) |
| Hosting | GitHub Pages | Static SPA, no backend |

### Data Architecture

Tree-based model with 3 levels of depth:

```
Root: Total Employed (13,500k)
  ├─ Level 1: Gender (Male 52% / Female 48%)
  │   ├─ Level 2: Industries (15+ KVED sectors)
  │   │   └─ Level 3: Subcategories (75+ breakdowns)
```

Key interfaces (implemented in `src/types/tree.ts`):
- `GenderSplit` — `{ male: number; female: number }` (both required, sum = 100 at runtime)
- `BalanceMode` — `'auto' | 'free'` union type for slider behavior
- `TreeNode` — recursive node with id, label, percentage, absoluteValue, genderSplit, children, defaultPercentage, isLocked, optional kvedCode
- `DashboardState` — totalPopulation, balanceMode (BalanceMode), tree (single TreeNode root)

### Auto-Balance Algorithm

When a slider changes in auto-balance mode:
1. Locked siblings remain fixed
2. Remaining percentage redistributed proportionally among unlocked siblings
3. Absolute values recalculated recursively down the tree
4. Sum always equals 100% at each level

Free mode: independent sliders, sum may deviate from 100% (warning shown).

### Shared Config Package

**Location**: `packages/config/`
**Package**: `@template/config`

Centralized TypeScript, ESLint, and Prettier configs shared across the monorepo.

| Config Type | Variants | Extension Pattern |
|-------------|----------|-------------------|
| TypeScript | `base`, `next`, `nest`, `react` | `"extends": "@template/config/typescript/{variant}"` |
| ESLint | `base`, `next`, `nest`, `react` | `require.resolve("@template/config/eslint/{variant}")` |
| Prettier | shared | `"@template/config/prettier"` |

## Tech Stack

| Category | Technology | Version | Rationale | ADR |
|----------|------------|---------|-----------|-----|
| Framework | React | 19.x | Component model, hooks, ecosystem | ADR-0001 |
| Language | TypeScript | 5.7+ (strict) | Type safety for tree operations | ADR-0001 |
| Build | Vite | 6.x | Fast HMR, optimal bundle, ESM-native | ADR-0001 |
| Styles | Tailwind CSS | 4.x | CSS-first config, no JS config file | ADR-0002 |
| Linting | ESLint | 8.x (legacy format) | Monorepo consistency, `.eslintrc.cjs` | ADR-0003 |
| Charts | Recharts | TBD | Pie chart support, animations | -- |
| State | Zustand / useReducer | TBD | Lightweight tree state | -- |
| Tests | Vitest + RTL | 3.x | Unit and integration tests | -- |
| CI/CD | GitHub Actions | TBD | Auto-deploy on push to main | -- |
| Hosting | GitHub Pages | -- | Free, static SPA | -- |

## Module Inventory

### Implemented

| Module | Location | Responsibility | Since |
|--------|----------|----------------|-------|
| App Shell | `apps/labor-market-dashboard/src/App.tsx` | Root component, placeholder page | task-001 |
| Entry Point | `apps/labor-market-dashboard/src/main.tsx` | React 19 StrictMode bootstrap | task-001 |
| Tailwind Entry | `apps/labor-market-dashboard/src/index.css` | `@import "tailwindcss"` (v4 CSS-first) | task-001 |
| Vite Config | `apps/labor-market-dashboard/vite.config.ts` | React + Tailwind plugins, `@` alias | task-001 |
| TS Config (React) | `packages/config/typescript/react.json` | Shared React/Vite TypeScript config | task-001 |
| ESLint Config (React) | `packages/config/eslint/react.js` | Shared React ESLint config | task-001 |
| Types (tree.ts) | `apps/labor-market-dashboard/src/types/tree.ts` | TreeNode, GenderSplit, BalanceMode, DashboardState interfaces | task-002 |
| Types (barrel) | `apps/labor-market-dashboard/src/types/index.ts` | Type-only barrel re-export | task-002 |
| Vitest Config | `apps/labor-market-dashboard/vitest.config.ts` | Test runner config with `@` path alias | task-002 |
| Type Tests | `apps/labor-market-dashboard/src/__tests__/types/tree.test.ts` | Type-safety tests (11 cases) | task-002 |

### Planned (Not Yet Implemented)

| Module | Location | Responsibility |
|--------|----------|----------------|
| Slider | `src/components/Slider/` | Range input + numeric input + lock toggle |
| PieChart | `src/components/PieChart/` | Recharts wrapper with animations & tooltips |
| TreePanel | `src/components/TreePanel/` | Expandable/collapsible category hierarchy |
| ModeToggle | `src/components/ModeToggle/` | Auto-balance / Free mode switch |
| SummaryBar | `src/components/SummaryBar/` | Total population input + statistics |
| ResetButton | `src/components/ResetButton/` | Reset to defaults + confirmation modal |
| useTreeState | `src/hooks/useTreeState.ts` | Tree state management (reducer/Zustand) |
| useAutoBalance | `src/hooks/useAutoBalance.ts` | Auto-balance redistribution algorithm |
| defaultTree | `src/data/defaultTree.ts` | Ukraine labor market default data |
| calculations | `src/utils/calculations.ts` | Absolute value recalculation |
| format | `src/utils/format.ts` | Number formatting (UA locale, thousands separator) |

## Security Architecture

- No backend, no authentication required
- No user data stored (pure client-side SPA)
- No API calls to external services
- All data is static, bundled with the app

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Slider update latency | < 100ms |
| NFR-02 | Lighthouse Performance | > 90 |
| NFR-03 | Lighthouse Accessibility | > 90 |
| NFR-04 | Desktop + Tablet responsive | 1024px+ |
| NFR-05 | Mobile responsive | 320px+ |
| NFR-06 | Browser support | Chrome, Firefox, Safari, Edge |
| NFR-07 | Bundle size | < 500KB gzipped |
| NFR-08 | Animation framerate | 60fps |

## Architectural Decisions

| ADR | Title | Status | Triggered By |
|-----|-------|--------|--------------|
| [ADR-0001](decisions/adr-0001-adopt-react-vite-typescript-frontend-stack.md) | Adopt React 19 + Vite 6 + TypeScript 5.7 as frontend stack | accepted | task-001 |
| [ADR-0002](decisions/adr-0002-use-tailwind-css-v4-css-first-config.md) | Use Tailwind CSS v4 with CSS-first configuration | accepted | task-001 |
| [ADR-0003](decisions/adr-0003-maintain-eslint-v8-legacy-config-format.md) | Maintain ESLint v8 legacy config format across monorepo | accepted | task-001 |

## Development Conventions

### Vitest Configuration Pattern

Vitest is the test runner for all apps in the monorepo. Each app that has tests must have its own `vitest.config.ts` (separate from `vite.config.ts`) with these conventions:

| Setting | Value | Rationale |
|---------|-------|-----------|
| Config import | `vitest/config` (not `vite`) | Provides proper `test` field typing |
| `@` path alias | Replicated from `vite.config.ts` | Tests can use the same `@/` imports as source code |
| `globals` | `false` | Explicit imports (`describe`, `it`, `expect` from `vitest`) avoid global namespace pollution |
| `environment` | `'node'` for non-DOM tests; `'jsdom'` for React component tests | Minimize test overhead |
| Plugins | None for type-only tests; add `react()` etc. only when DOM is needed | Avoid unnecessary build overhead |

The `vitest.config.ts` file must be added to `tsconfig.node.json`'s `include` array for ESLint type-checking to work.

The `test` script in each app's `package.json` should be `vitest run` (single run, not watch mode).

### Test Directory Convention

Tests live in `src/__tests__/` mirroring the source directory structure:

```
src/
  types/
    tree.ts
    index.ts
  __tests__/
    types/
      tree.test.ts
```

- Test files use the `.test.ts` extension (`.test.tsx` for component tests with JSX)
- Directory structure under `__tests__/` mirrors the `src/` structure (e.g., `src/__tests__/types/` for `src/types/`)
- Type-only test imports use `import type { ... }` syntax
- Each test file imports from the corresponding source using the `@/` path alias

## Known Limitations

- Data accuracy: all figures after 2021 are estimates with varying methodology
- No data export (JSON/CSV/PDF) in v1
- No scenario save/load in v1
- No multi-language support in v1
- No side-by-side scenario comparison in v1
