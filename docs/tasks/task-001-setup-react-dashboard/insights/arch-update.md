# Architecture Update: task-001
Generated: 2026-02-17

## Impact Assessment

Task-001 established the foundational frontend architecture for the project. This is the first real application in the monorepo, introducing:

1. **New application component**: `apps/labor-market-dashboard/` -- a React 19 + Vite 6 + TypeScript 5.7 single-page application
2. **Extended shared config infrastructure**: Two new config variants (`typescript/react.json`, `eslint/react.js`) added to `packages/config/`, reusable by any future React/Vite apps in the monorepo
3. **Frontend tech stack locked in**: React 19, Vite 6, TypeScript 5.7 (strict), Tailwind CSS v4, ESLint v8
4. **Implementation deviations from plan**: Build script changed from `tsc -b` to `tsc --noEmit` (avoids emit pollution), `@types/node` added for `vite.config.ts`, tsconfig `references` removed as unnecessary without `tsc -b`

No new protocols, event schemas, or timing parameters were introduced. No backend integration exists at this stage.

## Updates Made

- `architecture/overview.md`: Updated tech stack table with exact versions and ADR references. Added shared config package section. Split module inventory into "Implemented" (task-001 modules) and "Planned" (future modules). Added Architectural Decisions summary table linking to all three ADRs.
- `architecture/CLAUDE.md`: Updated next available ADR number from 0001 to 0004.

## Retroactive ADRs Created

- **ADR-0001**: [Adopt React 19 + Vite 6 + TypeScript 5.7 as frontend stack](../../../architecture/decisions/adr-0001-adopt-react-vite-typescript-frontend-stack.md) -- Documents the core framework, build tool, and language choices. Notes the `tsc --noEmit` deviation and shared config extension pattern.
- **ADR-0002**: [Use Tailwind CSS v4 with CSS-first configuration](../../../architecture/decisions/adr-0002-use-tailwind-css-v4-css-first-config.md) -- Documents the CSS-first config approach (no `tailwind.config.js`), the `@tailwindcss/vite` plugin choice over PostCSS, and implications for future charting library integration.
- **ADR-0003**: [Maintain ESLint v8 legacy config format across monorepo](../../../architecture/decisions/adr-0003-maintain-eslint-v8-legacy-config-format.md) -- Documents the decision to maintain ESLint v8 `.eslintrc.cjs` format for monorepo consistency, deferring v9 flat config migration to a separate task.

## Recommendations

- **ESLint v9 migration**: Should be tracked as a future monorepo-wide task. ESLint v8 is in maintenance mode. When the plugin ecosystem (especially `@typescript-eslint`, `eslint-plugin-react-hooks`) has stable v9 flat config support, the migration should be planned.
- **Charting library integration**: When Recharts is added (future task), verify that Tailwind CSS v4 theme values can be accessed from CSS custom properties. If programmatic theme access is needed, document the approach in the relevant task's TL design.
- **Test framework setup**: Vitest + React Testing Library are in the tech stack but not yet configured. The `test` script is currently a placeholder. This should be addressed in an upcoming task.
- **Build script pattern**: The deviation from `tsc -b` to `tsc --noEmit` is documented in ADR-0001 and in `apps/labor-market-dashboard/CLAUDE.md`. Future React/Vite apps should follow the same pattern.
