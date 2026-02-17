---
status: accepted
date: 2026-02-17
triggered-by: task-001
---

# ADR-0001: Adopt React 19 + Vite 6 + TypeScript 5.7 as Frontend Stack

## Context and Problem Statement

The Labor Market Dashboard project needs a frontend framework, build tool, and type system for an interactive single-page application. The monorepo already has shared TypeScript and ESLint configs (`packages/config/`) with extension patterns for `next` and `nest` variants, but no React/Vite variant exists. The PRD specifies "React 18+" as the minimum framework version.

## Decision Drivers

- PRD requires React 18+ with TypeScript strict mode
- Must integrate with existing Turborepo + pnpm workspace monorepo
- Must follow the established shared config extension pattern (`packages/config/typescript/{variant}`, `packages/config/eslint/{variant}`)
- Should use current stable versions to avoid immediate tech debt
- App is a client-side SPA with no SSR requirements (GitHub Pages hosting)

## Considered Options

- React 19 + Vite 6 + TypeScript 5.7 (current stable)
- React 18 + Vite 5 + TypeScript 5.3 (previous stable)
- Next.js 14 (already has shared configs in the monorepo)

## Decision Outcome

Chosen option: "React 19 + Vite 6 + TypeScript 5.7", because React 19 is the current stable release and satisfies the "18+" requirement, Vite 6 provides fast HMR and ESM-native bundling ideal for a client-side SPA, and TypeScript 5.7 is the latest stable compiler with full strict mode support. Next.js was rejected because the app has no SSR/SSG requirements and would add unnecessary complexity for a static SPA.

### Consequences

- Good, because the project starts on current stable versions with no immediate upgrade pressure
- Good, because a new shared config variant (`typescript/react.json`, `eslint/react.js`) was created, reusable by any future React/Vite apps in the monorepo
- Good, because Vite's `moduleResolution: "Bundler"` and `jsx: "react-jsx"` clearly differentiate from the Next.js config's `jsx: "preserve"`
- Bad, because React 19 is newer and some third-party library type definitions may lag behind (mitigated: `@types/react@^19.0.0` is available)

## More Information

- Shared TypeScript config: `packages/config/typescript/react.json`
- Shared ESLint config: `packages/config/eslint/react.js`
- App location: `apps/labor-market-dashboard/`
- Build script uses `tsc --noEmit && vite build` (type-check then bundle; `tsc -b` was rejected due to emit pollution in referenced projects)
- Related: [ADR-0002](adr-0002-use-tailwind-css-v4-css-first-config.md) (styling), [ADR-0003](adr-0003-maintain-eslint-v8-legacy-config-format.md) (linting)
