---
id: task-003
title: Create Ukraine Labor Market Default Data
status: backlog
priority: high
dependencies: [task-002]
created_at: 2026-02-17
---

# Create Ukraine Labor Market Default Data

## Problem (PO)

The Labor Market Dashboard has a fully defined data model (TreeNode, GenderSplit, BalanceMode, DashboardState from task-002) but contains no actual data. Without default data representing Ukraine's labor market, the dashboard has nothing to render -- no sliders, no pie charts, no tree panel content. Every downstream feature (state management, sliders, charts, tree panel, auto-balance) depends on a populated data tree to function.

From the user's perspective: "I open the dashboard and expect to see Ukraine's real labor market data -- 13.5 million employed people broken down by gender, industry, and specialization -- so I can immediately start exploring and adjusting scenarios."

If we do nothing, all subsequent tasks (4 through 10) are blocked. The dashboard remains an empty shell with no value to any user.

## Success Criteria (PO)

1. A single file `src/data/defaultTree.ts` exports a complete TreeNode tree with root, gender, industry, and subcategory levels.
2. The tree contains exactly 16 KVED industry sectors under each gender node (32 industry nodes total).
3. The IT & Telecom industry has 10 subcategory nodes under each gender (20 total). Other 15 industries are leaf nodes at Level 2.
4. All percentage values at each sibling level sum to 100% (within tolerance agreed in Q5).
5. All absoluteValue fields are mathematically consistent: `child.absoluteValue === parent.absoluteValue * (child.percentage / 100)`.
6. Every node has a valid genderSplit where `male + female === 100`.
7. The data file passes `pnpm lint`, `pnpm test`, and `pnpm build` without errors.
8. The exported tree can be loaded into a DashboardState object and traversed without runtime errors.

## Acceptance Criteria (PO)

* Given the default tree is loaded
  When I inspect the root node
  Then totalPopulation equals 13,500,000, percentage equals 100, and genderSplit is derived from weighted industry data (decimal precision, male + female = 100)

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

## Out of Scope (PO)

- **Runtime validation functions**: Validation utilities (e.g., `validateTree()`) belong to a separate task or to the state management layer (task-004). This task only produces the static data file and its tests.
- **Dynamic data loading**: No API calls, no JSON imports, no lazy loading. The data is a hardcoded TypeScript constant.
- **User-editable data**: The default tree is read-only at rest. Editability is handled by state management (task-004).
- **Subcategory data for non-IT industries**: Only IT has Level 3 data in the PRD. Other industries are leaf nodes (resolved Q2).
- **Data sourcing or research**: The PRD provides the authoritative data. No external research or data scraping is required.
- **Helper/utility functions**: No `calculations.ts`, `format.ts`, or tree traversal utilities. Those belong to task-004 and task-009.
- **UI rendering of the data**: No components consume this data yet. That is tasks 5-9.

## Open Questions (PO)

* **Q1 (DATA INTEGRITY)**: RESOLVED — **Percentages are the source of truth**. Normalize PRD percentages to sum to exactly 100%, then derive absolute values from 13,500,000 total.

* **Q2 (SUBCATEGORY DATA)**: RESOLVED — **IT-only subcategories**. Only the IT & Telecom sector has Level 3 subcategories (10 items from PRD). All other 15 industries are leaf nodes at Level 2. The "75+ subcategories" requirement is reduced accordingly.

* **Q3 (LABEL LANGUAGE)**: RESOLVED — **Ukrainian labels**. Industry and subcategory labels use Ukrainian (e.g., "Торгівля", "Сільське господарство").

* **Q4 (PERCENTAGE REPRESENTATION)**: RESOLVED — **Recalculate as share of gender parent**. Industry percentage under each gender = (industry_total * industry_gender_%) / gender_total. This follows the TreeNode contract where percentage = share of parent.

* **Q5 (ROUNDING STRATEGY)**: RESOLVED — **1 decimal place, last sibling absorbs remainder**. Round all percentages to 1 decimal place. The last sibling in each group absorbs the rounding remainder to guarantee exact 100% sums.

---

## Technical Notes (TL)

- **Affected modules**: `apps/labor-market-dashboard/src/data/`, `apps/labor-market-dashboard/src/__tests__/data/`
- **New modules/entities to create**:
  - `src/data/defaultTree.ts` -- exported `defaultTree: TreeNode` constant
  - `src/data/dataHelpers.ts` -- `largestRemainder` rounding utility
  - `src/data/index.ts` -- barrel re-export
  - `src/__tests__/data/defaultTree.test.ts` -- comprehensive unit tests
  - `src/__tests__/data/dataHelpers.test.ts` -- helper function tests
- **DB schema change required?** No
- **Architectural considerations**:
  - Pre-computed hardcoded TreeNode literals (no runtime calculation, no builder pattern)
  - Largest-remainder method for rounding (avoids last-sibling-absorbs distortion with 16+ siblings)
  - Flat ID scheme: `root`, `gender-male`, `gender-female`, `male-{kved}`, `female-{kved}`, `male-{kved}-{slug}`
  - PRD percentages normalized from 100.2% to 100.0% (only Торгівля changes: 22.2 -> 22.1)
- **Known risks or trade-offs**:
  - **PRD gender split inconsistency (MEDIUM)**: See Q6 in Open Questions. The PRD's 52/48 overall split is inconsistent with the weighted industry gender splits (~52.7/47.3). Requires user decision.
  - **Large file (~600-800 lines)**: Acceptable for static data. No splitting.
  - **Rounding precision**: Max per-item distortion <0.1 pp with largest-remainder method.
- **Test plan**: Unit tests only. 7 test groups covering structure, percentage sums, absolute values, gender splits, defaults, completeness, and DashboardState compatibility.

### Open Questions (TL)

* **Q6 (GENDER SPLIT INCONSISTENCY)**: RESOLVED — **Derive from data with decimal precision**. Root genderSplit uses the weighted average from industry data (~52.65/47.35) with full decimal precision. GenderSplit fields already support `number` (not integer-only). This is mathematically cleanest and the value will be dynamic in the app anyway.

## Implementation Steps (TL)

### Step 1 -- Create data helpers module

Create `src/data/dataHelpers.ts` with `largestRemainder(values: number[], target: number, decimals: number): number[]` function. This rounds an array of values to the specified decimal places while ensuring the sum equals the target. Used for pre-computation and exported for future auto-balance use (task-004).

- **Files**: `apps/labor-market-dashboard/src/data/dataHelpers.ts`, `apps/labor-market-dashboard/src/__tests__/data/dataHelpers.test.ts`
- **Verification**: Test passes for `largestRemainder([33.333, 33.333, 33.333], 100, 1)` producing values that sum to 100.0.

### Step 2 -- Create the default tree data file

Create `src/data/defaultTree.ts` exporting `const defaultTree: TreeNode`. Contains:
- Root (Level 0): id=`root`, label=`Зайняте населення`, pct=100, abs=13,500,000
- 2 gender nodes (Level 1): Male/Female with percentages and absolute values per Q6 resolution
- 32 industry nodes (Level 2): 16 per gender, with KVED codes, Ukrainian labels, gender-specific percentages (share of gender parent), pre-computed absolute values
- 20 IT subcategory nodes (Level 3): 10 per gender under IT & Telecom
- All nodes: `defaultPercentage === percentage`, `isLocked === false`, `genderSplit.male + genderSplit.female === 100`

- **Files**: `apps/labor-market-dashboard/src/data/defaultTree.ts`
- **Verification**: `tsc --noEmit` passes. No `any` types.

### Step 3 -- Create barrel export

Create `src/data/index.ts`:
```typescript
export { defaultTree } from './defaultTree';
export { largestRemainder } from './dataHelpers';
```

- **Files**: `apps/labor-market-dashboard/src/data/index.ts`
- **Verification**: `import { defaultTree } from '@/data'` resolves.

### Step 4 -- Write comprehensive unit tests

Create `src/__tests__/data/defaultTree.test.ts` with 7 test groups:
1. Structural tests (node counts, children shapes)
2. Percentage sum tests (all sibling groups sum to 100.0)
3. Absolute value consistency (child.abs = round(parent.abs * child.pct / 100), tolerance 1)
4. Gender split validity (male + female === 100 on every node)
5. Default state tests (pct === defaultPct, isLocked === false)
6. Completeness tests (16 KVED codes, 10 IT subs, unique IDs, non-empty labels)
7. DashboardState compatibility (construct DashboardState from defaultTree)

- **Files**: `apps/labor-market-dashboard/src/__tests__/data/defaultTree.test.ts`
- **Verification**: `pnpm test` -- all pass, zero skips.

### Step 5 -- Full verification

1. `pnpm lint` -- zero errors
2. `pnpm test` -- all pass
3. `pnpm build` -- clean build

- **Files**: none
- **Verification**: All three commands exit 0.

### Complexity Assessment

- **Estimated effort**: 1 day
- **Risk level**: Low (after Q6 resolution)
- **Step count**: 5
- **Decomposition**: **Not recommended** (low complexity, tight coupling, <2 day effort)

---

## Implementation Log (DEV)

_To be updated during implementation._

---

## QA Notes (QA)

_To be filled by QA agent._
