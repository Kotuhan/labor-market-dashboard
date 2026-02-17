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
  tsconfig.json           # Extends @template/config/typescript/react
  tsconfig.node.json      # For vite.config.ts only
  .eslintrc.cjs           # Extends @template/config/eslint/react
  package.json            # type: "module", @template/config as workspace:*
  src/
    main.tsx              # React entry point (StrictMode)
    App.tsx               # Root component
    App.css               # App-specific styles (placeholder)
    index.css             # Tailwind entry: @import "tailwindcss"
    vite-env.d.ts         # Vite client type declarations
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

## DO NOT

- Use `tsc -b` (project build mode) -- it emits `.d.ts.map` and `.js.map` files even with `noEmit` in referenced projects, polluting the directory. Use `tsc --noEmit` instead.
- Add `"references"` to `tsconfig.json` -- unnecessary without `tsc -b` and causes emit pollution
- Create a `tailwind.config.js` -- Tailwind v4 uses CSS-first config via `@import "tailwindcss"` and `@theme` directive
- Create a `postcss.config.js` -- the `@tailwindcss/vite` plugin replaces PostCSS for Vite projects
- Forget `@types/node` in devDependencies -- needed for `vite.config.ts` to resolve Node.js built-ins (`path`, `__dirname`)
