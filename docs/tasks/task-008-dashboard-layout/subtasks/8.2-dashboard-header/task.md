# Subtask 8.2: Create DashboardHeader Component

## Parent Task
docs/tasks/task-008-dashboard-layout

## Description
Create the DashboardHeader component: a horizontal header bar composing the application title (as `<h1>` per arch-review condition), total population numeric input, ModeToggle, and ResetButton.

Covers TL design Step 3.

## Acceptance Criteria

* Given the dashboard loads, when the header bar renders, then it displays the application title, a total population input (default: 13 500 000), a mode toggle, and a reset button
* Given the header bar is visible, when the user changes the total population input to a valid number, then SET_TOTAL_POPULATION is dispatched
* Given the population input field, when the user enters a non-numeric value, then the input reverts to the previous valid value
* Given the header bar, when a screen reader user encounters it, then the population input has an accessible label
* Given all interactive elements in the header bar, when measured, then each meets 44x44px minimum touch target

## Files to Create
- `apps/labor-market-dashboard/src/components/DashboardHeader.tsx`
- `apps/labor-market-dashboard/src/__tests__/components/DashboardHeader.test.tsx`

## Files to Modify
- `apps/labor-market-dashboard/src/components/index.ts` (add barrel export)

## Dependencies
- Subtask 8.1 (ModeToggle and ResetButton must exist)

## Arch-Review Conditions
- Application title MUST be rendered as `<h1>` (WCAG 1.3.1 heading hierarchy)
- Component MUST be added to components/index.ts with value + type exports
