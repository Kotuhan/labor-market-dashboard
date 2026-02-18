# Architecture Update: task-008
Generated: 2026-02-17

## Impact Assessment

Task-008 introduced significant component-level changes that affect the architecture documentation but do not alter fundamental architectural decisions. The key impact areas are:

1. **Component inventory expanded**: 4 new components (ModeToggle, ResetButton, DashboardHeader, GenderSection) bringing the total to 10 components in the barrel export.
2. **TreePanel responsibility boundary changed**: TreePanel now operates on a single gender node (`genderNode: TreeNode`) instead of the full tree root. This narrows its scope from "renders all genders" to "renders one gender's industry subtree". The change was explicitly designed in TL design and approved in arch-review.
3. **App.tsx evolved from placeholder to composition root**: App.tsx went from a bare TreePanel wrapper to the full dashboard composition root with DashboardHeader (sticky) + 2 GenderSections in CSS Grid. It now contains zero business logic -- purely compositional.
4. **TreeRow gained visualization responsibilities**: TreeRow now renders deviation warnings (free mode) and mini subcategory pie charts for expanded nodes, in addition to its existing chevron + Slider functionality.
5. **New utility function**: `formatPopulation()` added to `format.ts` for full-number display (no "тис." abbreviation) in the population input.
6. **All planned components now implemented**: ModeToggle, SummaryBar (replaced by DashboardHeader), and ResetButton are no longer in the "Planned" section.

No new protocols, event types, timing parameters, or external integrations were introduced. All changes are within the existing single-SPA React architecture governed by ADRs 0001-0005.

## Updates Made

- `architecture/overview.md`: Updated App Shell entry to reflect composition root role (task-008)
- `architecture/overview.md`: Updated Components Barrel entry to reflect 10 components (was 6)
- `architecture/overview.md`: Updated Format Utility entry to include `formatPopulation()` function
- `architecture/overview.md`: Updated Format Tests entry to reflect 19 tests (was 13, added formatPopulation tests)
- `architecture/overview.md`: Added 4 new component entries (ModeToggle, ResetButton, DashboardHeader, GenderSection) with test entries to Module Inventory
- `architecture/overview.md`: Updated TreePanel entry to reflect single-gender API and deviation warnings
- `architecture/overview.md`: Updated TreeRow entry to include deviation warnings and mini pie charts
- `architecture/overview.md`: Updated TreeRow Tests (32 tests, was 21) and TreePanel Tests (16 tests, was 14) entries
- `architecture/overview.md`: Replaced "Planned" module table with completion note (all components now implemented)
- `architecture/overview.md`: Added 5 new pattern sections: Composition Root, Dashboard Header, GenderSection, Deviation Warning (Free Mode), Mini Subcategory Pie Charts
- `architecture/overview.md`: Updated Container + Recursive Component Pattern to reflect single-gender TreePanel scope and TreeRow's new responsibilities

## Retroactive ADRs Created

None -- no implicit decisions found. All task-008 decisions were explicitly designed by TL, reviewed and approved by architect (arch-review iteration 1, APPROVED with 2 conditions, both met). Specific assessment:

- TreePanel single-gender scoping: Explicitly designed in TL design step 4, approved in arch-review. Documented in overview.md patterns.
- CSS Grid responsive layout: Standard Tailwind pattern, no architectural significance.
- Sticky header with confirm() reset: User decisions from PO Q1/Q2, trivial implementation.
- Component hierarchy (App -> DashboardHeader + GenderSection -> TreePanel + PieChartPanel): Natural consequence of existing patterns, explicitly designed.
- Five component categories: Pattern taxonomy documented in app CLAUDE.md, not an ADR-level decision.

## Recommendations

1. **No immediate follow-up needed** -- task-008 is architecturally clean and fully documented.
2. **Future consideration**: When mobile/tablet layouts are implemented (PRD NFR-05, deferred from task-008), the CSS Grid pattern in App.tsx may need responsive breakpoint adjustments. The current `grid-cols-1 lg:grid-cols-2` establishes a baseline but mobile layout may require a fundamentally different component arrangement.
3. **Test coverage note**: 286 total tests across 19 test files. The test suite comprehensively covers all 10 components, 4 utility modules, 2 data modules, 1 hook, and 1 type module.
4. **ADR-0006 potential**: If a future task introduces a mobile layout that requires component restructuring (e.g., tab-based navigation instead of side-by-side grid), consider an ADR for the responsive layout strategy.
