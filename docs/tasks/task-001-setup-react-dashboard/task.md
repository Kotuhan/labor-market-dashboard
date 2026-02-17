---
id: task-001
title: Setup React Labor Market Dashboard App
status: backlog
priority: high
dependencies: []
created_at: 2026-02-17
---

# Setup React Labor Market Dashboard App

## Problem (PO)

The Labor Market Dashboard Calculator project requires a working React application scaffold before any feature development can begin. Today, the `apps/` directory is empty -- there is no application shell, no build pipeline, no TypeScript configuration, and no styling foundation. Every subsequent task in the roadmap (data model, state management, sliders, pie charts, deployment) depends on this foundation existing and working correctly within the Turborepo monorepo.

From the user's perspective: "I need a working development environment where I can start building the interactive labor market dashboard. Without the app scaffold, no feature work can begin, and the entire project timeline is blocked."

**Why now:** This is Task 1 with zero dependencies. Every other task (2 through 10+) depends on it. The project cannot advance without a functioning app shell.

**If we do nothing:** The entire Labor Market Dashboard project remains blocked. No components, data models, state management, or visualizations can be developed or tested.

## Success Criteria (PO)

* Developer can run `pnpm dev` from monorepo root and the dashboard app starts with hot module replacement (HMR) working.
* Developer can run `pnpm build` from monorepo root and the app produces a production build artifact in `apps/labor-market-dashboard/dist/`.
* Developer can run `pnpm lint` from monorepo root and the app is included in the lint pass with zero errors on the default scaffold code.
* TypeScript strict mode catches type errors at compile time -- the app rejects code with `any` types.
* Tailwind CSS utility classes render correctly in the browser when applied to JSX elements.
* The app integrates with Turborepo -- all turbo tasks (`build`, `dev`, `lint`, `test`, `clean`) recognize and operate on the new app.

## Acceptance Criteria (PO)

* Given the monorepo root with the new app in `apps/labor-market-dashboard`
  When a developer runs `pnpm dev`
  Then the Vite dev server starts for the dashboard app, serves a page in the browser, and HMR reflects code changes without a full reload.

* Given the monorepo root with the new app in `apps/labor-market-dashboard`
  When a developer runs `pnpm build`
  Then the app compiles without errors and produces a production bundle in `apps/labor-market-dashboard/dist/`.

* Given the monorepo root with the new app in `apps/labor-market-dashboard`
  When a developer runs `pnpm lint`
  Then the linter runs against the app's source files and reports zero errors on the default scaffold code.

* Given a TypeScript file in the app that uses an `any` type
  When the developer runs `pnpm build` or the TypeScript compiler
  Then the build fails with a type error, confirming strict mode enforcement.

* Given the default scaffold page includes a Tailwind CSS utility class (e.g., `bg-slate-50`, `text-blue-500`)
  When the page renders in a browser
  Then the Tailwind styles are visually applied correctly.

* Given the new app has a `package.json` with `build`, `dev`, `lint`, and `clean` scripts
  When Turborepo runs any of these tasks from the root
  Then the dashboard app is included in the task execution graph and completes successfully.

* Given the app's `package.json`
  When inspecting the dependencies
  Then React is version 18 or higher, TypeScript is version 5+, Vite is the build tool, and Tailwind CSS is installed.

* Given the app's TypeScript configuration
  When inspecting `tsconfig.json`
  Then it extends or references the shared base config from `packages/config/typescript/` and has strict mode enabled.

* Given the app's ESLint configuration
  When inspecting the lint config
  Then it extends or references the shared base ESLint config from `packages/config/eslint/`.

* Given the app scaffold renders in a browser
  When a developer views the page
  Then a minimal placeholder page is visible (e.g., app title "Labor Market Dashboard") confirming the full stack (React + TypeScript + Vite + Tailwind) works end-to-end.

## Out of Scope (PO)

* No feature components -- no sliders, pie charts, tree panels, mode toggles, or any functional UI beyond a minimal placeholder page.
* No data model or default data -- the TypeScript `TreeNode`/`DashboardState` interfaces and Ukraine labor market data belong to Tasks 2 and 3.
* No state management -- no Zustand, useReducer, or custom hooks for tree state.
* No charting libraries -- Recharts or Chart.js installation is not part of this task.
* No GitHub Pages deployment -- CI/CD and GitHub Actions configuration are separate tasks.
* No test files or test framework setup -- Vitest configuration is a separate concern (though the `test` script in package.json should exist as a placeholder).
* No i18n, SEO, or accessibility optimizations -- these are later milestone concerns.
* No custom shared config creation in `packages/config/` -- if a new React/Vite variant is needed, that is a TL decision.
* No mobile or responsive design -- the scaffold page has no meaningful layout to make responsive.

## Open Questions (PO)

No blocking open questions. This is a well-constrained scaffolding task with clear inputs from the PRD and monorepo configuration.

Note for TL: The shared `packages/config/` currently has `next.json` and `nest.json` TypeScript configs but no React/Vite-specific variant. The TL should decide whether to create a new shared config (e.g., `typescript/react.json`) or have the app extend `base.json` directly with DOM/JSX overrides. Similarly, the shared ESLint config lacks React-specific rules -- the TL should decide where to configure these.

---

## Technical Notes (TL)

- **Affected modules:** `packages/config/` (new shared configs), `apps/labor-market-dashboard/` (new app)
- **New modules/entities to create:**
  - `packages/config/typescript/react.json` -- shared TypeScript config for React/Vite apps
  - `packages/config/eslint/react.js` -- shared ESLint config for React apps
  - `apps/labor-market-dashboard/` -- new Vite + React application (full scaffold)
- **DB schema change required?** No.
- **Architectural considerations:**
  - Shared configs follow the established monorepo pattern: `react.json` extends `base.json` (like `next.json`, `nest.json`); `react.js` extends `base.js` (like `next.js`, `nest.js`).
  - Tailwind CSS v4 with `@tailwindcss/vite` plugin (not PostCSS). CSS-first config via `@import "tailwindcss"` -- no `tailwind.config.js`.
  - ESLint stays on v8 legacy config format (`.eslintrc.cjs`) to match existing monorepo infrastructure.
  - React 19 + Vite 6 + TypeScript 5.7+ as the app's core stack.
  - `tsconfig.json` uses `jsx: "react-jsx"`, `moduleResolution: "Bundler"`, `noEmit: true` -- differs from Next.js config's `jsx: "preserve"`.
- **Known risks or trade-offs:**
  - Tailwind v4 CSS-first config is newer but simpler. If charting libraries need theme colors, they can be extracted from CSS custom properties.
  - ESLint v8 is in maintenance mode. Migration to v9 flat config is a future monorepo-wide task.
- **Complexity estimate:** 0.5 days. Low risk. Pure toolchain scaffolding with no business logic.
- **Full design:** See `insights/tl-design.md` for architecture decisions table and detailed file contents.

## Implementation Steps (TL)

1. **Step 1 -- Create shared TypeScript config** (`packages/config/typescript/react.json`)
   - Create `react.json` extending `base.json` with React/Vite overrides (`jsx: "react-jsx"`, DOM libs, `moduleResolution: "Bundler"`, `noEmit: true`)
   - Add `"./typescript/react"` export to `packages/config/package.json`
   - Verification: File exists, JSON valid, export listed in package.json

2. **Step 2 -- Create shared ESLint config** (`packages/config/eslint/react.js`)
   - Create `react.js` extending `base.js` with `eslint-plugin-react-hooks` (recommended) and `eslint-plugin-react-refresh`
   - Add `"./eslint/react"` export to `packages/config/package.json`
   - Add `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` to `packages/config/package.json` devDependencies
   - Verification: File exists, export listed in package.json

3. **Step 3 -- Scaffold the app directory** (`apps/labor-market-dashboard/`)
   - Create all files: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `.eslintrc.cjs`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/vite-env.d.ts`
   - Package name: `@template/labor-market-dashboard`. Scripts: `dev`, `build`, `lint`, `test` (placeholder), `clean`.
   - Dependencies: `react`, `react-dom`. DevDependencies: `@template/config`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `typescript`, `vite`, `eslint`.
   - Placeholder page: centered card with "Labor Market Dashboard" heading using Tailwind classes (`bg-slate-50`, `text-blue-500`, `shadow-sm`, `rounded-lg`).
   - Verification: All files exist in correct locations

4. **Step 4 -- Install dependencies**
   - Run `pnpm install` from monorepo root
   - Verification: Command completes without errors

5. **Step 5 -- Update .gitignore**
   - Add `apps/labor-market-dashboard/dist/` entry
   - Remove `apps/.gitkeep` (directory now has real content)
   - Verification: Entries present in `.gitignore`

6. **Step 6 -- Verify dev server**
   - Run `pnpm dev --filter @template/labor-market-dashboard`
   - Verification: Vite dev server starts, serves placeholder page, HMR works

7. **Step 7 -- Verify production build**
   - Run `pnpm build` from root
   - Verification: Exit code 0, `dist/` contains `index.html` + JS/CSS bundles, TypeScript type-checking passes

8. **Step 8 -- Verify lint**
   - Run `pnpm lint` from root
   - Verification: Zero errors on scaffold code

9. **Step 9 -- Verify TypeScript strict mode**
   - Temporarily add `const x: any = 5;` to `App.tsx`, run `pnpm build`, confirm it fails
   - Remove the temporary line
   - Verification: Build fails with type/lint error on `any`, passes after removal

10. **Step 10 -- Verify Tailwind CSS rendering**
    - Start dev server, open browser
    - Verification: `bg-slate-50` applies gray background, `text-blue-500` applies blue text, `shadow-sm` and `rounded-lg` render correctly

11. **Step 11 -- Final verification**
    - Run `pnpm lint && pnpm build` from root
    - Confirm Turborepo includes the app in task output
    - Verification: Both commands pass, app appears in Turborepo task graph

---

## Implementation Log (DEV)

Track actual implementation progress.
Update after completing each step.

- Step 1 (shared TS config): pending
- Step 2 (shared ESLint config): pending
- Step 3 (scaffold app): pending
- Step 4 (install deps): pending
- Step 5 (update .gitignore): pending
- Step 6 (verify dev): pending
- Step 7 (verify build): pending
- Step 8 (verify lint): pending
- Step 9 (verify strict mode): pending
- Step 10 (verify Tailwind): pending
- Step 11 (final verification): pending

---

## QA Notes (QA)

Describe how the task was verified.

### Test Cases

- Test case 1:
- Test case 2:

### Test Results

- Pending
