# Architecture Update: task-003
Generated: 2026-02-17

## Impact Assessment

Task-003 introduced the first concrete data layer for the application. While the modules are new, they operate entirely within the established component boundaries (`src/data/`) and conform to all existing ADRs and conventions. The architectural impact is moderate: the Data Architecture section of `overview.md` required factual corrections (gender split percentages, industry count, subcategory scope), and five new modules moved from "Planned" to "Implemented" in the module inventory.

No new architectural patterns, protocols, or component boundaries were introduced. The `largestRemainder()` utility is a pure function within the existing `src/data/` module boundary, consistent with the barrel-export convention established in task-002 for `src/types/`.

## Updates Made

- `architecture/overview.md`: Updated Data Architecture section with accurate figures:
  - Gender split corrected from "52% / 48%" to "52.66% / 47.34%" (derived from weighted industry data per task-003 Q6 resolution)
  - Industry count corrected from "15+ KVED sectors" to "16 KVED sectors per gender"
  - Subcategory scope corrected from "75+ breakdowns" to "10 IT roles per gender; other industries are leaves"
  - Added node count (55 total), data source convention (hardcoded literals), rounding convention (largest-remainder), and node ID scheme documentation
- `architecture/overview.md`: Updated Module Inventory:
  - Moved `defaultTree` from "Planned" to "Implemented" (task-003)
  - Added `dataHelpers` (largestRemainder utility) to "Implemented" (task-003)
  - Added `data barrel` (index.ts re-exports) to "Implemented" (task-003)
  - Added `dataHelpers.test.ts` (8 tests) to "Implemented" (task-003)
  - Added `defaultTree.test.ts` (26 tests) to "Implemented" (task-003)
- `architecture/overview.md`: Updated Test Directory Convention example to include `data/` directory mirroring

## Retroactive ADRs Created

None -- no implicit architectural decisions found. The key decisions made during task-003 (largest-remainder rounding, derived gender split, IT-only subcategories, flat node ID scheme, Ukrainian labels) are data-level design choices within the Team Lead's authority, not architectural decisions. They were explicitly discussed and resolved during PO analysis (Q1-Q5) and TL design (Q6), validated during arch-review, and are properly documented in `task.md` and `apps/labor-market-dashboard/CLAUDE.md`.

## Recommendations

- **Task-004 (state management)**: The `largestRemainder()` function is exported from `@/data` and intended for reuse in the auto-balance algorithm. When implementing `useAutoBalance`, import from `@/data` rather than reimplementing.
- **Future data changes**: Any modification to `defaultTree` values must re-run largest-remainder normalization across the affected sibling group. This constraint is documented in the app's CLAUDE.md DO NOT section.
- **Percentage as source of truth**: All downstream tasks must treat `percentage` as the source of truth, not `absoluteValue`. This is now documented in both `architecture/overview.md` and the app CLAUDE.md.
