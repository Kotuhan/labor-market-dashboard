# Subtask 8.1: Create ModeToggle and ResetButton Components

## Parent Task
docs/tasks/task-008-dashboard-layout

## Description
Create two new leaf components: ModeToggle (auto/free balance mode toggle switch) and ResetButton (reset with browser confirm() dialog). These are independent building blocks with no dependencies on other new components.

Covers TL design Steps 1 and 2.

## Acceptance Criteria

### ModeToggle
* Given the dashboard is in auto-balance mode, when the user activates the mode toggle, then SET_BALANCE_MODE is dispatched with mode 'free' and the indicator updates
* Given the dashboard is in free mode, when the user activates the mode toggle, then SET_BALANCE_MODE is dispatched with mode 'auto' and the indicator updates
* Given the mode toggle, when a screen reader user encounters it, then appropriate aria attributes convey the current state
* Given the toggle control, when measured, then it meets 44x44px minimum touch target

### ResetButton
* Given the user clicks the reset button, when the browser confirmation dialog appears, then the dialog asks the user to confirm
* Given confirmation dialog is showing, when the user confirms, then RESET action is dispatched
* Given confirmation dialog is showing, when the user cancels, then no action is dispatched
* Given the reset button, when measured, then it meets 44x44px minimum touch target

## Files to Create
- `apps/labor-market-dashboard/src/components/ModeToggle.tsx`
- `apps/labor-market-dashboard/src/components/ResetButton.tsx`
- `apps/labor-market-dashboard/src/__tests__/components/ModeToggle.test.tsx`
- `apps/labor-market-dashboard/src/__tests__/components/ResetButton.test.tsx`

## Files to Modify
- `apps/labor-market-dashboard/src/components/index.ts` (add barrel exports for both)

## Arch-Review Conditions
- Both components MUST be added to components/index.ts with value + type exports
