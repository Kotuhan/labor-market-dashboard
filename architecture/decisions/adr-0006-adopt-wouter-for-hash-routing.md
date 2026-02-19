---
status: accepted
date: 2026-02-19
triggered-by: task-011
---

# ADR-0006: Adopt wouter for Hash-Based Client-Side Routing

## Context and Problem Statement

The Labor Market Dashboard needs client-side routing to support a new Tree Configuration Page alongside the existing Dashboard view. The application is hosted on GitHub Pages, which does not support server-side URL rewriting, making hash-based routing (`/#/config`) necessary. The project's architecture favors minimal dependencies (see ADR-0004 for useReducer over Zustand, ADR-0005 for Recharts 2.x over 3.x), so the routing library must be lightweight.

## Decision Drivers

- GitHub Pages hosting requires hash-based routing (no server-side rewrites)
- Bundle size target: < 500KB gzipped (NFR-07); current bundle is ~175KB
- Only 2 routes needed (`/` and `/config`) -- minimal routing features required
- Must support React 19 and TypeScript with built-in type declarations
- Hash routing hook must be available (not just history-based routing)

## Considered Options

- wouter (~2KB gzipped)
- react-router-dom (~18KB gzipped)
- TanStack Router (~12KB gzipped)
- Manual `window.location.hash` with custom hooks (0KB)

## Decision Outcome

Chosen option: "wouter", because it provides the smallest bundle impact (~2KB gzipped) while offering proper React integration (Router, Route, Link components, `useHashLocation` hook) that the manual approach lacks. react-router-dom was rejected as significantly heavier (~18KB) with far more features than needed for 2 routes. TanStack Router was rejected for higher config overhead and larger bundle. The manual approach was rejected because it lacks declarative route matching, Link components with active state, and would require reimplementing routing primitives.

### Consequences

- Good, because ~2KB gzipped addition keeps total bundle well under the 500KB budget (~177KB total)
- Good, because wouter ships TypeScript declarations and supports React 19
- Good, because `useHashLocation` hook enables hash routing with zero configuration
- Good, because the API is minimal (Router, Route, Link, useLocation) matching the project's lightweight philosophy
- Bad, because wouter has a smaller community than react-router-dom, with fewer StackOverflow answers and tutorials
- Bad, because if routing needs grow significantly (nested layouts, route guards, data loaders), migration to react-router-dom may be warranted

## More Information

- wouter hash routing: `<Router hook={useHashLocation}>` wraps the app; `<Route path="/config">` matches `/#/config`
- State preservation: `useTreeState()` is called in App.tsx above the Router, so state persists across route changes
- Escalation path: If a third page or complex routing features (nested routes, loaders, route-level code splitting) are added, re-evaluate migration to react-router-dom or TanStack Router. The current wouter integration touches only `App.tsx` and `Sidebar.tsx`, making migration straightforward.
- Related: [ADR-0004](adr-0004-use-react-usereducer-for-state-management.md) (lightweight state), [ADR-0005](adr-0005-use-recharts-2x-for-pie-chart-visualization.md) (lightweight charting)
