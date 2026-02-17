# Technical Design: task-001
Generated: 2026-02-17

## Overview

Create a new React + Vite + TypeScript + Tailwind CSS v4 application in `apps/labor-market-dashboard/`, fully integrated with the existing Turborepo monorepo. This involves creating shared TypeScript and ESLint configs for React apps in `packages/config/`, scaffolding the Vite application, and verifying end-to-end toolchain integration (dev server, build, lint, Tailwind rendering).

## Technical Notes

- **Affected modules:** `packages/config/` (new shared configs), `apps/labor-market-dashboard/` (new app)
- **New modules/entities to create:**
  - `packages/config/typescript/react.json` -- shared TypeScript config for React/Vite apps
  - `packages/config/eslint/react.js` -- shared ESLint config for React apps
  - `apps/labor-market-dashboard/` -- new Vite + React application
- **DB schema change required?** No.
- **Architectural considerations:**
  - Follow the established monorepo pattern: shared configs in `packages/config/` with exports in its `package.json`, app-level configs extend shared configs.
  - Tailwind CSS v4 uses CSS-first configuration (no `tailwind.config.js`). The `@tailwindcss/vite` plugin is the recommended integration for Vite projects.
  - ESLint remains on v8 (legacy config format with `.eslintrc.cjs`) to match the existing monorepo setup. The shared config package uses `eslint@^8.57.0`.
  - Vite uses `moduleResolution: "Bundler"` which differs from the base config's `"NodeNext"`. The `react.json` tsconfig handles this override.
- **Known risks or trade-offs:**
  - **Low risk:** Tailwind CSS v4 is a major version change from v3. The CSS-first config approach means no `tailwind.config.js`. If the project later needs programmatic theme access (e.g., for charting library colors), values can still be extracted from CSS custom properties.
  - **Low risk:** ESLint v8 is in maintenance mode. The monorepo uses legacy `.eslintrc` config format. This is fine for now -- migration to ESLint v9 flat config would be a separate task across the entire monorepo.
  - **Low risk:** Adding `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` as devDependencies to `packages/config/` adds React-specific dependencies to the shared config package. This is consistent with the existing pattern where `eslint-config-next` is already listed there.
- **Test plan:** Manual verification through monorepo commands (`pnpm dev`, `pnpm build`, `pnpm lint`). No unit tests for scaffolding. The `test` script in the app's `package.json` should exist as a placeholder that exits cleanly.

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Create shared `typescript/react.json` in `packages/config/` | Follows the established pattern (`next.json`, `nest.json` both extend `base.json`). Provides a reusable React/Vite tsconfig for any future React apps. | Extend `base.json` directly in the app's tsconfig with inline overrides. Rejected because it would break the DRY pattern already established and would need to be duplicated for each React app. |
| Create shared `eslint/react.js` in `packages/config/` | Follows the established pattern (`next.js`, `nest.js` both extend `base.js`). Centralizes React-specific lint rules. | Configure ESLint locally in the app only. Rejected because the monorepo already centralizes ESLint configs and a local-only approach would break the pattern. |
| Use `@tailwindcss/vite` plugin (not PostCSS plugin) | Official Tailwind v4 docs recommend the Vite plugin for Vite projects. It is simpler (one plugin in `vite.config.ts` vs. PostCSS config file + plugin). Provides better integration with Vite's build pipeline. | `@tailwindcss/postcss` plugin. Viable but adds an extra config file (`postcss.config.js`) and is recommended only for non-Vite bundlers. |
| Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) | v4 is the current stable version. CSS-first config is simpler, uses `@theme` in CSS. No JS config file needed. | Tailwind CSS v3 with `tailwind.config.js`. Rejected -- v3 is legacy and v4 is production-ready as of 2025. Starting a new project on v3 would create immediate tech debt. |
| ESLint v8 legacy config format (`.eslintrc.cjs`) | Matches existing monorepo config infrastructure. All shared configs use the legacy format. Mixing v9 flat config with v8 legacy configs is not supported. | ESLint v9 flat config. Rejected for this task -- would require migrating the entire `packages/config/eslint/` infrastructure. Could be a separate monorepo-wide task later. |
| Use `vite-env.d.ts` for Vite client types | Standard Vite approach. Provides types for `import.meta.env`, asset imports (`.svg`, `.png`), and CSS modules. | Manual ambient declarations. Rejected -- `vite-env.d.ts` is the canonical approach and covers all Vite-specific type needs. |

## Implementation Steps

### Step 1 -- Create shared TypeScript config for React/Vite (`packages/config/typescript/react.json`)

Create a new file that extends `base.json` with React/Vite-specific overrides, following the same pattern as `next.json` and `nest.json`.

- **Files to create:**
  - `packages/config/typescript/react.json`
- **Files to modify:**
  - `packages/config/package.json` -- add export `"./typescript/react": "./typescript/react.json"`

**Config content for `react.json`:**
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React (Vite)",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "declaration": false,
    "declarationMap": false,
    "allowImportingTsExtensions": true
  }
}
```

Key differences from `next.json`:
- `jsx: "react-jsx"` instead of `"preserve"` (Vite handles JSX transformation, Next.js defers to SWC)
- `target: "ES2020"` (Vite targets modern browsers)
- No Next.js plugin
- `allowImportingTsExtensions: true` (safe with `noEmit: true`, enables Vite's module resolution)

**Verification:** File exists, JSON is valid, export is listed in `packages/config/package.json`.

---

### Step 2 -- Create shared ESLint config for React (`packages/config/eslint/react.js`)

Create a new config extending `base.js` with React-specific plugins, following the same pattern as `next.js` and `nest.js`.

- **Files to create:**
  - `packages/config/eslint/react.js`
- **Files to modify:**
  - `packages/config/package.json` -- add export `"./eslint/react": "./eslint/react.js"`, add `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` to devDependencies

**Config content for `react.js`:**
```javascript
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "./base.js",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["react-refresh"],
  env: {
    browser: true,
    es2022: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
  ignorePatterns: ["node_modules/", "dist/", "coverage/"],
};
```

This uses:
- `eslint-plugin-react-hooks` (rules of hooks enforcement, recommended config)
- `eslint-plugin-react-refresh` (ensures components are compatible with Vite HMR fast refresh)

**Verification:** File exists, exports added to `packages/config/package.json`. After `pnpm install` in Step 4, lint should be able to resolve the config.

---

### Step 3 -- Scaffold the Vite + React + TypeScript app directory structure

Create the `apps/labor-market-dashboard/` directory with all necessary files.

- **Files to create:**
  - `apps/labor-market-dashboard/package.json`
  - `apps/labor-market-dashboard/tsconfig.json`
  - `apps/labor-market-dashboard/tsconfig.node.json`
  - `apps/labor-market-dashboard/vite.config.ts`
  - `apps/labor-market-dashboard/.eslintrc.cjs`
  - `apps/labor-market-dashboard/index.html`
  - `apps/labor-market-dashboard/src/main.tsx`
  - `apps/labor-market-dashboard/src/App.tsx`
  - `apps/labor-market-dashboard/src/App.css`
  - `apps/labor-market-dashboard/src/index.css`
  - `apps/labor-market-dashboard/src/vite-env.d.ts`
- **Files to remove:**
  - `apps/.gitkeep` (the directory now has real content)

**`package.json`:**
```json
{
  "name": "@template/labor-market-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "test": "echo \"No tests yet\" && exit 0",
    "clean": "rm -rf dist node_modules .turbo"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@template/config": "workspace:*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.7.3",
    "vite": "^6.0.0",
    "eslint": "^8.57.0"
  }
}
```

Notes:
- React 19 is the current stable version (released Dec 2024). The PRD says "React 18+" which is satisfied.
- `@template/config` as `workspace:*` provides access to all shared configs.
- `type: "module"` is required for Vite.
- The `build` script runs `tsc -b` first for type checking, then `vite build` for bundling.

**`tsconfig.json`:**
```json
{
  "extends": "@template/config/typescript/react",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**`tsconfig.node.json`:**
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
    "declarationMap": false
  },
  "include": ["vite.config.ts"]
}
```

**`vite.config.ts`:**
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

**`.eslintrc.cjs`:**
```javascript
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve("@template/config/eslint/react")],
  parserOptions: {
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
};
```

**`index.html`:**
```html
<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Labor Market Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`src/index.css`** (Tailwind v4 CSS-first config):
```css
@import "tailwindcss";
```

**`src/App.css`:**
```css
/* App-specific styles will go here */
```

**`src/vite-env.d.ts`:**
```typescript
/// <reference types="vite/client" />
```

**`src/main.tsx`:**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**`src/App.tsx`** (minimal placeholder with Tailwind classes to verify full stack):
```typescript
function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-500">
          Labor Market Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Interactive labor market calculator for Ukraine
        </p>
      </div>
    </div>
  );
}

export default App;
```

**Verification:** All files exist in the correct locations. Directory structure matches the plan.

---

### Step 4 -- Install dependencies

Run `pnpm install` from the monorepo root to resolve all new dependencies.

- **Commands:**
  - `pnpm install` (from monorepo root)
- **Verification:** Command completes without errors. `node_modules` is populated. `pnpm ls --filter @template/labor-market-dashboard` shows all expected dependencies.

---

### Step 5 -- Update .gitignore for the new app

Add app-specific ignore rules for the dashboard app.

- **Files to modify:**
  - `.gitignore` -- add entry for `apps/labor-market-dashboard/dist/`

**Verification:** The new ignore entry is present in `.gitignore`.

---

### Step 6 -- Verify dev server (`pnpm dev`)

Start the development server and confirm it works.

- **Commands:**
  - `pnpm dev --filter @template/labor-market-dashboard` or `pnpm dev` from root
- **Verification:** Vite dev server starts, serves the placeholder page in the browser, HMR works (modify text in `App.tsx` and see the change without full reload).

---

### Step 7 -- Verify production build (`pnpm build`)

Run the production build and confirm it produces artifacts.

- **Commands:**
  - `pnpm build` (from monorepo root)
- **Verification:**
  - Command completes with exit code 0.
  - `apps/labor-market-dashboard/dist/` exists and contains `index.html` plus JS/CSS bundles.
  - TypeScript type checking passes (the `tsc -b` step in the build script).

---

### Step 8 -- Verify lint (`pnpm lint`)

Run the linter and confirm zero errors on scaffold code.

- **Commands:**
  - `pnpm lint` (from monorepo root)
- **Verification:** Command completes with zero errors. ESLint resolves the React config and all rules pass.

---

### Step 9 -- Verify TypeScript strict mode enforcement

Confirm that strict mode catches `any` types.

- **Verification approach:** Temporarily add a line like `const x: any = 5;` to `App.tsx`, run `pnpm build`, confirm it fails with `noImplicitAny` / `@typescript-eslint/no-explicit-any` error. Remove the temporary line.

---

### Step 10 -- Verify Tailwind CSS rendering

Confirm Tailwind utility classes render correctly.

- **Verification approach:** Start dev server, open the browser, confirm:
  - `bg-slate-50` applies the light gray background
  - `text-blue-500` applies blue text to the heading
  - `shadow-sm` applies a subtle box shadow
  - `rounded-lg` applies rounded corners

---

### Step 11 -- Final cleanup and verification

- Remove `apps/.gitkeep` (the directory now has real content).
- Run full verification suite: `pnpm lint && pnpm build`.
- Confirm Turborepo task graph includes the new app for all tasks (`build`, `dev`, `lint`, `test`, `clean`).

**Verification:** `pnpm build` and `pnpm lint` both pass from the monorepo root. The app is listed in Turborepo's task output.

## Complexity Assessment

- **Estimated effort:** 0.5 days (half a day)
- **Risk level:** Low
- **Dependencies:** None (this is task-001 with zero dependencies)
- **Complexity factors:**
  - All patterns are well-established in the monorepo (config extension, package exports)
  - Tailwind CSS v4 is the only somewhat novel element (CSS-first config), but the Vite plugin integration is straightforward
  - No business logic, no data model, no state management -- pure toolchain scaffolding

## Test Strategy

- **Unit tests:** None for this scaffolding task. The `test` script exists as a placeholder.
- **Integration tests:** None needed.
- **Manual verification (primary):**
  1. `pnpm dev` starts Vite dev server with HMR
  2. `pnpm build` produces `dist/` with zero errors
  3. `pnpm lint` passes with zero errors
  4. TypeScript strict mode rejects `any` types
  5. Tailwind utility classes render visually in the browser
  6. Turborepo recognizes the app in all task pipelines

## Open Technical Questions

None. All three TL decisions flagged by PO (TypeScript config, ESLint config, Tailwind CSS v4 approach) have been resolved in the Architecture Decisions table above.
