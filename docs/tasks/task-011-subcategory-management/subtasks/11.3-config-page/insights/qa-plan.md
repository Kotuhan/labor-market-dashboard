# QA Plan: Subtask 11.3 -- Config Page Components

Generated: 2026-02-19

## Test Scope

This QA plan verifies the six new config page components (ConfirmDialog, AddNodeForm, ConfigSubcategoryRow, ConfigIndustryRow, ConfigGenderSection, ConfigPage), their barrel exports, the App.tsx route wiring, and the dialog::backdrop CSS rule. Covers TL design Steps 9-14.

---

## Test Cases

### TC-11.3-001: ConfirmDialog fires onConfirm on Confirm click
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given the ConfirmDialog is opened, when the user clicks Confirm, then the onConfirm callback fires and the dialog closes.
**Verified By**: `ConfirmDialog.test.tsx` -- "calls onConfirm when Confirm button is clicked"
**Status**: PASS

### TC-11.3-002: ConfirmDialog closes on Cancel or Escape
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given the ConfirmDialog is open, when the user presses Escape or clicks Cancel, then the dialog closes without action.
**Verified By**: `ConfirmDialog.test.tsx` -- "calls onCancel when Cancel button is clicked" + "calls onCancel when dialog cancel event fires (Escape key)"
**Status**: PASS

### TC-11.3-003: ConfirmDialog does not show when closed
**Priority**: High
**Type**: Unit
**Verified By**: `ConfirmDialog.test.tsx` -- "does not show content when isOpen is false"
**Status**: PASS

### TC-11.3-004: ConfirmDialog shows title and message when open
**Priority**: High
**Type**: Unit
**Verified By**: `ConfirmDialog.test.tsx` -- "shows title and message when isOpen is true"
**Status**: PASS

### TC-11.3-005: ConfirmDialog accessibility (role=dialog, touch targets)
**Priority**: Medium
**Type**: Unit
**Verified By**: `ConfirmDialog.test.tsx` -- "dialog has role=\"dialog\"" + "Confirm and Cancel buttons meet 44px touch target (h-11)"
**Status**: PASS

### TC-11.3-006: AddNodeForm dispatches ADD_INDUSTRY on submit
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given the AddNodeForm receives focus, when the user types a label and clicks "Add", then the appropriate action (ADD_INDUSTRY) is dispatched with the label.
**Verified By**: `AddNodeForm.test.tsx` -- "dispatches ADD_INDUSTRY with correct payload on submit"
**Status**: PASS

### TC-11.3-007: AddNodeForm dispatches ADD_SUBCATEGORY on submit
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given the AddNodeForm receives focus, when the user types a label and clicks "Add", then the appropriate action (ADD_SUBCATEGORY) is dispatched with the label.
**Verified By**: `AddNodeForm.test.tsx` -- "dispatches ADD_SUBCATEGORY with correct payload on submit"
**Status**: PASS

### TC-11.3-008: AddNodeForm disables button for empty input
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given the AddNodeForm has an empty label, when the user clicks "Add", then nothing is dispatched (button disabled).
**Verified By**: `AddNodeForm.test.tsx` -- "renders disabled Add button when input is empty" + "button remains disabled for whitespace-only input"
**Status**: PASS

### TC-11.3-009: AddNodeForm clears input after submit
**Priority**: High
**Type**: Unit
**Verified By**: `AddNodeForm.test.tsx` -- "clears input after successful submit"
**Status**: PASS

### TC-11.3-010: AddNodeForm trims whitespace
**Priority**: High
**Type**: Unit
**Verified By**: `AddNodeForm.test.tsx` -- "trims whitespace from label before dispatch"
**Status**: PASS

### TC-11.3-011: AddNodeForm does not dispatch for whitespace-only
**Priority**: High
**Type**: Unit
**Verified By**: `AddNodeForm.test.tsx` -- "does not dispatch when label is only whitespace"
**Status**: PASS

### TC-11.3-012: AddNodeForm accessibility (aria-label, touch target)
**Priority**: Medium
**Type**: Unit
**Verified By**: `AddNodeForm.test.tsx` -- "input has aria-label matching placeholder" + "button meets 44px touch target (h-11)"
**Status**: PASS

### TC-11.3-013: ConfigGenderSection shows ConfirmDialog on remove click
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given the ConfigGenderSection shows industries, when the user clicks "Remove" on an industry, then a ConfirmDialog appears with the industry name and warning about subcategories.
**Verified By**: `ConfigGenderSection.test.tsx` -- "shows confirmation dialog when remove is clicked" + "shows warning about subcategories when industry has children"
**Status**: PASS

### TC-11.3-014: ConfigGenderSection dispatches REMOVE_INDUSTRY on confirm
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given the user confirms removal, when the dialog closes, then REMOVE_INDUSTRY is dispatched and the industry disappears from the list.
**Verified By**: `ConfigGenderSection.test.tsx` -- "dispatches REMOVE_INDUSTRY on confirm"
**Status**: PASS

### TC-11.3-015: ConfigGenderSection cancels removal without dispatch
**Priority**: High
**Type**: Unit
**Verified By**: `ConfigGenderSection.test.tsx` -- "closes dialog without dispatch on cancel"
**Status**: PASS

### TC-11.3-016: ConfigGenderSection blocks last industry removal
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given there is only one industry remaining, when the user tries to remove it, then the removal is blocked with an informative message.
**Verified By**: `ConfigGenderSection.test.tsx` -- "remove button is disabled when only one industry remains"
**Status**: PASS

### TC-11.3-017: ConfigGenderSection renders gender heading and section
**Priority**: High
**Type**: Unit
**Verified By**: `ConfigGenderSection.test.tsx` -- "renders gender heading as h2" + "renders section with aria-label matching gender label"
**Status**: PASS

### TC-11.3-018: ConfigGenderSection renders industry rows and add form
**Priority**: High
**Type**: Unit
**Verified By**: `ConfigGenderSection.test.tsx` -- "renders an industry row for each child" + "renders \"Add industry\" form"
**Status**: PASS

### TC-11.3-019: ConfigGenderSection dispatches ADD_INDUSTRY via form
**Priority**: Critical
**Type**: Unit
**Verified By**: `ConfigGenderSection.test.tsx` -- "dispatches ADD_INDUSTRY when form is submitted"
**Status**: PASS

### TC-11.3-020: ConfigGenderSection expand/collapse shows subcategories
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given a ConfigIndustryRow is expanded, when it has subcategories, then ConfigSubcategoryRow components and an AddNodeForm for subcategories are shown.
**Verified By**: `ConfigGenderSection.test.tsx` -- "auto-expands industry with subcategories and shows them" + "collapses industry on chevron click and hides subcategories" + "shows add subcategory form when industry is expanded"
**Status**: PASS

### TC-11.3-021: ConfigPage renders h1 title and two gender sections
**Priority**: Critical
**Type**: Unit
**Acceptance Criterion**: Given the ConfigPage renders, when state and dispatch are passed, then it shows h1 title and two ConfigGenderSection instances (male/female).
**Verified By**: `ConfigPage.test.tsx` -- "renders page title as h1" + "renders male gender section" + "renders female gender section" + "renders both gender headings at h2 level"
**Status**: PASS

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Type | Priority | Status |
|---------------------|--------------|------|----------|--------|
| AC-1: ConfirmDialog confirm callback fires | TC-001 | Unit | Critical | PASS |
| AC-2: ConfirmDialog closes on Escape/Cancel | TC-002 | Unit | Critical | PASS |
| AC-3: AddNodeForm dispatches on submit | TC-006, TC-007 | Unit | Critical | PASS |
| AC-4: AddNodeForm disabled for empty label | TC-008 | Unit | Critical | PASS |
| AC-5: ConfirmDialog on industry remove | TC-013 | Unit | Critical | PASS |
| AC-6: REMOVE_INDUSTRY on confirm | TC-014 | Unit | Critical | PASS |
| AC-7: Last industry removal blocked | TC-016 | Unit | Critical | PASS |
| AC-8: ConfigPage shows h1 + two gender sections | TC-021 | Unit | Critical | PASS |
| AC-9: Expanded industry shows subcategories + AddNodeForm | TC-020 | Unit | Critical | PASS |

---

## Verification Checklist

### Files Created (11/11)
- [x] `src/components/config/ConfirmDialog.tsx` -- 80 lines, native `<dialog>`, showModal/close, cancel event handler
- [x] `src/components/config/AddNodeForm.tsx` -- 79 lines, form submit, ADD_INDUSTRY/ADD_SUBCATEGORY dispatch
- [x] `src/components/config/ConfigSubcategoryRow.tsx` -- 56 lines, display + onRemoveRequest callback
- [x] `src/components/config/ConfigIndustryRow.tsx` -- 151 lines, expand/collapse chevron, subcategory rendering
- [x] `src/components/config/ConfigGenderSection.tsx` -- 135 lines, expand state, removal flow, ConfirmDialog
- [x] `src/components/config/ConfigPage.tsx` -- 37 lines, h1 + 2-column grid composition root
- [x] `src/components/config/index.ts` -- 17 lines, barrel exports (value + type)
- [x] `src/__tests__/components/config/ConfirmDialog.test.tsx` -- 129 lines, 8 tests
- [x] `src/__tests__/components/config/AddNodeForm.test.tsx` -- 176 lines, 11 tests
- [x] `src/__tests__/components/config/ConfigGenderSection.test.tsx` -- 264 lines, 13 tests
- [x] `src/__tests__/components/config/ConfigPage.test.tsx` -- 139 lines, 4 tests

### Files Modified (3/3)
- [x] `src/components/index.ts` -- config barrel re-export added (6 value exports + 6 type exports)
- [x] `src/App.tsx` -- `/config` route replaced with `<ConfigPage state={state} dispatch={dispatch} />`
- [x] `src/index.css` -- `dialog::backdrop` CSS rule added

### Code Quality
- [x] All components use named exports (no default exports)
- [x] All components under 200 lines (max: ConfigIndustryRow at 151 lines)
- [x] Props interfaces have JSDoc documentation
- [x] Import ordering follows convention (external, @/ alias, relative)
- [x] Vitest v3 mock syntax used (`vi.fn<(action: TreeAction) => void>()`)
- [x] `afterEach(cleanup)` in all test files
- [x] `makeProps()` factory pattern in all test files
- [x] Dialog `showModal`/`close` mocked in `beforeAll` (3 test files that need it)
- [x] Touch targets: all interactive buttons use `h-11` (44px WCAG 2.5.5)
- [x] Heading hierarchy: `<h1>` in ConfigPage, `<h2>` in ConfigGenderSection
- [x] `aria-label` on sections, `aria-expanded` on chevrons, `aria-label` on remove buttons
- [x] Ukrainian labels throughout ("Додати", "Скасувати", "Підтвердити", "Видалити", "Назва галузі", "Назва підкатегорії")

### Build Verification
- [x] `pnpm test` -- 401 tests pass (28 test files), including 36 new config tests
- [x] `pnpm build` -- compiles successfully, no type errors
- [x] `pnpm lint` -- passes with 0 errors

### Pattern Compliance
- [x] Barrel exports follow `export { Component } from '...'` + `export type { Props } from '...'` pattern
- [x] ConfigPage follows DashboardPage composition pattern (state + dispatch props, no local state)
- [x] ConfigGenderSection manages expand/collapse via `useState<Set<string>>` (UI-only, not in reducer)
- [x] Auto-expand on first subcategory uses `useRef` to track seen IDs (prevents re-expand after user collapse)
- [x] Remove flow uses single ConfirmDialog per gender section with `pendingRemoval` state
- [x] ConfigSubcategoryRow does not dispatch directly -- calls `onRemoveRequest` for parent to handle
- [x] ConfigIndustryRow forwards `onRemoveRequest` to ConfigSubcategoryRow children
- [x] `isRemoveBlocked` prevents removing last industry (`genderNode.children.length <= 1`)
- [x] App.tsx imports ConfigPage from `@/components/config` (not from barrel)
- [x] No `any` types used anywhere

---

## Automated Test Results

**Verification Date**: 2026-02-19
**Verified By**: QA Agent

### Test Suites
- ConfirmDialog.test.tsx: 8 tests passed
- AddNodeForm.test.tsx: 11 tests passed
- ConfigGenderSection.test.tsx: 13 tests passed
- ConfigPage.test.tsx: 4 tests passed
- **Total new tests**: 36 passed, 0 failed

### Full Suite
- **28 test files**, **401 tests** passed
- No regressions in existing tests

### Test Case Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-11.3-001 | PASS | Verified via ConfirmDialog.test.tsx |
| TC-11.3-002 | PASS | Verified via ConfirmDialog.test.tsx (Cancel + Escape) |
| TC-11.3-003 | PASS | Verified via ConfirmDialog.test.tsx |
| TC-11.3-004 | PASS | Verified via ConfirmDialog.test.tsx |
| TC-11.3-005 | PASS | Verified via ConfirmDialog.test.tsx (role + h-11) |
| TC-11.3-006 | PASS | Verified via AddNodeForm.test.tsx |
| TC-11.3-007 | PASS | Verified via AddNodeForm.test.tsx |
| TC-11.3-008 | PASS | Verified via AddNodeForm.test.tsx (empty + whitespace) |
| TC-11.3-009 | PASS | Verified via AddNodeForm.test.tsx |
| TC-11.3-010 | PASS | Verified via AddNodeForm.test.tsx |
| TC-11.3-011 | PASS | Verified via AddNodeForm.test.tsx |
| TC-11.3-012 | PASS | Verified via AddNodeForm.test.tsx (aria-label + h-11) |
| TC-11.3-013 | PASS | Verified via ConfigGenderSection.test.tsx |
| TC-11.3-014 | PASS | Verified via ConfigGenderSection.test.tsx |
| TC-11.3-015 | PASS | Verified via ConfigGenderSection.test.tsx |
| TC-11.3-016 | PASS | Verified via ConfigGenderSection.test.tsx |
| TC-11.3-017 | PASS | Verified via ConfigGenderSection.test.tsx |
| TC-11.3-018 | PASS | Verified via ConfigGenderSection.test.tsx |
| TC-11.3-019 | PASS | Verified via ConfigGenderSection.test.tsx |
| TC-11.3-020 | PASS | Verified via ConfigGenderSection.test.tsx (auto-expand + collapse + subcategory form) |
| TC-11.3-021 | PASS | Verified via ConfigPage.test.tsx (h1 + male + female regions + h2 headings) |

---

## Regression Impact Analysis

### Affected Areas
- **App.tsx**: Modified to replace config route placeholder with `<ConfigPage>`. Dashboard route unchanged.
- **components/index.ts**: Extended with config barrel re-exports. Existing exports unchanged.
- **index.css**: Added `dialog::backdrop` rule. Existing range input CSS unchanged.

### Regression Risk: LOW
- All existing 365 tests continue to pass (401 total - 36 new = 365 existing).
- App.tsx changes are additive (ConfigPage import + route swap). DashboardPage route at `/` is untouched.
- The `components/index.ts` changes are purely additive (new exports appended).
- The CSS change adds a new rule targeting `dialog::backdrop` -- no overlap with existing styles.

---

## Issues Found

No issues found.

---

## Verdict

**APPROVED**

All 9 acceptance criteria are verified by passing automated tests. All 11 planned files are created, all 3 modifications are applied. Build compiles, lint passes, 401 tests pass with 0 failures and 0 regressions. Code follows all established project patterns (named exports, barrel conventions, JSDoc, WCAG touch targets, heading hierarchy, Ukrainian labels, import ordering, Vitest v3 mock syntax).
