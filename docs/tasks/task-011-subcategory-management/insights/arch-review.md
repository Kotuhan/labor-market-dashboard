# Architecture Review: task-011
Generated: 2026-02-18
Iteration: 1

## Verdict: APPROVED

## Review Summary

The TL design is well-aligned with the existing architecture. It makes sound choices -- wouter for minimal routing, props drilling through AppLayout instead of premature Context, extending the existing TreeAction union with 4 new actions, and preserving the TreeNode interface. All decisions are consistent with established ADRs and documented conventions. The design is approved with two conditions that must be addressed before or during implementation.

## Checklist
- [x] Consistent with existing ADRs
- [x] Event contracts maintained or properly extended
- [x] Component boundaries respected
- [x] Protocol conventions followed
- [x] No undocumented architectural decisions

## Conditions

### Condition 1: Create ADR-0006 for wouter adoption

Wouter is the first routing library added to the project. This is a new architectural decision that crosses the significance threshold -- it establishes the routing pattern for all future multi-page navigation. An ADR must be created using `architecture/decisions/_template.md` before or during subtask 1 (core infrastructure). The ADR should document:
- Why wouter was chosen over react-router-dom and TanStack Router
- Hash routing rationale (GitHub Pages constraint)
- The `useHashLocation` hook pattern
- Bundle size comparison (~2KB vs ~18KB for react-router-dom)
- Escalation path: when to reconsider (e.g., if >5 routes are needed, or if data loaders become relevant)

**Reference**: ADR-0004 and ADR-0005 both documented their library selection rationale. A routing library warrants the same treatment.

### Condition 2: Update `architecture/overview.md` during arch-update stage

The overview currently lists "No router" in the architectural context and describes App.tsx as a "pure composition root with no routing logic." These sections must be updated to reflect:
- wouter as a new tech stack entry in the Tech Stack table
- App.tsx's new role as router boundary
- The 2-page structure (Dashboard, Configuration)
- Component count increase from 10 to ~18
- 9 action types (up from 5) in the TreeAction union

This will happen naturally during the arch-update stage after implementation, but is noted here as a mandatory condition.

## Architecture Impact

This task introduces several meaningful architectural changes:

### New Dependency: wouter (~2KB gzipped)

The TL correctly identifies wouter as the right-sized solution. At ~2KB gzipped, it adds negligible bundle impact against the current ~175KB footprint, keeping the project well within the 500KB budget (NFR-07). This is consistent with the lightweight dependency philosophy established by ADR-0004 (useReducer over Zustand) and ADR-0005 (Recharts 2.x over 3.x to avoid Redux dependencies).

### App.tsx Role Change: Composition Root to Router Boundary

App.tsx transitions from a pure composition root (zero logic) to a router boundary that wraps `useTreeState()` above the router. This is the minimal viable change -- `useTreeState()` stays in the same component, both pages receive state/dispatch via props through AppLayout. The composition root pattern is preserved at the page level (DashboardPage and ConfigPage become the new composition roots for their respective views).

This is consistent with ADR-0004's anticipated escalation path: "if the app grows to need cross-component state sharing (e.g., multiple dashboard panels), useReducer would need to be lifted to context." The TL design correctly avoids introducing Context for a 2-page app and instead uses props drilling through AppLayout, which is architecturally sound.

### TreeAction Union Extension (5 -> 9 actions)

The 4 new actions (`ADD_INDUSTRY`, `REMOVE_INDUSTRY`, `ADD_SUBCATEGORY`, `REMOVE_SUBCATEGORY`) follow the established discriminated union pattern. The action payloads are minimal and appropriate -- `ADD_*` actions carry `label` (user-provided) and a parent identifier, while `REMOVE_*` actions carry only `nodeId`. The reducer remains the single source of truth for all tree mutations, consistent with ADR-0004.

### Component Directory Structure

The `src/components/config/` and `src/components/layout/` subdirectories are a reasonable organizational choice. The flat `components/` directory currently has 10 components; adding 8 more would dilute the namespace. Subdirectories with barrel exports maintain the existing import pattern while grouping related components. All estimated component sizes are within the 200-line limit.

### `defaultPercentage: 0` Convention for Custom Nodes

Using the existing `defaultPercentage` field with a value of `0` to distinguish custom nodes from default ones is a clean solution that avoids modifying the `TreeNode` interface. Since `RESET` restores `initialState` (which contains only default nodes), custom nodes are naturally excluded. The `0` value is semantically correct -- custom nodes have no "default" percentage to reset to.

### Dynamic Color Palette

The `DYNAMIC_COLOR_PALETTE` approach for new industries beyond the KVED-16 palette is acceptable. The cycling behavior for >8 custom industries is a reasonable degradation. This extends the existing color system in `chartColors.ts` without modifying the existing KVED-to-hex mapping.

### Heading Hierarchy Across Pages

The design correctly maintains WCAG heading hierarchy: DashboardPage keeps `<h1>` in DashboardHeader, ConfigPage introduces its own `<h1>` ("Configuration"). Both pages use `<h2>` for gender sections. Since only one page is rendered at a time, there is no duplicate `<h1>` concern.

### TreePanel Auto-Expand Enhancement (Step 16)

The `useEffect` to auto-expand newly expandable nodes when children change is a necessary cross-page integration concern. When a user adds the first subcategory on the config page, the industry must auto-expand on the dashboard. This modifies TreePanel's behavior in a backward-compatible way -- existing default nodes are already expanded on mount via `collectExpandableIds()`.
