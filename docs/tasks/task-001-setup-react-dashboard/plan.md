# Implementation Plan: task-001 -- Setup React Labor Market Dashboard App

Generated: 2026-02-17

## Status

Ready for implementation

## Overview

Create a React + Vite + TypeScript + Tailwind CSS v4 application in `apps/labor-market-dashboard/`, fully integrated with the existing Turborepo monorepo. This involves:

1. Creating shared TypeScript and ESLint configs for React apps in `packages/config/`
2. Scaffolding the Vite application with all necessary files
3. Installing dependencies and verifying the full toolchain (dev, build, lint, Tailwind)

**Estimated effort:** 0.5 days. Low risk. Pure toolchain scaffolding with no business logic.

---

## Phase 1: Shared Config Creation

### Step 1 -- Create shared TypeScript config for React/Vite

**File to CREATE:** `packages/config/typescript/react.json`

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

**Pattern note:** This follows the exact same pattern as `packages/config/typescript/next.json` and `packages/config/typescript/nest.json` -- all extend `base.json` and override specific compiler options.

---

### Step 2 -- Create shared ESLint config for React

**File to CREATE:** `packages/config/eslint/react.js`

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

**Pattern note:** This follows the exact same pattern as `packages/config/eslint/next.js` and `packages/config/eslint/nest.js` -- all extend `base.js` and add domain-specific plugins/rules.

---

### Step 3 -- Update `packages/config/package.json` with new exports and dependencies

**File to MODIFY:** `packages/config/package.json`

Replace the entire file with:

```json
{
  "name": "@template/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./eslint/base": "./eslint/base.js",
    "./eslint/next": "./eslint/next.js",
    "./eslint/nest": "./eslint/nest.js",
    "./eslint/react": "./eslint/react.js",
    "./prettier": "./prettier/index.js",
    "./typescript/base": "./typescript/base.json",
    "./typescript/next": "./typescript/next.json",
    "./typescript/nest": "./typescript/nest.json",
    "./typescript/react": "./typescript/react.json"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.20.0",
    "@typescript-eslint/parser": "^8.20.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.22",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "prettier": "^3.4.2",
    "typescript": "^5.7.3"
  }
}
```

**Changes from the current file:**
- Added `"./eslint/react": "./eslint/react.js"` to exports
- Added `"./typescript/react": "./typescript/react.json"` to exports
- Added `"eslint-plugin-react-hooks": "^5.1.0"` to devDependencies
- Added `"eslint-plugin-react-refresh": "^0.4.16"` to devDependencies

---

## Phase 2: App Scaffolding

### Step 4 -- Create `apps/labor-market-dashboard/package.json`

**File to CREATE:** `apps/labor-market-dashboard/package.json`

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

**Notes:**
- `"type": "module"` is required for Vite.
- `@template/config` as `workspace:*` provides access to all shared configs.
- The `build` script runs `tsc -b` first for type checking, then `vite build` for bundling.
- React 19 is current stable (the PRD says "React 18+" which is satisfied).

---

### Step 5 -- Create `apps/labor-market-dashboard/tsconfig.json`

**File to CREATE:** `apps/labor-market-dashboard/tsconfig.json`

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

---

### Step 6 -- Create `apps/labor-market-dashboard/tsconfig.node.json`

**File to CREATE:** `apps/labor-market-dashboard/tsconfig.node.json`

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

---

### Step 7 -- Create `apps/labor-market-dashboard/vite.config.ts`

**File to CREATE:** `apps/labor-market-dashboard/vite.config.ts`

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

---

### Step 8 -- Create `apps/labor-market-dashboard/.eslintrc.cjs`

**File to CREATE:** `apps/labor-market-dashboard/.eslintrc.cjs`

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

---

### Step 9 -- Create `apps/labor-market-dashboard/index.html`

**File to CREATE:** `apps/labor-market-dashboard/index.html`

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

---

### Step 10 -- Create `apps/labor-market-dashboard/src/vite-env.d.ts`

**File to CREATE:** `apps/labor-market-dashboard/src/vite-env.d.ts`

```typescript
/// <reference types="vite/client" />
```

---

### Step 11 -- Create `apps/labor-market-dashboard/src/index.css`

**File to CREATE:** `apps/labor-market-dashboard/src/index.css`

Tailwind CSS v4 uses CSS-first configuration. No `tailwind.config.js` needed.

```css
@import "tailwindcss";
```

---

### Step 12 -- Create `apps/labor-market-dashboard/src/App.css`

**File to CREATE:** `apps/labor-market-dashboard/src/App.css`

```css
/* App-specific styles will go here */
```

---

### Step 13 -- Create `apps/labor-market-dashboard/src/main.tsx`

**File to CREATE:** `apps/labor-market-dashboard/src/main.tsx`

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

---

### Step 14 -- Create `apps/labor-market-dashboard/src/App.tsx`

**File to CREATE:** `apps/labor-market-dashboard/src/App.tsx`

Minimal placeholder with Tailwind utility classes to verify full-stack integration.

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

---

## Phase 3: Gitignore and Cleanup

### Step 15 -- Update `.gitignore`

**File to MODIFY:** `.gitignore`

Add the following entry after the existing `# NestJS` section:

```
# Labor Market Dashboard
apps/labor-market-dashboard/dist/
```

**Note:** The root `.gitignore` already has a generic `dist/` entry at line 9, which should catch `apps/labor-market-dashboard/dist/` already. However, add the explicit entry for consistency with the existing app-specific patterns (`apps/web/.next/`, `apps/api/dist/`).

---

### Step 16 -- Remove `apps/.gitkeep`

**File to DELETE:** `apps/.gitkeep`

The `apps/` directory now has real content (`apps/labor-market-dashboard/`), so the `.gitkeep` placeholder is no longer needed.

**Command:** `rm /Users/user/dev/EU/apps/.gitkeep`

---

## Phase 4: Install Dependencies

### Step 17 -- Run `pnpm install`

**Command (from monorepo root):**

```bash
cd /Users/user/dev/EU && pnpm install
```

**Expected outcome:**
- All new dependencies resolve without errors
- `node_modules` is populated for the new app
- The workspace recognizes `@template/labor-market-dashboard`

**Troubleshooting:**
- If `eslint-plugin-react-hooks` or `eslint-plugin-react-refresh` fail to resolve, check that the version ranges in `packages/config/package.json` are correct
- If `@template/config` fails to link, verify `pnpm-workspace.yaml` includes `packages/*` (it does)

---

## Phase 5: Verification

### Step 18 -- Verify production build (`pnpm build`)

**Command:**

```bash
cd /Users/user/dev/EU && pnpm build
```

**Expected outcome:**
- Exit code 0
- `apps/labor-market-dashboard/dist/` is created and contains `index.html` plus JS/CSS bundles
- TypeScript type checking passes (the `tsc -b` step runs before `vite build`)
- Turborepo recognizes the new app in the build pipeline

**If it fails:**
- TypeScript errors: check that `react.json` config is correct and exports are wired up
- Vite errors: check that `vite.config.ts` imports resolve correctly
- Missing modules: re-run `pnpm install`

---

### Step 19 -- Verify lint (`pnpm lint`)

**Command:**

```bash
cd /Users/user/dev/EU && pnpm lint
```

**Expected outcome:**
- Exit code 0
- Zero errors on scaffold code
- ESLint resolves the shared React config through `@template/config/eslint/react`

**If it fails:**
- Config resolution error: verify `require.resolve("@template/config/eslint/react")` resolves in `.eslintrc.cjs`
- Plugin not found: verify `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` are in `packages/config/package.json` devDependencies
- Parse errors: verify `parserOptions.project` paths are correct in `.eslintrc.cjs`

---

### Step 20 -- Verify dev server (`pnpm dev`)

**Command:**

```bash
cd /Users/user/dev/EU && pnpm dev --filter @template/labor-market-dashboard
```

**Expected outcome:**
- Vite dev server starts on a local port (usually http://localhost:5173)
- The placeholder page renders in the browser with:
  - `bg-slate-50` light gray background
  - `text-blue-500` blue heading text
  - `shadow-sm` subtle box shadow on the card
  - `rounded-lg` rounded corners on the card
- HMR works (modify text in `App.tsx` and changes appear without full reload)

**Note:** This is a persistent command. Start it, verify visually, then stop with Ctrl+C.

---

### Step 21 -- Verify TypeScript strict mode enforcement

**Verification approach:**
1. Temporarily add `const x: any = 5;` to `apps/labor-market-dashboard/src/App.tsx`
2. Run `pnpm build` -- confirm it fails with a type/lint error related to `any`
3. Remove the temporary line
4. Run `pnpm build` again -- confirm it passes

This verifies that `strict: true` and `noImplicitAny: true` (inherited from `base.json`) and `@typescript-eslint/no-explicit-any: "error"` (from `base.js` ESLint config) are both active.

---

## Summary of All File Operations

### Files to CREATE (14 files):

| # | File Path | Description |
|---|-----------|-------------|
| 1 | `packages/config/typescript/react.json` | Shared TS config for React/Vite apps |
| 2 | `packages/config/eslint/react.js` | Shared ESLint config for React apps |
| 3 | `apps/labor-market-dashboard/package.json` | App package manifest |
| 4 | `apps/labor-market-dashboard/tsconfig.json` | App TS config (extends shared) |
| 5 | `apps/labor-market-dashboard/tsconfig.node.json` | TS config for Vite config file |
| 6 | `apps/labor-market-dashboard/vite.config.ts` | Vite bundler configuration |
| 7 | `apps/labor-market-dashboard/.eslintrc.cjs` | App ESLint config (extends shared) |
| 8 | `apps/labor-market-dashboard/index.html` | HTML entry point |
| 9 | `apps/labor-market-dashboard/src/vite-env.d.ts` | Vite client type declarations |
| 10 | `apps/labor-market-dashboard/src/index.css` | Tailwind CSS v4 entry point |
| 11 | `apps/labor-market-dashboard/src/App.css` | App-specific styles (empty placeholder) |
| 12 | `apps/labor-market-dashboard/src/main.tsx` | React entry point |
| 13 | `apps/labor-market-dashboard/src/App.tsx` | Root component with Tailwind placeholder |

### Files to MODIFY (2 files):

| # | File Path | What Changes |
|---|-----------|-------------|
| 1 | `packages/config/package.json` | Add 2 exports + 2 devDependencies |
| 2 | `.gitignore` | Add `apps/labor-market-dashboard/dist/` entry |

### Files to DELETE (1 file):

| # | File Path | Reason |
|---|-----------|--------|
| 1 | `apps/.gitkeep` | Directory now has real content |

---

## Dependencies

- No external blockers. This is task-001 with zero dependencies.
- All patterns are established in the monorepo (`packages/config/` export pattern, TypeScript config extension, ESLint config extension).

## Risks

- **Low:** Tailwind CSS v4 CSS-first config is newer but straightforward with the `@tailwindcss/vite` plugin.
- **Low:** ESLint v8 is in maintenance mode. This matches the existing monorepo setup. Migration to v9 flat config would be a separate monorepo-wide task.
- **Low:** `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` add React-specific deps to the shared config package, consistent with the existing pattern (`eslint-config-next` is already there).

## Acceptance Criteria Mapping

| Acceptance Criterion | Verified By |
|---------------------|-------------|
| `pnpm dev` starts Vite with HMR | Step 20 |
| `pnpm build` produces `dist/` with zero errors | Step 18 |
| `pnpm lint` passes with zero errors | Step 19 |
| TypeScript strict mode rejects `any` types | Step 21 |
| Tailwind utility classes render in browser | Step 20 |
| Turborepo recognizes app in all task pipelines | Steps 18, 19, 20 |
| React 18+, TypeScript 5+, Vite, Tailwind installed | Step 4 (package.json) |
| tsconfig extends shared config with strict mode | Step 5 (tsconfig.json) |
| ESLint extends shared config | Step 8 (.eslintrc.cjs) |
| Placeholder page visible with "Labor Market Dashboard" | Step 14 (App.tsx) |

---

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm build         # Web app must compile successfully, dist/ created
```

Additionally verify:

```bash
pnpm dev --filter @template/labor-market-dashboard   # Dev server starts, Tailwind renders
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
