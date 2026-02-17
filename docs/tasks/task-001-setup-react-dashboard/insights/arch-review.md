# Architecture Review: task-001
Generated: 2026-02-17
Iteration: 1

## Verdict: APPROVED

## Review Summary

The TL design for scaffolding the React + Vite + Tailwind CSS v4 application is well-structured and follows the established monorepo patterns faithfully. Shared configs (`typescript/react.json`, `eslint/react.js`) correctly mirror the extension pattern used by `next.json`/`nest.json` and `next.js`/`nest.js`. No architectural violations were found.

## Checklist
- [x] Consistent with existing ADRs
- [x] Event contracts maintained or properly extended
- [x] Component boundaries respected
- [x] Protocol conventions followed
- [x] No undocumented architectural decisions

## Detailed Assessment

### 1. Shared Config Pattern Consistency

The design creates `packages/config/typescript/react.json` extending `base.json` and `packages/config/eslint/react.js` extending `base.js`. This is directly consistent with the established pattern:

| Existing | Proposed | Pattern Match |
|----------|----------|---------------|
| `typescript/next.json` extends `base.json` | `typescript/react.json` extends `base.json` | Yes |
| `typescript/nest.json` extends `base.json` | -- | -- |
| `eslint/next.js` extends `base.js` | `eslint/react.js` extends `base.js` | Yes |
| `eslint/nest.js` extends `base.js` | -- | -- |

Export naming (`./typescript/react`, `./eslint/react`) follows the same convention as existing exports (`./typescript/next`, `./eslint/nest`).

### 2. TypeScript Config Correctness

The proposed `react.json` correctly differentiates from `next.json`:
- `jsx: "react-jsx"` (Vite handles JSX transform) vs. `jsx: "preserve"` (Next.js defers to SWC) -- correct.
- `target: "ES2020"` is appropriate for modern browser targets in Vite.
- `moduleResolution: "Bundler"` matches `next.json` and is correct for Vite.
- `noEmit: true`, `declaration: false`, `declarationMap: false` -- correct for a Vite app that uses Vite for bundling, not `tsc`.
- `allowImportingTsExtensions: true` is safe with `noEmit: true`.
- Strict mode is inherited from `base.json` (`strict: true`, `noImplicitAny: true`) -- satisfies the PO acceptance criteria.

### 3. ESLint Config Correctness

The proposed `eslint/react.js`:
- Extends `./base.js` -- consistent with `nest.js` pattern.
- Adds `eslint-plugin-react-hooks` (recommended config) and `eslint-plugin-react-refresh` -- appropriate for React + Vite development.
- Sets `env: { browser: true }` -- correct for a client-side app (vs. `node: true` in `nest.js`).
- Includes `react.version: "detect"` in settings -- good practice.
- Uses ESLint v8 legacy format (`.eslintrc.cjs`) -- consistent with the entire monorepo. The design correctly identifies that v9 flat config migration would be a separate monorepo-wide task.

### 4. Application Scaffold

- Package name `@template/labor-market-dashboard` follows the `@template/*` namespace used in the monorepo.
- `type: "module"` is required for Vite and is correctly specified.
- `workspace:*` dependency on `@template/config` is the standard pnpm workspace protocol.
- The `build` script (`tsc -b && vite build`) runs type checking before bundling -- correct.
- The `test` script placeholder (`echo "No tests yet" && exit 0`) is appropriate for a scaffolding task.
- React 19, Vite 6, TypeScript 5.7 are current stable versions. The PO requires "React 18+" which is satisfied.

### 5. Tailwind CSS v4 Integration

- `@tailwindcss/vite` plugin is the officially recommended integration for Vite projects.
- CSS-first configuration (`@import "tailwindcss"` in `index.css`) eliminates the need for `tailwind.config.js`.
- The design correctly notes that if programmatic theme access is needed later (e.g., for charting libraries), CSS custom properties can be used.

### 6. Turborepo Integration

- The existing `turbo.json` task definitions (`build`, `dev`, `lint`, `test`, `clean`) will automatically discover the new app because `pnpm-workspace.yaml` includes `apps/*`.
- The `build` task outputs include `dist/**` which matches the Vite output directory.
- No changes to `turbo.json` are needed -- correct.

### 7. .gitignore

- The existing `.gitignore` already has a generic `dist/` entry (line 9) that will cover `apps/labor-market-dashboard/dist/`. The design's Step 5 proposes adding an explicit `apps/labor-market-dashboard/dist/` entry, which is redundant but harmless. Not a violation.

### 8. Component Boundaries

- The design correctly keeps shared configs in `packages/config/` and the app in `apps/labor-market-dashboard/`.
- No cross-app dependencies are introduced.
- The app depends only on `@template/config` (workspace package) plus standard npm packages.

### 9. No Existing ADRs

- There are currently no ADRs in `architecture/decisions/`. This is task-001 -- the first task in the project. No existing decisions can be contradicted.
- The design introduces several implicit architectural decisions (React 19, Vite 6, Tailwind v4, ESLint v8 legacy format, shared config extension pattern). These should be documented as ADRs during the arch-update phase after implementation.

### 10. No Existing Contracts

- There are no contracts in `architecture/contracts/`. This task does not introduce API endpoints or event schemas. No contract review needed.

## Conditions

- During the arch-update phase (post-implementation), the following implicit decisions should be documented as ADRs:
  - ADR-0001: Adopt React 19 + Vite 6 + TypeScript 5.7 as the frontend stack
  - ADR-0002: Use Tailwind CSS v4 with CSS-first configuration and `@tailwindcss/vite` plugin
  - ADR-0003: Maintain ESLint v8 legacy config format across the monorepo (with note about future v9 migration)
- The `architecture/overview.md` should be updated with the new component (`labor-market-dashboard`) and tech stack details.

## Architecture Impact

This task establishes the foundational frontend architecture for the project:
- **New component**: `apps/labor-market-dashboard/` -- React + Vite single-page application
- **Extended shared configs**: `packages/config/typescript/react.json` and `packages/config/eslint/react.js` -- reusable by any future React apps in the monorepo
- **Frontend tech stack established**: React 19, Vite 6, TypeScript 5.7, Tailwind CSS v4
- **No protocol or timing changes**: This is a standalone frontend app with no backend integration at this stage
