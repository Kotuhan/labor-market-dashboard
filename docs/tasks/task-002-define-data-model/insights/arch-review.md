# Architecture Review: task-002
Generated: 2026-02-17
Iteration: 1

## Verdict: APPROVED

## Review Summary

The TL design for the TypeScript data model is architecturally sound. It defines four well-scoped type exports (`TreeNode`, `GenderSplit`, `BalanceMode`, `DashboardState`) in a single file at the location already planned in `architecture/overview.md`, follows all established project conventions, and introduces no undocumented architectural decisions. The Vitest setup is a necessary addition to satisfy AC-08 and establishes a clean testing pattern for the monorepo.

## Checklist

- [x] Consistent with existing ADRs
- [x] Event contracts maintained or properly extended
- [x] Component boundaries respected
- [x] Protocol conventions followed
- [x] No undocumented architectural decisions

## Detailed Review

### ADR-0001 (React 19 + Vite 6 + TypeScript 5.7 strict)

- Type definitions use `.ts` extension (not `.tsx`), correctly justified to avoid `react-refresh/only-export-components` lint warnings on non-component exports.
- TypeScript strict mode is inherited from `packages/config/typescript/base.json` (`"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`), which flows through `react.json` to the app's `tsconfig.json`. The design respects this chain.
- Named exports only, no default exports -- consistent with ADR-0001's shared config extension pattern and PO recommendation.
- No `any` type used anywhere in the reference design -- enforced at lint level by `@typescript-eslint/no-explicit-any: "error"` in the shared ESLint config.
- Build verification uses `tsc --noEmit && vite build` as established in ADR-0001.

### ADR-0002 (Tailwind CSS v4 CSS-first)

- Not applicable to this task. No styling files created or modified. No violations.

### ADR-0003 (ESLint v8 legacy format)

- The design does not create or modify any ESLint configuration files. Lint verification uses the existing `.eslintrc.cjs` extending `@template/config/eslint/react`. No violations.

### Component Boundaries

- Types are placed at `apps/labor-market-dashboard/src/types/tree.ts` with a barrel export at `src/types/index.ts`. This exactly matches the planned module inventory in `architecture/overview.md` (line 99: `types | src/types/tree.ts | TreeNode, DashboardState interfaces`).
- No types leak outside the `apps/labor-market-dashboard/` boundary. This is correct for a single-app monorepo where types are app-specific.
- The barrel export uses `export type { ... }` syntax, ensuring type-only re-exports that produce no runtime JavaScript -- appropriate for a pure type module.

### Path Alias Convention

- The design references `@/types/tree` for imports, which aligns with the established `@` -> `./src` alias configured in both `vite.config.ts` (runtime resolution) and `tsconfig.json` (type-checking resolution).
- The proposed `vitest.config.ts` reuses the same `@` path alias pattern, ensuring test imports resolve identically to application imports.

### Vitest Configuration

- First Vitest setup in the monorepo. The design correctly proposes:
  - `vitest` as a devDependency (`^3.0.0`) in the app's `package.json`
  - Separate `vitest.config.ts` (not merged into `vite.config.ts`) with `@` alias
  - Updating the `test` script from `echo "No tests yet" && exit 0` to `vitest run`
- This is architecturally appropriate. Vitest is the testing framework specified in the project tech stack (`CLAUDE.md`: "Tests: Vitest + React Testing Library"). The design does not install `@testing-library/react` yet, which is correct since this task has no React component tests.
- The `noUnusedLocals: true` risk with test files is acknowledged and mitigated by the `expectTypeOf` pattern, which consumes type references.

### Type Design Decisions

All decisions in the TL design are well-documented and traceable:

| Decision | Assessment |
|----------|------------|
| Single `TreeNode` interface (not discriminated union) | Consistent with PRD Section 5 and `architecture/overview.md` line 32-33 which defines a single `TreeNode` interface. |
| `GenderSplit` as standalone interface | Required by AC-04. Matches `overview.md` line 33 which lists `genderSplit` as a TreeNode field. |
| `BalanceMode` as string literal union | Idiomatic TypeScript. Matches `overview.md` line 33: `balanceMode ('auto' \| 'free')`. |
| `kvedCode?: string` optional field | PO-resolved Q1. Optional is correct since root and gender nodes have no KVED code. |
| No `level`/`depth` field | Reasonable deferral. Derivable at runtime. No existing ADR or convention requires it. |
| No `color` field | Explicitly scoped out by PO. Colors are a UI concern per `overview.md` planned modules. |

### Test File Location

- Tests placed at `src/__tests__/types/tree.test.ts`. This is the first test file in the app. The `__tests__` directory pattern is a common convention (Jest/Vitest) and is reasonable. The `architecture/overview.md` does not prescribe a test directory convention yet.

## Conditions

- During the post-task arch-update stage, update `architecture/overview.md` to reflect:
  - Vitest configuration pattern (`vitest.config.ts` with `@` alias, `vitest run` script)
  - Test directory convention (`src/__tests__/`) as established by this task
  - Move `types | src/types/tree.ts` from "Planned" to "Implemented" in the Module Inventory

## Architecture Impact

- **New module implemented**: `src/types/tree.ts` (type definitions), `src/types/index.ts` (barrel export)
- **New tooling**: Vitest test runner configured for the first time in the monorepo
- **No new ADRs needed**: All decisions in this task are consistent with existing ADRs and documented conventions. The Vitest choice is already specified in the project tech stack and does not warrant a separate ADR.
- **No contract changes**: This task defines internal TypeScript interfaces, not API contracts or event schemas.
