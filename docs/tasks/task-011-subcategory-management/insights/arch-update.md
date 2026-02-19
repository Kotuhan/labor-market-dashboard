# Architecture Update: task-011
Generated: 2026-02-19

## Impact Assessment

Task-011 introduced significant architectural changes: the first client-side routing layer (wouter with hash routing), a second page (ConfigPage), layout components (AppLayout + Sidebar), 4 new tree mutation reducer actions (expanding TreeAction from 5 to 9 members), and a dynamic color assignment system for user-added industries. App.tsx transitioned from a pure composition root to a router boundary.

**Scope of change**: This is the largest architectural evolution since the initial scaffold. It introduces:
- A routing layer (wouter, ADR-0006) -- first external navigation dependency
- A second page (ConfigPage alongside DashboardPage) -- first multi-page structure
- Component subdirectory organization (layout/, config/) -- first subdirectory pattern
- Tree mutation actions (ADD/REMOVE_INDUSTRY, ADD/REMOVE_SUBCATEGORY) -- first CRUD operations on the tree
- Dynamic color palette for custom industries -- first runtime color assignment

**Total component count**: 21 (was 14 before task-011: +1 DashboardPage, +2 layout, +6 config, -2 adjusted counts)

## Updates Made

- `architecture/overview.md`: Comprehensive updates across multiple sections:
  - **System Components table**: Added Routing row (wouter 3.x, ADR-0006). Updated State Management description to reference 9 action types.
  - **Data Architecture section**: Added "Routing Architecture" subsection documenting 2 routes, state persistence pattern, and layout structure.
  - **Tech Stack table**: Added wouter 3.x row with ADR-0006 reference.
  - **Module Inventory**: Updated 8 existing entries (App Shell, Action Types, Tree Utils, useTreeState Hook, Components Barrel, Chart Colors, and corresponding test entries) to reflect task-011 changes. Added 19 new module entries for all new source and test files.
  - **Architectural Decisions table**: Added ADR-0006 row.
  - **Development Conventions section**: Replaced "Composition Root Pattern" with "Router Boundary Pattern" reflecting App.tsx's new role. Added 5 new patterns: Layout Components Pattern, Config Components Pattern, Dynamic Color Assignment Pattern, Custom Node Convention, Tree Mutation Actions Pattern.
  - **Planned section**: Updated to note Tree Configuration Page completion.

## Retroactive ADRs Created

None -- no implicit decisions found. ADR-0006 (Adopt wouter for hash-based client-side routing) was already created during subtask 11.1 as required by the arch-review condition. All other design decisions (props drilling over Context, `defaultPercentage: 0` convention, native `<dialog>`, component subdirectories, equal redistribution, dynamic color cycling) are implementation-level choices consistent with existing ADRs and documented in CLAUDE.md and overview.md patterns.

## Recommendations

1. **Routing escalation threshold**: ADR-0006 notes that adding a third page or complex routing features (nested routes, loaders, code splitting) should trigger re-evaluation of wouter vs react-router-dom or TanStack Router. Monitor this.

2. **Bundle size monitoring**: Bundle grew from ~176KB to ~192KB gzipped (still well under 500KB NFR-07 budget). The 16KB increase includes wouter (~2KB), new components, and new utility code. Future tasks should continue tracking this.

3. **State management scalability**: With 9 action types and 2 pages sharing state via props, the architecture remains clean. However, if a third page is added, consider lifting state into React Context (per ADR-0004's escalation path) to avoid deep props threading through AppLayout.

4. **Tree node count growth**: The default tree has 55 nodes, but users can now add unlimited industries and subcategories. Performance of the immutable tree update pattern (recursive spread) should be monitored if users create very large trees. The current approach is fine for typical use (< 200 nodes).

5. **Test count**: 407 total tests across the app, up from ~300 before task-011. Test execution time should be monitored as the suite grows.
