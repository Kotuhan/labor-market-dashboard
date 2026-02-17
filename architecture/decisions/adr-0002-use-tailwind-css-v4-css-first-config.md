---
status: accepted
date: 2026-02-17
triggered-by: task-001
---

# ADR-0002: Use Tailwind CSS v4 with CSS-First Configuration

## Context and Problem Statement

The Labor Market Dashboard requires a styling solution for rapid UI development. The PRD specifies Tailwind CSS for utility-first responsive design. Tailwind CSS v4 (released stable in 2025) introduces a new CSS-first configuration model that eliminates the `tailwind.config.js` file, replacing it with CSS directives like `@import "tailwindcss"` and `@theme`. The project also uses Vite as its bundler, which has a dedicated Tailwind integration via `@tailwindcss/vite`.

## Decision Drivers

- PRD specifies Tailwind CSS for styling
- Project uses Vite 6 as the build tool (per ADR-0001)
- Should use current stable version to avoid tech debt
- Configuration should be as simple as possible for a new project
- Future tasks will need theme customization for charting library integration

## Considered Options

- Tailwind CSS v4 with `@tailwindcss/vite` plugin and CSS-first config
- Tailwind CSS v4 with `@tailwindcss/postcss` plugin
- Tailwind CSS v3 with `tailwind.config.js`

## Decision Outcome

Chosen option: "Tailwind CSS v4 with `@tailwindcss/vite` plugin and CSS-first config", because the Vite plugin is the officially recommended integration for Vite projects, CSS-first config is simpler (no JS config file), and v4 is the current stable version.

### Consequences

- Good, because no `tailwind.config.js` or `postcss.config.js` files are needed -- styling configuration lives entirely in CSS
- Good, because the `@tailwindcss/vite` plugin provides tight integration with Vite's build pipeline and HMR
- Good, because CSS-first config with `@theme` directive allows theme customization without a separate JS file
- Bad, because if charting libraries (Recharts) need programmatic access to theme colors, values must be extracted from CSS custom properties rather than importing a JS config object (mitigated: CSS custom properties are a standard approach)
- Bad, because Tailwind v4 is a major version change from v3 and some community plugins/examples may still reference v3 patterns (mitigated: v4 has been stable since early 2025)

## More Information

- CSS entry point: `apps/labor-market-dashboard/src/index.css` contains `@import "tailwindcss"`
- Vite config: `apps/labor-market-dashboard/vite.config.ts` registers `@tailwindcss/vite` plugin
- No `tailwind.config.js` or `postcss.config.js` should be created for this app
- Theme customization uses the `@theme` CSS directive, not a JS config file
- Related: [ADR-0001](adr-0001-adopt-react-vite-typescript-frontend-stack.md) (build tool)
