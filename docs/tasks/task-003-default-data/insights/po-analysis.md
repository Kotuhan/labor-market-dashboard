# PO Analysis: task-003
Generated: 2026-02-17

## Problem Statement

The Labor Market Dashboard has a fully defined data model (TreeNode, GenderSplit, BalanceMode, DashboardState from task-002) but contains no actual data. Without default data representing Ukraine's labor market, the dashboard has nothing to render -- no sliders, no pie charts, no tree panel content. Every downstream feature (state management, sliders, charts, tree panel, auto-balance) depends on a populated data tree to function.

From the user's perspective: "I open the dashboard and expect to see Ukraine's real labor market data -- 13.5 million employed people broken down by gender, industry, and specialization -- so I can immediately start exploring and adjusting scenarios."

If we do nothing, all subsequent tasks (4 through 10) are blocked. The dashboard remains an empty shell with no value to any user.

## Success Criteria

1. A single file `src/data/defaultTree.ts` exports a complete TreeNode tree with root, gender, industry, and subcategory levels.
2. The tree contains exactly 16 KVED industry sectors under each gender node (32 industry nodes total).
3. The IT & Telecom industry has 10 subcategory nodes under each gender (20 total). Other 15 industries are leaf nodes at Level 2.
4. All percentage values at each sibling level sum to 100% (within 0.01% tolerance for rounding).
5. All absoluteValue fields are mathematically consistent: `child.absoluteValue === parent.absoluteValue * (child.percentage / 100)`.
6. Every node has a valid genderSplit where `male + female === 100`.
7. The data file passes `pnpm lint`, `pnpm test`, and `pnpm build` without errors.
8. The exported tree can be loaded into a DashboardState object and traversed without runtime errors.

## Acceptance Criteria

* Given the default tree is loaded
  When I inspect the root node
  Then totalPopulation equals 13,500,000, percentage equals 100, and genderSplit equals { male: 52, female: 48 }

* Given the default tree is loaded
  When I inspect the gender-level children of root
  Then there are exactly 2 children: "Male" (52%, 7,020,000) and "Female" (48%, 6,480,000)

* Given the default tree is loaded
  When I inspect any gender node's children
  Then there are exactly 16 industry nodes, each with a kvedCode, and their percentages sum to 100%

* Given the default tree is loaded
  When I inspect the IT & Telecom industry node under either gender
  Then it has exactly 10 subcategory children, and their percentages sum to 100%

* Given the default tree is loaded
  When I inspect any non-IT industry node
  Then it has an empty children array (leaf node at Level 2)

* Given any node in the tree
  When I check its absoluteValue
  Then it equals its parent's absoluteValue multiplied by (this node's percentage / 100), within rounding tolerance of 1 person

* Given any node in the tree
  When I check genderSplit.male + genderSplit.female
  Then the sum equals exactly 100

* Given any node in the tree
  When I check that percentage equals defaultPercentage
  Then they are identical (no modifications from default state)

* Given any node in the tree
  When I check isLocked
  Then it is false (default state has no locked nodes)

* Given the defaultTree.ts file
  When I run `pnpm lint` and `pnpm build`
  Then both pass with zero errors

* Given comprehensive unit tests for the default data
  When I run `pnpm test`
  Then all tests pass, verifying structural integrity, mathematical consistency, and completeness

## Out of Scope

- **Runtime validation functions**: Validation utilities (e.g., `validateTree()`) belong to a separate task or to the state management layer (task-004). This task only produces the static data file and its tests.
- **Dynamic data loading**: No API calls, no JSON imports, no lazy loading. The data is a hardcoded TypeScript constant.
- **User-editable data**: The default tree is read-only at rest. Editability is handled by state management (task-004).
- **Localization of labels**: Labels are in English. Ukrainian-language labels are a future consideration.
- **Data sourcing or research**: The PRD provides the authoritative data. No external research or data scraping is required.
- **Subcategories for sectors not specified in PRD**: Only the IT sector has explicit Level 3 data in the PRD. For the remaining 15 industries, subcategory data must be provided by the user or a reasonable breakdown must be approved (see Open Questions).
- **Helper/utility functions**: No `calculations.ts`, `format.ts`, or tree traversal utilities. Those belong to task-004 and task-009.
- **UI rendering of the data**: No components consume this data yet. That is tasks 5-9.

## Open Questions

* **Q1 (DATA INTEGRITY)**: RESOLVED — **Percentages as source of truth**. Normalize to 100%, derive absolute values from 13.5M.

* **Q2 (SUBCATEGORY DATA)**: RESOLVED — **IT-only subcategories**. Only IT & Telecom has Level 3 (10 items). Other 15 industries are leaf nodes.

* **Q3 (LABEL LANGUAGE)**: RESOLVED — **Ukrainian labels** (e.g., "Торгівля", "Сільське господарство").

* **Q4 (PERCENTAGE REPRESENTATION)**: RESOLVED — **Recalculate as share of gender parent** per TreeNode contract.

* **Q5 (ROUNDING STRATEGY)**: RESOLVED — **1 decimal, last sibling absorbs remainder** for exact 100% sums.

## Recommendations

- **For TL**: The file will be large (potentially 1000+ lines with 75+ subcategories). Consider using a builder/factory pattern or structured constants to reduce repetition and improve maintainability. Also consider whether the data should be split into separate files per industry for readability.
- **For DEV**: Use numeric underscore separators for readability (e.g., `13_500_000`). Ensure `defaultPercentage` always mirrors `percentage` in the initial data. Set all `isLocked` to `false`.
- **For QA**: Key test categories should include: (1) structural tests (correct number of levels, children counts), (2) mathematical tests (percentage sums, absolute value calculations), (3) completeness tests (all 16 industries present, all expected subcategories), (4) type conformance tests (every node satisfies TreeNode interface).
