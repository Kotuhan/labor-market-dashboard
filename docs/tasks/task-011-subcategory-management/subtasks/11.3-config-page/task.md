# Subtask 11.3: Config Page Components

## Parent Task
task-011-subcategory-management

## Description
Create all configuration page components: ConfirmDialog (native `<dialog>`), AddNodeForm (inline label input), ConfigSubcategoryRow, ConfigIndustryRow, ConfigGenderSection, and ConfigPage composition root. Covers TL design Steps 9-14.

## Acceptance Criteria

* Given the ConfirmDialog is opened
  When the user clicks Confirm
  Then the onConfirm callback fires and the dialog closes

* Given the ConfirmDialog is open
  When the user presses Escape or clicks Cancel
  Then the dialog closes without action

* Given the AddNodeForm receives focus
  When the user types a label and clicks "Add"
  Then the appropriate action (ADD_INDUSTRY or ADD_SUBCATEGORY) is dispatched with the label

* Given the AddNodeForm has an empty label
  When the user clicks "Add"
  Then nothing is dispatched (button disabled)

* Given the ConfigGenderSection shows industries
  When the user clicks "Remove" on an industry
  Then a ConfirmDialog appears with the industry name and warning about subcategories

* Given the user confirms removal
  When the dialog closes
  Then REMOVE_INDUSTRY is dispatched and the industry disappears from the list

* Given there is only one industry remaining
  When the user tries to remove it
  Then the removal is blocked with an informative message

* Given the ConfigPage renders
  When state and dispatch are passed
  Then it shows h1 title and two ConfigGenderSection instances (male/female)

* Given a ConfigIndustryRow is expanded
  When it has subcategories
  Then ConfigSubcategoryRow components and an AddNodeForm for subcategories are shown

## Verification Steps

1. `pnpm test` -- ConfirmDialog tests pass (open, close, confirm, cancel, Escape)
2. `pnpm test` -- AddNodeForm tests pass (submit, validation, dispatch, clear)
3. `pnpm test` -- ConfigGenderSection tests pass (render, add, remove flow)
4. `pnpm test` -- ConfigPage tests pass
5. `pnpm build` -- no type errors
6. `pnpm lint` -- no errors

## Files to Create/Modify

### Create
- `src/components/config/ConfirmDialog.tsx`
- `src/components/config/AddNodeForm.tsx`
- `src/components/config/ConfigSubcategoryRow.tsx`
- `src/components/config/ConfigIndustryRow.tsx`
- `src/components/config/ConfigGenderSection.tsx`
- `src/components/config/ConfigPage.tsx`
- `src/components/config/index.ts`
- `src/__tests__/components/config/ConfirmDialog.test.tsx`
- `src/__tests__/components/config/AddNodeForm.test.tsx`
- `src/__tests__/components/config/ConfigGenderSection.test.tsx`
- `src/__tests__/components/config/ConfigPage.test.tsx`

### Modify
- `src/components/index.ts` (add config barrel re-export)
