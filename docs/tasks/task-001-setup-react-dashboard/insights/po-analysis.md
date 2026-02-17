# PO Analysis: task-001
Generated: 2026-02-17

## Problem Statement

The Labor Market Dashboard Calculator project requires a working React application scaffold before any feature development can begin. Today, the `apps/` directory is empty -- there is no application shell, no build pipeline, no TypeScript configuration, and no styling foundation. Every subsequent task in the roadmap (data model, state management, sliders, pie charts, deployment) depends on this foundation existing and working correctly within the Turborepo monorepo.

From the user's perspective: "I need a working development environment where I can start building the interactive labor market dashboard. Without the app scaffold, no feature work can begin, and the entire project timeline is blocked."

**Why now:** This is Task 1 with zero dependencies. Every other task (2 through 10+) depends on it. The project cannot advance a single step without a functioning app shell.

**If we do nothing:** The entire Labor Market Dashboard project remains blocked. No components, data models, state management, or visualizations can be developed or tested.

## Success Criteria

1. A developer can run `pnpm dev` from the monorepo root and the labor market dashboard app starts with hot module replacement (HMR) working.
2. A developer can run `pnpm build` from the monorepo root and the app produces a production build artifact in the expected output directory (e.g., `dist/`).
3. A developer can run `pnpm lint` from the monorepo root and the app is included in the lint pass without errors on the default scaffold code.
4. TypeScript strict mode catches type errors at compile time -- the app does not compile if code contains `any` types or violates strict checks.
5. Tailwind CSS utility classes render correctly in the browser when applied to JSX elements.
6. The app integrates seamlessly with Turborepo -- all turbo tasks (`build`, `dev`, `lint`, `test`, `clean`) recognize and operate on the new app.

## Acceptance Criteria

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

## Out of Scope

* **No feature components** -- no sliders, pie charts, tree panels, mode toggles, or any functional UI beyond a minimal placeholder page.
* **No data model or default data** -- the TypeScript `TreeNode`/`DashboardState` interfaces and Ukraine labor market data belong to Tasks 2 and 3.
* **No state management** -- no Zustand, useReducer, or custom hooks for tree state.
* **No charting libraries** -- Recharts or Chart.js installation is not part of this task.
* **No GitHub Pages deployment** -- CI/CD and GitHub Actions configuration are separate tasks.
* **No test files or test framework setup** -- Vitest configuration is a separate concern (though the `test` script in package.json should exist as a placeholder).
* **No i18n, SEO, or accessibility optimizations** -- these are later milestone concerns.
* **No custom ESLint or TypeScript config creation** -- the app should consume existing shared configs from `packages/config/`. If the existing shared configs need a React/Vite variant, that is a TL decision, not a PO requirement.
* **No mobile or responsive design** -- the scaffold page has no meaningful layout to make responsive.

## Open Questions

No blocking open questions identified. This is a well-constrained scaffolding task with clear inputs:
- The PRD specifies the tech stack (React 18+, TypeScript, Vite, Tailwind CSS).
- The monorepo structure is established (pnpm workspaces, Turborepo, shared configs in `packages/config/`).
- The app location is defined (`apps/labor-market-dashboard`).

Note for TL: The shared `packages/config/` currently has `next.json` and `nest.json` TypeScript configs but no React/Vite-specific config. The TL should decide whether to create a new shared config variant (e.g., `typescript/react-vite.json`) or have the app define its own `tsconfig.json` extending `base.json` directly with the necessary DOM/JSX overrides. This is a technical design decision, not a product question.

## Recommendations

1. **For TL:** The existing `typescript/next.json` config includes DOM libs and JSX support but also Next.js-specific settings (`jsx: "preserve"`, `next` plugin). A Vite+React app needs `jsx: "react-jsx"` instead. Consider creating a `typescript/react.json` shared config or simply extending `base.json` directly in the app's tsconfig.

2. **For TL:** The existing `eslint/base.js` config does not include React-specific rules (e.g., `eslint-plugin-react`, `eslint-plugin-react-hooks`). The app will likely need these. Decide whether to create a shared `eslint/react.js` config in `packages/config/` or configure ESLint locally in the app.

3. **For DEV:** The placeholder page should include the app title ("Labor Market Dashboard") and at least one Tailwind utility class to verify the full stack works. Keep it minimal -- a centered heading on a light background is sufficient.

4. **For QA:** Verification of this task is primarily about build toolchain correctness. The test strategy should focus on: (a) all monorepo scripts work, (b) TypeScript strict mode is enforced, (c) Tailwind classes render, (d) HMR works during development.
