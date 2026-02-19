# Subtask 11.2: Layout and Routing

## Parent Task
task-011-subcategory-management

## Description
Create AppLayout and Sidebar components for navigation, extract DashboardPage from current App.tsx, and restructure App.tsx to be the router boundary with wouter hash routing. Covers TL design Steps 7, 8, and 15.

## Acceptance Criteria

* Given the app is loaded at the root URL
  When the page renders
  Then the dashboard is displayed as the default view (route `/#/`)

* Given the user clicks the sidebar toggle
  When the sidebar opens
  Then it shows navigation links for "Dashboard" and "Configuration"

* Given the sidebar is open
  When the user clicks "Configuration"
  Then the URL changes to `/#/config` and a placeholder config page is displayed

* Given the user navigates to `/#/config` via sidebar
  When they click "Dashboard"
  Then the URL changes to `/#/` and the dashboard is displayed with all state preserved

* Given the user navigates directly to `/#/config` via browser URL
  When the page loads
  Then the config page renders correctly

* Given the sidebar is rendered
  When the user navigates via keyboard
  Then all links are focusable and operable via Tab/Enter/Space

* Given the DashboardPage component renders
  When state and dispatch are passed as props
  Then it renders DashboardHeader and 2 GenderSections identically to the previous App.tsx

## Verification Steps

1. `pnpm test` -- Sidebar tests pass (navigation, toggle, active state, a11y)
2. `pnpm test` -- DashboardPage tests pass
3. `pnpm build` -- no type errors
4. `pnpm dev` -- navigate between pages, state preserved
5. Direct URL `/#/config` loads correctly
6. `pnpm lint` -- no errors

## Files to Create/Modify

### Create
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/index.ts`
- `src/components/DashboardPage.tsx`
- `src/__tests__/components/layout/Sidebar.test.tsx`
- `src/__tests__/components/DashboardPage.test.tsx`

### Modify
- `src/App.tsx` (add wouter router, AppLayout, route-based rendering)
- `src/components/index.ts` (add exports for DashboardPage, layout components)
