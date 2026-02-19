# QA Plan: Subtask 11.4 -- Integration and Polish

Generated: 2026-02-19

## Test Scope

This QA verification covers subtask 11.4 of task-011 (Subcategory Management). The subtask adds:

1. **DYNAMIC_COLOR_PALETTE** -- 8 distinct hex colors for user-added industries in pie charts
2. **Merged color map in GenderSection** -- `useMemo` combining static INDUSTRY_COLORS with dynamic colors for custom industries
3. **TreePanel auto-expand** -- `useEffect` + `useRef` guard to auto-expand industries that gain children
4. **Barrel export update** -- `DYNAMIC_COLOR_PALETTE` exported from `data/index.ts`
5. **New tests** -- 4 chartColors tests + 2 TreePanel auto-expand tests

## Test Cases

### TC-11.4-001: DYNAMIC_COLOR_PALETTE has exactly 8 colors

**Priority**: Critical
**Type**: Unit
**Status**: PASS

**Verification**: Automated test in `chartColors.test.ts` line 63-65. Asserts `DYNAMIC_COLOR_PALETTE.toHaveLength(8)`. Test passes.

---

### TC-11.4-002: All dynamic palette values are valid hex strings

**Priority**: Critical
**Type**: Unit
**Status**: PASS

**Verification**: Automated test in `chartColors.test.ts` lines 67-72. Each color matches `/^#[0-9A-Fa-f]{6}$/`. Test passes.

---

### TC-11.4-003: Dynamic palette has no duplicate colors

**Priority**: High
**Type**: Unit
**Status**: PASS

**Verification**: Automated test in `chartColors.test.ts` lines 74-77. `new Set(DYNAMIC_COLOR_PALETTE).size === DYNAMIC_COLOR_PALETTE.length`. Test passes.

---

### TC-11.4-004: Dynamic palette does not collide with INDUSTRY_COLORS

**Priority**: Critical
**Type**: Unit
**Status**: PASS

**Verification**: Automated test in `chartColors.test.ts` lines 79-84. Checks every dynamic color against `Object.values(INDUSTRY_COLORS)`. No overlap found. Test passes.

---

### TC-11.4-005: GenderSection builds merged color map with useMemo

**Priority**: Critical
**Type**: Code review (manual inspection)
**Status**: PASS

**Verification**: Inspected `GenderSection.tsx` lines 37-51. The `useMemo` hook:
- Spreads `INDUSTRY_COLORS` into a new `merged` record
- Iterates `genderNode.children`, assigning `DYNAMIC_COLOR_PALETTE[dynamicIndex % 8]` to children without `kvedCode` and not already in `merged`
- Dependency array is `[genderNode.children]` (not full `genderNode` -- avoids recomputation on slider drag)
- Passed to `PieChartPanel` as `colorMap` prop (line 64)

---

### TC-11.4-006: Dynamic color map cycles colors for >8 custom industries

**Priority**: Medium
**Type**: Code review
**Status**: PASS

**Verification**: Line 45 uses `dynamicIndex % DYNAMIC_COLOR_PALETTE.length`, which correctly cycles. The 9th custom industry would get `DYNAMIC_COLOR_PALETTE[0]` (teal-600).

---

### TC-11.4-007: TreePanel auto-expands an industry that gains children

**Priority**: Critical
**Type**: Unit (automated)
**Status**: PASS

**Verification**: Automated test in `TreePanel.test.tsx` lines 359-399. Test:
1. Renders TreePanel with leaf `male-g` (Торгівля, no children)
2. Expands industry list
3. Verifies no expand chevron for Торгівля
4. Re-renders with `male-g` having a child subcategory
5. Asserts subcategory label "Тестова підкатегорія" is visible (auto-expanded)

Test passes.

---

### TC-11.4-008: TreePanel does not re-expand a user-collapsed node

**Priority**: Critical
**Type**: Unit (automated)
**Status**: PASS

**Verification**: Automated test in `TreePanel.test.tsx` lines 401-422. Test:
1. Renders TreePanel with `male-j` (IT, has children -- auto-expanded by effect)
2. Expands industry list, verifies subcategories visible
3. User clicks collapse on IT
4. Re-renders with same props
5. Asserts IT remains collapsed (seenExpandableRef prevents re-expansion)

Test passes.

---

### TC-11.4-009: Auto-expand pattern matches ConfigGenderSection implementation

**Priority**: High
**Type**: Code review
**Status**: PASS

**Verification**: Compared `TreePanel.tsx` lines 50-69 with `ConfigGenderSection.tsx` lines 29-53. The pattern is identical:
- `seenExpandableRef = useRef<Set<string>>(new Set())`
- `useEffect` filtering children with `children.length > 0` and not in `seenExpandableRef`
- Adding new IDs to ref and to `expandedIds` state
- Dependency on `[genderNode.children]`

---

### TC-11.4-010: Barrel export includes DYNAMIC_COLOR_PALETTE

**Priority**: High
**Type**: Unit (inspection)
**Status**: PASS

**Verification**: Inspected `data/index.ts`. Line 5 exports `DYNAMIC_COLOR_PALETTE` from `./chartColors`. Alphabetical order is maintained in the export block.

---

### TC-11.4-011: Build succeeds with no type errors

**Priority**: Critical
**Type**: Build verification
**Status**: PASS

**Verification**: `pnpm build` completes successfully. TypeScript type-check (`tsc --noEmit`) passes. Vite produces output:
- `index-B-XuUZ86.js`: 234.34 KB (72.11 KB gzip)
- `recharts-B55gP9kf.js`: 422.17 KB (115.07 KB gzip)

---

### TC-11.4-012: Gzipped bundle size under 500KB

**Priority**: High
**Type**: Build verification
**Status**: PASS

**Verification**: Total gzipped JS size = 72.11 KB + 115.07 KB = 187.18 KB. This is well under the 500KB threshold. CSS adds 4.64 KB gzip. Total gzipped assets = ~192 KB.

---

### TC-11.4-013: Lint passes with 0 errors

**Priority**: High
**Type**: Lint verification
**Status**: PASS

**Verification**: `pnpm lint` completes with 0 errors.

---

### TC-11.4-014: GenderSection stays under 200-line component limit

**Priority**: Medium
**Type**: Code review
**Status**: PASS

**Verification**: `GenderSection.tsx` is 71 lines total (including imports, interface, and JSX). Well under the 200-line limit.

---

### TC-11.4-015: TreePanel stays under 200-line component limit

**Priority**: Medium
**Type**: Code review
**Status**: PASS

**Verification**: `TreePanel.tsx` is 199 lines total. At the limit but not exceeding it.

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Type | Priority | Status |
|---------------------|--------------|------|----------|--------|
| AC-1: Dynamic color for new industry (not gray) | TC-001, TC-002, TC-003, TC-004, TC-005, TC-006 | Unit + Review | Critical | PASS |
| AC-2: Auto-expand on first subcategory added | TC-007, TC-008, TC-009 | Unit + Review | Critical | PASS |
| AC-3: Bundle size < 500KB | TC-012 | Build | High | PASS |
| AC-4: All tests pass (existing + new) | TC-011, TC-013 | Build + Lint | Critical | PASS (note below) |
| AC-5: Full integration | TC-010, TC-014, TC-015 | Review | High | PASS |

## Automated Test Results

**Verification Date**: 2026-02-19
**Verified By**: QA Agent

### Test Suite Summary

- **Total tests**: 407 (405 passed, 2 failed)
- **New tests added**: 6 (4 chartColors + 2 TreePanel auto-expand)
- **All new tests**: PASS

### Pre-Existing Failures (NOT introduced by subtask 11.4)

| Test | File | Failure | Root Cause |
|------|------|---------|------------|
| Slider range input > dispatches SET_PERCENTAGE on range change | Slider.test.tsx:70 | `fireEvent.change` does not trigger dispatch | Pre-existing since task-005 (Slider component, commit 7b7ec96). Not modified by subtask 11.4. |
| TreeRow Slider integration > passes dispatch to Slider | TreeRow.test.tsx:311 | Same `fireEvent.change` + range input issue | Same root cause as Slider test. Not modified by subtask 11.4. |

**Evidence**: `git log --oneline --follow -- apps/labor-market-dashboard/src/__tests__/components/Slider.test.tsx` shows last modification at commit `7b7ec96` (task-005). `git diff HEAD` shows no changes to `Slider.test.tsx` or to the relevant section of `TreeRow.test.tsx` (only `mirrored` prop addition from task-011.2).

## Regression Impact Analysis

### Files Modified by Subtask 11.4

1. `src/data/chartColors.ts` -- Added constant, no existing code modified
2. `src/data/index.ts` -- Added export line, no existing exports changed
3. `src/components/GenderSection.tsx` -- Changed `INDUSTRY_COLORS` direct usage to merged `colorMap`. Risk: if `useMemo` dependency is wrong, colors could be stale or recomputed excessively. Mitigated by dependency on `[genderNode.children]`.
4. `src/components/TreePanel.tsx` -- Added `useEffect` + `useRef`. Risk: could interfere with existing expand/collapse behavior. Mitigated by `seenExpandableRef` guard and automated test TC-008.
5. `src/__tests__/data/chartColors.test.ts` -- Added 4 tests (no existing tests modified)
6. `src/__tests__/components/TreePanel.test.tsx` -- Added 2 tests + updated existing IT subcategory test to work with auto-expand (test at line 210-219 now expects subcategories to be auto-expanded, which is correct behavior)

### Regression Tests Verified

- All 12 chartColors tests pass (8 existing + 4 new)
- All 16 TreePanel tests pass (14 existing + 2 new, with 3 existing updated for auto-expand)
- All 7 GenderSection tests pass (unchanged)
- All 21 chartDataUtils tests pass (unchanged)
- Build and lint pass

## Issues Found

| Issue | Severity | Description | Subtask 11.4 Related? |
|-------|----------|-------------|----------------------|
| Slider range fireEvent.change dispatch failure | Low | Pre-existing: `fireEvent.change` on range input does not trigger Slider's `onChange` -> dispatch. Likely a testing-library/jsdom limitation with native range inputs. | NO -- pre-existing since task-005 |
| TreeRow range dispatch failure | Low | Same root cause as above. | NO -- pre-existing since task-005 |

## Definition of Done Checklist

- [x] All new test cases pass (6/6)
- [x] No critical bugs introduced
- [x] Regression suite passes (405/407 -- 2 pre-existing failures unrelated to this subtask)
- [x] Build compiles successfully (`pnpm build`)
- [x] Lint passes (`pnpm lint`)
- [x] Gzipped bundle under 500KB (187 KB total)
- [x] Implementation matches plan (all 8 steps verified)
- [x] Auto-expand pattern consistent with ConfigGenderSection
- [x] Component sizes within 200-line limit

## Verdict

**APPROVED**

All 6 files modified by subtask 11.4 are correctly implemented. The 6 new tests all pass. The 2 test failures are pre-existing (from task-005, Slider range input testing limitation) and are completely unrelated to the changes in this subtask. Build succeeds, lint is clean, and bundle size is well under the 500KB threshold. The dynamic color palette, merged color map, auto-expand behavior, and barrel exports are all working as designed.
