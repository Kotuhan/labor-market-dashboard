# QA Verification: Subtask 11.1 -- Core Infrastructure

**Verification Date**: 2026-02-19
**Verified By**: QA Agent

## Test Scope

Verification of the core infrastructure for subcategory management (task-011, subtask 11.1). This subtask introduces:
- wouter routing library installation
- `slugify()` utility for Ukrainian-to-Latin transliteration
- 3 new tree utility functions: `generateUniqueId`, `addChildToParent`, `removeChildFromParent`
- 4 new TreeAction types: `ADD_INDUSTRY`, `REMOVE_INDUSTRY`, `ADD_SUBCATEGORY`, `REMOVE_SUBCATEGORY`
- 4 new reducer case handlers in `useTreeState`
- ADR-0006 for wouter adoption
- Barrel export updates

## Verification Commands

| Command | Result | Details |
|---------|--------|---------|
| `pnpm test` | PASS | 323 tests passed across 20 test files (2.75s) |
| `pnpm lint` | PASS | 0 errors (cache hit) |
| `pnpm build` | PASS | Build succeeds, ~176KB gzipped total (65KB app + 106KB recharts vendor) |

## Test Count Analysis

| Source | Test Count | Notes |
|--------|------------|-------|
| Main branch (before changes) | 290 | Baseline from `git stash` verification |
| Current (after changes) | 323 | 33 new test cases added |
| Claimed in workflow-history | 77 new | INACCURATE -- actual delta is 33 new tests |

### New Test Breakdown

| Test File | New Tests | Description |
|-----------|-----------|-------------|
| `slugify.test.ts` | 10 | New file: Cyrillic transliteration, edge cases |
| `treeUtils.test.ts` | 14 | 4 generateUniqueId + 4 addChildToParent + 6 removeChildFromParent |
| `useTreeState.test.ts` | 19 | 7 ADD_INDUSTRY + 4 REMOVE_INDUSTRY + 4 ADD_SUBCATEGORY + 4 REMOVE_SUBCATEGORY |

## Acceptance Criteria Verification

### AC-1: wouter installation and build
**Status**: PASS

- `package.json` includes `"wouter": "^3.9.0"` in dependencies
- `pnpm build` succeeds
- Bundle size: ~176KB gzipped total (within 500KB budget)

### AC-2: slugify() transliteration
**Status**: PASS

- `slugify("Кібербезпека")` returns `"kiberbezpeka"` (verified via test)
- Full 33-character Ukrainian Cyrillic-to-Latin map in `CYRILLIC_TO_LATIN` constant
- Algorithm: lowercase, transliterate, drop non-alphanumeric, collapse hyphens, trim, fallback to "node"
- 10 test cases covering: simple words, multi-word, soft sign, special chars, Latin input, mixed, empty, whitespace, hyphens, numbers

### AC-3: addChildToParent() with equal redistribution
**Status**: PASS

- Uses `largestRemainder()` to ensure exact 100.0% sum
- Tested with 2-child parent (result: 3 children at ~33.3%), 0-child parent (result: 100%), 6-child parent (result: 7 at ~14.3%)
- Immutability verified (original tree unchanged)

### AC-4: removeChildFromParent() with redistribution guard
**Status**: PASS

- Blocks removal when `parent.children.length <= 1` (returns original tree reference)
- Redistributes remaining children equally after removal
- Returns original tree when parent not found
- Handles child-not-found gracefully (returns tree with cloned path but same values)
- 6 test cases covering all edge cases

### AC-5: generateUniqueId() collision handling
**Status**: PASS

- Returns base ID `${prefix}-${slug}` when no collision
- Appends `-2`, `-3`, etc. when collisions exist
- Counter starts at 2 (correct per plan)
- 4 test cases: no collision, single collision, double collision, empty slug

### AC-6: ADD_INDUSTRY reducer handler
**Status**: PASS

- Finds gender node, generates slug via `slugify`, generates unique ID
- Sets `genderSplit` based on gender prefix (`male: {male:100, female:0}`, `female: {male:0, female:100}`)
- Sets `defaultPercentage: 0` for custom nodes
- Calls `addChildToParent` for equal redistribution
- Calls `recalcTreeFromRoot` for absolute value recalculation
- No-op when genderId not found
- 7 test cases

### AC-7: REMOVE_INDUSTRY reducer handler
**Status**: PASS

- Uses `removeChildFromParent` which blocks removal of last industry
- Cascades removal (industry + all subcategories removed)
- Recalculates absolute values
- No-op when nodeId not found
- 4 test cases

### AC-8: ADD_SUBCATEGORY reducer handler
**Status**: PASS

- Adds subcategory with industry prefix in ID (`male-b-test`)
- Inherits `genderSplit` from parent industry (cloned via spread)
- Works for both leaf industries (becomes expandable) and industries with existing subcategories
- No-op when industryId not found
- 4 test cases

### AC-9: REMOVE_SUBCATEGORY allows leaf conversion
**Status**: PASS (CRITICAL DESIGN DECISION)

- Does NOT use `removeChildFromParent` (which blocks last-child removal)
- Uses `updateChildrenInTree` with inline logic
- When `remaining.length === 0`, returns `[]` -- industry becomes leaf
- Verified via 2-step sequential removal test (remove sub1, then sub2)
- Recalculates absolute values after removal
- 4 test cases

### AC-10: ADR-0006 created
**Status**: PASS

- File exists at `architecture/decisions/adr-0006-adopt-wouter-for-hash-routing.md`
- Follows MADR template format (frontmatter, context, drivers, options, outcome, consequences)
- Documents: wouter selection rationale, hash routing via `useHashLocation`, escalation path
- References related ADRs (0004, 0005)
- `architecture/CLAUDE.md` updated: "Next available: 0007"

## Edge Case Analysis

### Critical Edge Cases Verified

| Edge Case | Code Location | Status | Verification Method |
|-----------|---------------|--------|---------------------|
| `removeChildFromParent` blocks last child | `treeUtils.ts:180` | PASS | Unit test + code review |
| `generateUniqueId` collision handling | `treeUtils.ts:127-133` | PASS | Unit test (3 collision scenarios) |
| `REMOVE_SUBCATEGORY` allows leaf conversion | `useTreeState.ts:274` | PASS | Unit test (sequential removal) |
| `ADD_INDUSTRY` correct genderSplit | `useTreeState.ts:201-204` | PASS | Unit tests (male + female) |
| `slugify` empty input fallback | `slugify.ts:60` | PASS | Unit tests (empty + whitespace) |
| `largestRemainder` ensures 100.0% sum | Multiple locations | PASS | `toBeCloseTo(100, 1)` assertions |
| Immutability preserved | `treeUtils.ts` all functions | PASS | `result !== tree` assertions |

### Minor Observations (Non-Blocking)

1. **Unreachable code**: In `REMOVE_SUBCATEGORY` handler (line 286), `if (newTree === state.tree) return state;` is effectively unreachable because `updateChildrenInTree` always creates new objects along the path when the parent is found. This is harmless defensive code.

2. **`removeChildFromParent` child-not-found behavior**: When the parent IS found but the `childId` is not among its children, the function returns a new tree with cloned path but identical values (not the same reference). The `REMOVE_INDUSTRY` handler's `newTree === state.tree` check would NOT catch this case. However, this scenario cannot occur through the reducer because `findParentById` guarantees the child exists under the returned parent.

3. **Test count discrepancy**: The workflow-history claims "77 new tests" but the actual delta is 33 new tests (290 to 323). The total count of 323 is correct.

4. **Plan.md expected value typos**: Two slugify test expectations in plan.md differ from actual code:
   - Plan says `"test-znachennia"`, actual test correctly uses `"test-znachennya"` (я -> ya, not ia)
   - Plan says `"katehoriia-3"`, actual test correctly uses `"katehoriya-3"` (ія -> iya, not iia)
   - The actual tests are correct per the transliteration map.

## Files Verified

### Created (3)
| File | Status |
|------|--------|
| `apps/labor-market-dashboard/src/utils/slugify.ts` | Verified |
| `apps/labor-market-dashboard/src/__tests__/utils/slugify.test.ts` | Verified |
| `architecture/decisions/adr-0006-adopt-wouter-for-hash-routing.md` | Verified |

### Modified (8)
| File | Change | Status |
|------|--------|--------|
| `apps/labor-market-dashboard/package.json` | wouter dependency added | Verified |
| `apps/labor-market-dashboard/src/utils/treeUtils.ts` | 3 new functions + largestRemainder import | Verified |
| `apps/labor-market-dashboard/src/types/actions.ts` | 4 new union members + JSDoc update | Verified |
| `apps/labor-market-dashboard/src/hooks/useTreeState.ts` | 4 case handlers + new imports | Verified |
| `apps/labor-market-dashboard/src/utils/index.ts` | Barrel exports for slugify + 3 treeUtils functions | Verified |
| `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts` | 14 new tests | Verified |
| `apps/labor-market-dashboard/src/__tests__/hooks/useTreeState.test.ts` | 19 new tests + createGenderState helper | Verified |
| `architecture/CLAUDE.md` | Next ADR number updated to 0007 | Verified |

## Regression Impact

- **Existing tests**: All 290 pre-existing tests continue to pass (no regressions)
- **Tree operations**: New functions are additive and do not modify existing function signatures
- **Actions union**: Extended with 4 new members; existing 5 unchanged (backward compatible)
- **Bundle size**: Negligible increase (~1KB for wouter, tree functions are shared code)

## Definition of Done Checklist

- [x] All 323 tests pass
- [x] No lint errors
- [x] Build succeeds
- [x] All 10 acceptance criteria verified
- [x] Edge cases verified via tests and code review
- [x] Immutability preserved in all new functions
- [x] `largestRemainder` used for all percentage redistribution
- [x] ADR-0006 follows template format
- [x] Barrel exports updated
- [x] No regressions in existing tests

## Verdict

**APPROVED**

All acceptance criteria pass. The implementation correctly handles all critical edge cases:
- `REMOVE_SUBCATEGORY` correctly allows removing the last subcategory (industry becomes leaf) by using `updateChildrenInTree` directly instead of `removeChildFromParent`
- `REMOVE_INDUSTRY` correctly blocks removal of the last industry via `removeChildFromParent`
- `generateUniqueId` handles collisions with incrementing suffixes
- `slugify` handles the full Ukrainian alphabet with proper edge cases

Minor observations (test count discrepancy in documentation, unreachable defensive code, plan.md typos) are non-blocking and do not affect correctness.
