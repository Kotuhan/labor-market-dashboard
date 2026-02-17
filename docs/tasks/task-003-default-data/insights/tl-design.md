# Technical Design: task-003
Generated: 2026-02-17

## Overview

Create a static TypeScript data file (`src/data/defaultTree.ts`) that exports a fully populated `TreeNode` tree representing Ukraine's labor market default data. The file contains no logic -- only a hardcoded constant built from pre-computed values. A companion test file validates structural integrity, mathematical consistency, and completeness. A helper module (`src/data/dataHelpers.ts`) provides a `largestRemainder` rounding utility used during data generation (developer script) but also exported for future use by auto-balance logic.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/src/data/`, `apps/labor-market-dashboard/src/__tests__/data/`
- **New modules/entities to create**:
  - `src/data/defaultTree.ts` -- exported `defaultTree: TreeNode` constant
  - `src/data/index.ts` -- barrel re-export
  - `src/__tests__/data/defaultTree.test.ts` -- comprehensive tests
- **DB schema change required?** No
- **Architectural considerations**:
  - The file will be large (~600-800 lines) due to 2 gender nodes x 16 industries (+ 10 IT subs x 2 genders). A builder/factory pattern is NOT used because: (a) it would introduce runtime logic that belongs to task-004, (b) the data is static and pre-computed, and (c) explicit literals are easier to audit and test.
  - Each node is a full `TreeNode` literal with all fields populated. No spreading, no computed values at runtime.
  - `percentage` and `defaultPercentage` are always identical in the initial data.
  - `isLocked` is `false` on every node.
  - `absoluteValue` is `Math.round(parent.absoluteValue * percentage / 100)` -- pre-computed and hardcoded.
- **Known risks or trade-offs**:
  - **PRD data inconsistency (MEDIUM)**: See Open Technical Questions below. The PRD's stated 52/48 gender split is inconsistent with the weighted industry-level gender splits (which imply ~52.7/47.3). This requires a user decision before implementation can proceed.
  - **Large file size (LOW)**: ~600-800 lines of static data. Acceptable for a single-file data module. No splitting needed.
  - **Rounding precision (LOW)**: Using largest-remainder method ensures all sibling percentages sum to exactly 100.0. Maximum per-item distortion from ideal is <0.1 pp.
- **Test plan**: Unit tests only. No integration tests needed (static data, no dependencies).

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Pre-computed hardcoded literals (no runtime calculation) | Static data has zero runtime cost, easy to audit, no circular dependency risk | Builder pattern (rejected: adds runtime logic belonging to task-004), JSON import (rejected: loses type safety) |
| Largest-remainder rounding method | Distributes rounding error fairly across all siblings, avoids negative values or large distortions that "last sibling absorbs" causes with 16+ items | Last-sibling-absorbs (rejected: causes up to -0.5% on last item with 16 industries under forced 52/48), Simple rounding (rejected: sums deviate from 100%) |
| Flat ID scheme: `root`, `gender-male`, `gender-female`, `male-{kved}`, `female-{kved}`, `male-{kved}-{slug}`, `female-{kved}-{slug}` | Predictable, grep-friendly, encodes hierarchy without nesting. Gender prefix ensures uniqueness (same industry appears under both genders). | Numeric IDs (rejected: not human-readable), UUID (rejected: overkill for static data) |
| Separate test file for default data | Follows project convention (`src/__tests__/data/defaultTree.test.ts` mirrors `src/data/defaultTree.ts`) | Inline assertions (rejected: not testable via `pnpm test`) |
| No data generation script | The data is computed once (during TL design) and hardcoded. A generation script adds complexity for a one-time operation. | Node.js script to generate data (considered: useful if data changes frequently, but PRD data is static) |

## Node ID Scheme

```
root                          -- Level 0
  gender-male                 -- Level 1
    male-g                    -- Level 2 (Torgivlya, KVED G)
    male-a                    -- Level 2 (Agriculture, KVED A)
    male-j                    -- Level 2 (IT, KVED J)
      male-j-software-dev     -- Level 3 (IT sub: Software Dev)
      male-j-qa               -- Level 3 (IT sub: QA)
      ...
  gender-female               -- Level 1
    female-g                  -- Level 2
    ...
```

KVED codes are lowercased in IDs. Multi-letter codes like `B-E` become `b-e`. IT subcategory slugs are short English kebab-case identifiers.

## Pre-Computed Data Reference

### Normalization (PRD sum = 100.2%, normalized to 100.0% via largest-remainder, 1 decimal)

| Industry | PRD % | Normalized % |
|---|---|---|
| Торгівля | 22.2 | 22.1 |
| Сільське господарство | 17.5 | 17.4 |
| Промисловість | 14.3 | 14.3 |
| Держуправління та оборона | 9.4 | 9.4 |
| Освіта | 7.8 | 7.8 |
| Охорона здоров'я | 5.8 | 5.8 |
| Транспорт | 5.8 | 5.8 |
| Будівництво | 3.5 | 3.5 |
| Професійна діяльність | 2.4 | 2.4 |
| IT та телеком | 2.2 | 2.2 |
| Інші послуги | 2.1 | 2.1 |
| Адмін. обслуговування | 1.9 | 1.9 |
| Готелі, харчування | 1.8 | 1.8 |
| Нерухомість | 1.3 | 1.3 |
| Фінанси / страхування | 1.2 | 1.2 |
| Мистецтво, спорт | 1.0 | 1.0 |
| **SUM** | **100.2** | **100.0** |

### Per-Gender Industry Percentages

**BLOCKED**: The exact values depend on the resolution of Q6 (gender split inconsistency). See Open Technical Questions.

The developer will use the provided calculation approach (largest-remainder method) with the chosen gender totals to compute final per-gender percentages.

### IT Subcategories (percentages of IT parent, per gender)

IT subcategory percentages sum to exactly 100% already (47+17+7+5+4+4+4+3+2+7=100). The per-gender breakdown uses the same largest-remainder approach applied to `(subPct * subMaleSplit) / itOverallMaleSplit` for each gender.

**Note**: The IT overall gender split (74/26) IS consistent with its subcategory weighted splits. `sum(subPct * subMale) = 71.75`, which differs from 74. The same inconsistency pattern exists here. The resolution of Q6 applies here too.

## Implementation Steps

### Step 1 -- Create the data helpers module

Create `src/data/dataHelpers.ts` with a `largestRemainder` function that takes an array of exact values and rounds them to a given number of decimal places while ensuring they sum to a target value. This utility is needed for future auto-balance logic (task-004) and is used by the developer during pre-computation.

- **Files**: `apps/labor-market-dashboard/src/data/dataHelpers.ts`
- **Verification**: Unit test in `src/__tests__/data/dataHelpers.test.ts` passes. Function correctly rounds `[33.333, 33.333, 33.333]` to `[33.4, 33.3, 33.3]` (sum = 100.0).

### Step 2 -- Create the default tree data file

Create `src/data/defaultTree.ts` exporting `const defaultTree: TreeNode`. The file contains:
- Root node (Level 0): id=`root`, label=`Зайняте населення`, percentage=100, absoluteValue=13_500_000
- Two gender nodes (Level 1): Male/Female with derived percentages and absolute values
- 16 industry nodes under each gender (Level 2): with KVED codes, gender-specific percentages (share of gender parent), and pre-computed absolute values
- 10 IT subcategory nodes under each gender's IT node (Level 3): with subcategory-specific percentages and absolute values
- Every node has `defaultPercentage === percentage` and `isLocked === false`
- All labels in Ukrainian

The developer must use the pre-computed values from the calculation approach documented above, applying the Q6 resolution chosen by the user.

- **Files**: `apps/labor-market-dashboard/src/data/defaultTree.ts`
- **Verification**: File compiles with `tsc --noEmit`. No `any` types. All TreeNode fields populated.

### Step 3 -- Create barrel export for data module

Create `src/data/index.ts` with barrel re-export:
```typescript
export { defaultTree } from './defaultTree';
export { largestRemainder } from './dataHelpers';
```

- **Files**: `apps/labor-market-dashboard/src/data/index.ts`
- **Verification**: Import `{ defaultTree }` from `@/data` resolves correctly.

### Step 4 -- Write comprehensive unit tests

Create `src/__tests__/data/defaultTree.test.ts` with test groups:

1. **Structural tests**:
   - Root has exactly 2 children (male, female)
   - Each gender node has exactly 16 industry children
   - IT industry under each gender has exactly 10 subcategory children
   - All non-IT industries have `children: []`
   - Total node count: 1 (root) + 2 (gender) + 32 (industries) + 20 (IT subs) = 55

2. **Percentage sum tests**:
   - Root percentage === 100
   - Gender children percentages sum to 100
   - Male industry percentages sum to 100.0
   - Female industry percentages sum to 100.0
   - Male IT subcategory percentages sum to 100.0
   - Female IT subcategory percentages sum to 100.0

3. **Absolute value consistency tests**:
   - Root absoluteValue === 13_500_000
   - For every parent-child pair: `Math.abs(child.absoluteValue - Math.round(parent.absoluteValue * child.percentage / 100)) <= 1`

4. **Gender split validity tests**:
   - Every node has `genderSplit.male + genderSplit.female === 100`
   - Root genderSplit matches the chosen resolution from Q6
   - Male gender node has `{ male: 100, female: 0 }`
   - Female gender node has `{ male: 0, female: 100 }`

5. **Default state tests**:
   - Every node has `percentage === defaultPercentage`
   - Every node has `isLocked === false`

6. **Completeness tests**:
   - All 16 KVED codes present under each gender
   - All 10 IT subcategory labels present under each gender's IT node
   - All labels are non-empty strings
   - All IDs are unique across the entire tree

7. **DashboardState compatibility test**:
   - Construct a `DashboardState` using `defaultTree` and verify it compiles and has correct structure

- **Files**: `apps/labor-market-dashboard/src/__tests__/data/defaultTree.test.ts`
- **Verification**: `pnpm test` passes with zero failures, zero skips.

### Step 5 -- Verification

Run full verification suite:
1. `pnpm lint` -- zero errors
2. `pnpm test` -- all tests pass, zero skips
3. `pnpm build` -- clean build

- **Files**: none (verification only)
- **Verification**: All three commands exit with code 0.

## Complexity Assessment

- **Estimated effort**: 1 day (mostly mechanical data entry + test writing)
- **Risk level**: Low (after Q6 resolution)
- **Dependencies**: task-002 (TreeNode type definition) -- already completed
- **Step count**: 5 steps
- **Complexity**: Low-Medium (single module, no external integrations, but requires careful arithmetic)

### Decomposition Recommendation

**Not recommended for decomposition.** Although there are 5 steps, the task is low complexity (single module, static data, no cross-domain concerns). All steps are quick and mechanical. Total effort is ~1 day, well under the 2-day threshold. The steps have tight coupling (test file depends on data file depends on helpers).

## Test Strategy

- **Unit tests**: Comprehensive coverage as described in Step 4. Tests verify structure, math, completeness, and type compatibility.
- **Integration tests**: Not needed. The data module has no dependencies other than the `TreeNode` type.
- **E2E tests**: Not applicable. No UI yet.

## Open Technical Questions

### Q6 (GENDER SPLIT INCONSISTENCY) -- RESOLVED

**Resolution**: Derive gender split from weighted industry data with **decimal precision**. The root genderSplit will use the actual calculated ratio (~52.65/47.35) rather than integer rounding. User confirmed that gender split is a dynamic value and the system must support decimal/hundredths precision.

This is Option A with enhanced precision: `root.genderSplit = { male: 52.65, female: 47.35 }` (exact value TBD after final normalization). Gender-level absolute values = `13_500_000 * genderPct / 100`. Per-gender industry percentages will then sum to exactly 100% without any distortion.
