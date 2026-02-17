# QA Plan: task-003 -- Create Ukraine Labor Market Default Data

Generated: 2026-02-17

## Test Scope

Verify that `defaultTree.ts` exports a complete, mathematically consistent TreeNode tree representing Ukraine's labor market data with 55 nodes. The verification covers:
- File existence and correct exports
- Tree structure (node counts, hierarchy)
- Mathematical consistency (percentages sum to 100%, absolute values derived correctly)
- Data accuracy (all values match plan.md pre-computed tables)
- Code quality (TypeScript types, Ukrainian labels, no `any`)
- Build toolchain (lint, test, build all pass)

## Test Cases

### TC-003-001: Root node values
**Priority**: Critical
**Type**: Unit

**Preconditions**: defaultTree is imported successfully

**Test Data**: Root node expected values from plan.md

**Steps**:
1. Import `defaultTree` from `@/data/defaultTree`
2. Inspect root node fields

**Expected Result**:
- `id === 'root'`
- `label === 'Зайняте населення'`
- `percentage === 100`
- `defaultPercentage === 100`
- `absoluteValue === 13_500_000`
- `genderSplit === { male: 52.66, female: 47.34 }`
- `isLocked === false`

**Actual Result**: All fields match exactly. genderSplit sums to 100 (52.66 + 47.34 = 100).
**Status**: PASS

---

### TC-003-002: Gender-level children
**Priority**: Critical
**Type**: Unit

**Preconditions**: defaultTree is imported successfully

**Steps**:
1. Inspect `defaultTree.children`
2. Verify count, IDs, percentages, absolute values

**Expected Result**:
- Exactly 2 children: `gender-male` (52.66%, 7,109,100) and `gender-female` (47.34%, 6,390,900)
- Male abs = round(13,500,000 * 52.66 / 100) = 7,109,100
- Female abs = 13,500,000 - 7,109,100 = 6,390,900

**Actual Result**: Implementation has Male at 52.66%/7,109,100 and Female at 47.34%/6,390,900. Matches plan.
**Status**: PASS

**Note**: The PO analysis (po-analysis.md AC-2) mentions "Male (52%, 7,020,000) and Female (48%, 6,480,000)" but the task.md AC (which is the canonical source) says "genderSplit is derived from weighted industry data". The TL design resolved Q6 to use weighted derived values (52.66/47.34), which the implementation correctly follows. This is NOT an issue -- the task.md AC supersedes the initial PO analysis values.

---

### TC-003-003: Industry nodes per gender
**Priority**: Critical
**Type**: Unit

**Steps**:
1. Count children of each gender node
2. Verify each has a kvedCode
3. Sum their percentages

**Expected Result**:
- 16 industry nodes per gender (32 total)
- Each has a non-undefined kvedCode
- Percentages sum to 100.0% per gender

**Actual Result**:
- Male: 16 children, all with kvedCode, percentages sum to 100.0
- Female: 16 children, all with kvedCode, percentages sum to 100.0
**Status**: PASS

---

### TC-003-004: IT subcategory children
**Priority**: Critical
**Type**: Unit

**Steps**:
1. Find the IT node (kvedCode 'J') under each gender
2. Count its children
3. Sum their percentages

**Expected Result**:
- 10 subcategory children per gender IT node (20 total)
- Percentages sum to 100.0%

**Actual Result**:
- Male IT: 10 children, pct sum = 100.0
- Female IT: 10 children, pct sum = 100.0
**Status**: PASS

---

### TC-003-005: Non-IT industries are leaf nodes
**Priority**: High
**Type**: Unit

**Steps**:
1. For each gender, filter industries where kvedCode !== 'J'
2. Verify each has `children: []`

**Expected Result**: All 15 non-IT industries per gender have empty children arrays

**Actual Result**: Verified -- all 30 non-IT industry nodes have `children: []`
**Status**: PASS

---

### TC-003-006: Absolute value consistency
**Priority**: Critical
**Type**: Unit

**Steps**:
1. For every parent-child pair in the tree, compute `Math.round(parent.absoluteValue * child.percentage / 100)`
2. Compare with `child.absoluteValue`

**Expected Result**: `Math.abs(child.absoluteValue - expected) <= 1` for all nodes

**Actual Result**: All 53 parent-child relationships verified. Maximum deviation is 0 (exact match). Spot-checked 12 nodes manually against plan.md tables -- all match.
**Status**: PASS

---

### TC-003-007: Gender split validity
**Priority**: Critical
**Type**: Unit

**Steps**:
1. For every node in the tree, check `genderSplit.male + genderSplit.female`

**Expected Result**: Sum equals exactly 100 on all 55 nodes

**Actual Result**: All 55 nodes have genderSplit summing to exactly 100. Root uses {52.66, 47.34}, male subtree uses {100, 0}, female subtree uses {0, 100}.
**Status**: PASS

---

### TC-003-008: percentage equals defaultPercentage
**Priority**: High
**Type**: Unit

**Steps**:
1. For every node, compare percentage to defaultPercentage

**Expected Result**: Identical on all 55 nodes

**Actual Result**: All 55 nodes have `percentage === defaultPercentage`
**Status**: PASS

---

### TC-003-009: isLocked is false everywhere
**Priority**: High
**Type**: Unit

**Steps**:
1. For every node, check isLocked

**Expected Result**: `isLocked === false` on all 55 nodes

**Actual Result**: All 55 nodes have `isLocked === false`
**Status**: PASS

---

### TC-003-010: Lint passes
**Priority**: Critical
**Type**: Automated

**Steps**:
1. Run `pnpm lint`

**Expected Result**: Zero errors, exit code 0

**Actual Result**: `pnpm lint` passes with zero errors
**Status**: PASS

---

### TC-003-011: Build passes
**Priority**: Critical
**Type**: Automated

**Steps**:
1. Run `pnpm build`

**Expected Result**: `tsc --noEmit` and `vite build` succeed, exit code 0

**Actual Result**: Build succeeds. 29 modules transformed. Output: dist/index.html, CSS, JS bundles.
**Status**: PASS

---

### TC-003-012: All tests pass
**Priority**: Critical
**Type**: Automated

**Steps**:
1. Run `pnpm test`

**Expected Result**: All test files pass, zero failures, zero skips

**Actual Result**: 3 test files, 45 tests passed (11 types + 8 dataHelpers + 26 defaultTree). Zero failures, zero skips.
**Status**: PASS

---

### TC-003-013: Total node count is 55
**Priority**: High
**Type**: Unit

**Steps**:
1. Recursively collect all nodes from defaultTree
2. Count them

**Expected Result**: 55 nodes (1 root + 2 gender + 32 industry + 20 IT subcategory)

**Actual Result**: 55 nodes confirmed by automated test
**Status**: PASS

---

### TC-003-014: All 16 KVED codes present
**Priority**: High
**Type**: Unit

**Steps**:
1. Extract kvedCodes from male industry children
2. Extract kvedCodes from female industry children
3. Verify all 16 expected codes: G, A, B-E, O, P, Q, H, F, M, J, S, N, I, L, K, R

**Expected Result**: All 16 codes present under each gender

**Actual Result**: All 16 KVED codes present under both male and female gender nodes
**Status**: PASS

---

### TC-003-015: All 10 IT subcategory labels present
**Priority**: High
**Type**: Unit

**Steps**:
1. Extract labels from male IT subcategories
2. Extract labels from female IT subcategories

**Expected Result**: All 10 labels present: Розробка ПЗ, QA / Тестування, PM / Product, HR / Рекрутинг, DevOps / SRE, Аналітики, UI/UX Дизайн, Data / ML / AI, Маркетинг, Інші ролі

**Actual Result**: All 10 labels present under both genders
**Status**: PASS

---

### TC-003-016: All IDs are unique
**Priority**: High
**Type**: Unit

**Steps**:
1. Collect all node IDs across the tree
2. Compare count to unique count

**Expected Result**: 55 unique IDs

**Actual Result**: 55 IDs, all unique
**Status**: PASS

---

### TC-003-017: DashboardState compatibility
**Priority**: Medium
**Type**: Unit

**Steps**:
1. Construct a `DashboardState` object using `defaultTree`
2. Verify it compiles and has correct structure

**Expected Result**: `{ totalPopulation: 13_500_000, balanceMode: 'auto', tree: defaultTree }` compiles and is traversable

**Actual Result**: DashboardState construction succeeds. TypeScript compilation passes.
**Status**: PASS

---

### TC-003-018: largestRemainder function correctness
**Priority**: High
**Type**: Unit

**Steps**:
1. Test with equal values: [33.333, 33.333, 33.333] -> sum = 100
2. Test with exact values: [50, 30, 20] -> unchanged
3. Test with single value
4. Test with integer mode (0 decimals)
5. Test remainder distribution to largest fractional parts
6. Test 16-industry normalization case
7. Test array length preservation
8. Test input immutability

**Expected Result**: All 8 tests pass

**Actual Result**: All 8 tests pass
**Status**: PASS

---

### TC-003-019: Barrel export works
**Priority**: Medium
**Type**: Unit

**Steps**:
1. Verify `src/data/index.ts` exports `defaultTree` and `largestRemainder`
2. Verify imports resolve correctly

**Expected Result**: Both named exports available

**Actual Result**: `index.ts` correctly re-exports both. Build succeeds confirming import resolution.
**Status**: PASS

---

### TC-003-020: Ukrainian labels used throughout
**Priority**: Medium
**Type**: Manual code review

**Steps**:
1. Review all node labels in defaultTree.ts
2. Verify Ukrainian language

**Expected Result**: All labels in Ukrainian

**Actual Result**: All industry labels (Торгівля, Сільське господарство, Промисловість, etc.) and subcategory labels (Розробка ПЗ, QA / Тестування, etc.) are in Ukrainian. Root label is "Зайняте населення", gender labels are "Чоловіки"/"Жінки".
**Status**: PASS

---

### TC-003-021: Data values match plan.md exactly
**Priority**: Critical
**Type**: Manual audit

**Steps**:
1. Compare every node's id, label, kvedCode, percentage, absoluteValue in defaultTree.ts against plan.md tables
2. Check all 55 nodes

**Expected Result**: 100% match between implementation and plan.md

**Actual Result**: All 55 nodes verified. Every value matches plan.md pre-computed tables exactly. No discrepancies.
**Status**: PASS

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Type | Priority | Status |
|---------------------|--------------|------|----------|--------|
| Root node: totalPopulation=13.5M, pct=100, genderSplit derived | TC-003-001 | Unit | Critical | PASS |
| 2 gender children: Male 52.66%, Female 47.34% | TC-003-002 | Unit | Critical | PASS |
| 16 industry nodes per gender, pct sum = 100% | TC-003-003 | Unit | Critical | PASS |
| IT has 10 subcategory children, pct sum = 100% | TC-003-004 | Unit | Critical | PASS |
| Non-IT industries have empty children | TC-003-005 | Unit | High | PASS |
| absoluteValue = round(parent.abs * child.pct / 100), tolerance 1 | TC-003-006 | Unit | Critical | PASS |
| genderSplit.male + genderSplit.female = 100 on every node | TC-003-007 | Unit | Critical | PASS |
| percentage === defaultPercentage on every node | TC-003-008 | Unit | High | PASS |
| isLocked === false on every node | TC-003-009 | Unit | High | PASS |
| pnpm lint and pnpm build pass | TC-003-010, TC-003-011 | Automated | Critical | PASS |
| pnpm test passes (structural, mathematical, completeness) | TC-003-012 | Automated | Critical | PASS |

## Regression Impact Analysis

This task introduces new files only. No existing files were modified:
- New: `src/data/dataHelpers.ts`, `src/data/defaultTree.ts`, `src/data/index.ts`
- New tests: `src/__tests__/data/dataHelpers.test.ts`, `src/__tests__/data/defaultTree.test.ts`

Existing tests (11 type tests in `tree.test.ts`) continue to pass -- confirmed by test run showing all 45 tests pass.

**Regression risk: NONE** -- purely additive changes with no modifications to existing code.

## Regression Test Suite

| Test File | Tests | Status |
|-----------|-------|--------|
| `src/__tests__/types/tree.test.ts` | 11 | PASS (unchanged) |
| `src/__tests__/data/dataHelpers.test.ts` | 8 | PASS (new) |
| `src/__tests__/data/defaultTree.test.ts` | 26 | PASS (new) |
| **Total** | **45** | **ALL PASS** |

## Test Environment Requirements

- Node.js with pnpm
- All dependencies installed (`pnpm install`)
- Vitest configured with `@` path alias

## Definition of Done Checklist

- [x] All test cases pass (21/21 PASS)
- [x] No critical bugs open
- [x] Regression suite passes (45/45 tests)
- [x] Code coverage meets threshold (all new code exercised by tests)
- [x] pnpm lint passes with zero errors
- [x] pnpm build compiles successfully
- [x] pnpm test passes with zero failures
- [x] All 55 nodes present with correct values
- [x] All data values match plan.md pre-computed tables

## Verification Results

**Verification Date**: 2026-02-17
**Verified By**: QA Agent

### Automated Tests
- Unit Tests: 45 passed, 0 failed
- E2E Tests: N/A (no UI yet)
- Coverage: All new code paths exercised by 34 new tests

### Test Case Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-003-001 | PASS | Root node values verified against plan.md |
| TC-003-002 | PASS | Gender children match derived values (52.66/47.34) |
| TC-003-003 | PASS | 16 industries per gender, pct sums to 100.0 |
| TC-003-004 | PASS | 10 IT subcategories per gender, pct sums to 100.0 |
| TC-003-005 | PASS | All 30 non-IT industries have empty children |
| TC-003-006 | PASS | All absolute values within tolerance 0 |
| TC-003-007 | PASS | All 55 nodes: genderSplit sums to exactly 100 |
| TC-003-008 | PASS | All 55 nodes: percentage === defaultPercentage |
| TC-003-009 | PASS | All 55 nodes: isLocked === false |
| TC-003-010 | PASS | pnpm lint: zero errors |
| TC-003-011 | PASS | pnpm build: clean compilation |
| TC-003-012 | PASS | pnpm test: 45 passed, 0 failed, 0 skipped |
| TC-003-013 | PASS | Total node count: 55 |
| TC-003-014 | PASS | All 16 KVED codes present under both genders |
| TC-003-015 | PASS | All 10 IT subcategory labels present |
| TC-003-016 | PASS | All 55 IDs unique |
| TC-003-017 | PASS | DashboardState construction compiles |
| TC-003-018 | PASS | largestRemainder: 8/8 tests pass |
| TC-003-019 | PASS | Barrel export resolves correctly |
| TC-003-020 | PASS | All labels in Ukrainian |
| TC-003-021 | PASS | 100% match with plan.md pre-computed values |

### Issues Found

None.

### Verdict

**APPROVED**

All 21 test cases pass. All 11 acceptance criteria from task.md are satisfied. All 45 automated tests pass. Lint, build, and test commands all exit with code 0. Data values match plan.md exactly. No issues found.
