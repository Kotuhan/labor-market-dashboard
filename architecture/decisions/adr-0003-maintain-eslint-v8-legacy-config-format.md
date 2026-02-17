---
status: accepted
date: 2026-02-17
triggered-by: task-001
---

# ADR-0003: Maintain ESLint v8 Legacy Config Format Across the Monorepo

## Context and Problem Statement

The monorepo's shared linting infrastructure (`packages/config/eslint/`) uses ESLint v8 with the legacy `.eslintrc.cjs` configuration format. ESLint v9 introduced a new "flat config" format (`eslint.config.js`) that is not backward-compatible with the legacy format. The new React/Vite app needs an ESLint configuration, and the decision is whether to adopt the new format for this app or maintain consistency with the existing monorepo infrastructure.

## Decision Drivers

- Monorepo consistency: all existing configs (`base.js`, `next.js`, `nest.js`) use legacy format
- ESLint v8 is in maintenance mode but still receives security patches
- Mixing v8 legacy config and v9 flat config in the same monorepo is not supported
- Migration to v9 would require updating all shared configs, all app configs, and testing all lint rules simultaneously
- The new React app is the first frontend app and should not introduce config format fragmentation

## Considered Options

- Maintain ESLint v8 legacy format (`.eslintrc.cjs`) for the new app
- Migrate the entire monorepo to ESLint v9 flat config as part of this task
- Use ESLint v9 flat config for the new app only, while keeping v8 for others

## Decision Outcome

Chosen option: "Maintain ESLint v8 legacy format", because the monorepo's shared config infrastructure is built on v8 legacy format, mixing formats is not supported, and migrating the entire monorepo is out of scope for a scaffolding task. The new `packages/config/eslint/react.js` follows the exact same pattern as `nest.js` and `next.js`.

### Consequences

- Good, because all apps in the monorepo use the same ESLint config format, reducing cognitive overhead
- Good, because the shared config extension pattern (`require.resolve("@template/config/eslint/{variant}")`) works consistently across all apps
- Good, because no risk of breaking existing lint configurations for other app types
- Bad, because ESLint v8 is in maintenance mode and will eventually reach end-of-life
- Bad, because the longer the migration is deferred, the more configs will need updating when it happens

## More Information

- Shared React ESLint config: `packages/config/eslint/react.js`
- App ESLint config: `apps/labor-market-dashboard/.eslintrc.cjs`
- ESLint v9 migration should be tracked as a separate monorepo-wide task when the ecosystem (plugins, shared configs) has broader v9 support
- Key plugins used in React config: `eslint-plugin-react-hooks` (^5.1.0), `eslint-plugin-react-refresh` (^0.4.16)
- Related: [ADR-0001](adr-0001-adopt-react-vite-typescript-frontend-stack.md) (frontend stack)
