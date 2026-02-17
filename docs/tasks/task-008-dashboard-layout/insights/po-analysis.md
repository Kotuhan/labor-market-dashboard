# PO Analysis: task-008

Generated: 2026-02-17

## Problem Statement

The dashboard has all foundational building blocks completed -- a 55-node tree data model (task-002), default Ukraine labor market data (task-003), state management with auto-balance and free mode (task-004), interactive sliders with lock/unlock (task-005), pie chart visualization with tooltips, legends, and ghost/overflow handling (task-006), and a tree panel with expand/collapse navigation (task-007). However, these components exist in isolation. The current `App.tsx` renders only a bare TreePanel inside a single card. There is no way for users to:

- Switch between auto-balance and free slider modes
- Edit the total employed population
- Reset to default values
- See pie chart visualizations alongside the tree
- Receive feedback when free-mode percentages deviate from 100%

**From the user's perspective**: "I have sliders and a tree, but I cannot actually model scenarios. I need to change the total population, switch between auto and free mode, see pie charts updating as I adjust values, and get warnings when my numbers do not add up. Right now the app is a half-finished prototype."

**Why now**: All six prerequisite tasks are complete. This is the integration and assembly task that transforms disconnected components into a usable product. Every subsequent task (polish, animations, deployment) depends on having a functioning dashboard layout.

**If we do nothing**: The app remains a single TreePanel in a white card with no mode controls, no population input, no reset capability, no charts, and no warnings. Users cannot perform any meaningful scenario modeling, which is the core value proposition of the product (PRD Section 2).

## Success Criteria

1. User can see a complete dashboard layout with header bar, tree panels, and pie charts on desktop (>=1024px)
2. User can toggle between auto-balance and free slider modes via a visible control in the header
3. User can edit the total employed population via a numeric input in the header, and all absolute values recalculate instantly
4. User can reset all values to defaults via a button that shows a browser confirmation dialog first
5. User can see industry pie charts for both male and female gender sections alongside their respective tree panels
6. User can see mini pie charts for IT subcategories when the IT industry node is expanded (4 charts total when both genders have IT expanded)
7. User receives inline warning text next to any sibling group whose percentages do not sum to 100% in free mode
8. All interactions (mode toggle, population input, reset) dispatch correct actions and UI updates within 100ms (NFR-01)
9. The header bar displays the current balance mode indicator

## Acceptance Criteria

### Header Bar

* Given the dashboard loads
  When the header bar renders
  Then it displays the application title, a total population input (default: 13 500 000), a mode toggle control, and a reset button in a single horizontal bar

* Given the header bar is visible
  When the user changes the total population input to a valid number
  Then a SET_TOTAL_POPULATION action is dispatched
  And all absolute values throughout the tree recalculate

* Given the population input field
  When the user enters a non-numeric value
  Then the input reverts to the previous valid value (no dispatch occurs)

* Given the header bar is visible
  When the user views the mode toggle
  Then the current balance mode (auto or free) is clearly indicated

### Mode Toggle

* Given the dashboard is in auto-balance mode (default)
  When the user activates the mode toggle
  Then the balance mode switches to free
  And a SET_BALANCE_MODE action is dispatched with mode 'free'
  And the mode indicator updates to show "free"

* Given the dashboard is in free mode
  When the user activates the mode toggle
  Then the balance mode switches to auto
  And all sibling groups are normalized to sum to exactly 100%
  And the mode indicator updates to show "auto"

### Reset Button

* Given the user clicks the reset button
  When the browser confirmation dialog appears
  Then the dialog asks the user to confirm the reset action

* Given the browser confirmation dialog is showing
  When the user confirms (clicks OK)
  Then a RESET action is dispatched
  And all values return to defaults (population, mode, all percentages)

* Given the browser confirmation dialog is showing
  When the user cancels
  Then no action is dispatched and current state is preserved

### Main Layout Structure

* Given the dashboard loads on a desktop viewport (>=1024px)
  When the layout renders
  Then the header bar spans the full width at the top
  And below the header, male and female sections are visible

* Given both gender sections are visible
  When the user views the male section
  Then it contains the male TreePanel (industries with sliders) and a male industry pie chart

* Given both gender sections are visible
  When the user views the female section
  Then it contains the female TreePanel (industries with sliders) and a female industry pie chart

### Pie Chart Integration

* Given the male gender section is visible
  When the user views the male pie chart
  Then it shows a standard-size pie chart of male industry distribution using INDUSTRY_COLORS
  And the chart updates in real-time as the user adjusts male industry sliders

* Given the female gender section is visible
  When the user views the female pie chart
  Then it shows a standard-size pie chart of female industry distribution using INDUSTRY_COLORS

* Given the IT industry node (KVED J) under a gender is expanded
  When the user views the expanded IT section
  Then a mini pie chart appears showing the 10 IT subcategory percentages
  And the mini chart uses opacity-based shades of the IT color (teal-500)

* Given an IT subcategory slider is adjusted
  When auto-balance mode is active
  Then the mini pie chart updates to reflect the new subcategory distribution

### Free Mode Warnings

* Given the dashboard is in free mode
  When a sibling group's percentages sum to less than 100%
  Then inline warning text appears next to that group showing the deviation (e.g., "Sum: 95.0% (-5.0%)")

* Given the dashboard is in free mode
  When a sibling group's percentages sum to more than 100%
  Then inline warning text appears next to that group showing the overflow (e.g., "Sum: 108.3% (+8.3%)")

* Given the dashboard is in auto-balance mode
  When the user views any sibling group
  Then no deviation warning text is displayed (auto mode guarantees 100% sums)

* Given the dashboard switches from free mode to auto mode
  When sibling groups had deviations
  Then all warning text disappears as groups normalize to 100%

### Accessibility

* Given the mode toggle control
  When a screen reader user encounters it
  Then appropriate aria attributes convey the current state (auto vs. free)

* Given the reset button
  When a keyboard user navigates to it
  Then it is focusable and activatable via Enter or Space

* Given all interactive elements in the header bar
  When measured
  Then each meets the 44x44px minimum touch target (WCAG 2.5.5)

* Given the total population input
  When a screen reader user encounters it
  Then it has an accessible label describing its purpose

## Out of Scope

- **Mobile and tablet layouts** (below 1024px) -- deferred per PRD NFR-05 (P1). This task targets desktop only (>=1024px).
- **Custom modal component for reset** -- using browser native `confirm()` per user decision. A styled modal is a polish concern.
- **Root-level gender pie chart** (male/female split) -- only industry-level and subcategory-level pie charts are included per user decision.
- **Summary statistics beyond population and mode** -- no derived stats (total male count, total female count, etc.) in the header. Minimal display only.
- **Animated transitions between layout states** -- deferred to PRD M4 polish task.
- **Drag-and-drop or reordering** of layout panels.
- **Persisting layout preferences** (expanded/collapsed state, mode preference) to localStorage.
- **Export or sharing** of dashboard state.
- **Internationalization (i18n)** -- labels remain in Ukrainian as per existing convention.
- **Keyboard shortcuts** for mode toggle or reset (beyond standard button focus/activation).
- **Gender slider** (male/female percentage split control) -- the PRD wireframe shows a gender slider at the top, but this is a separate interaction concern. The tree already has gender nodes as section headers. A dedicated gender slider component is not part of this layout task.

## Open Questions (All Resolved)

* **Q1**: Reset button -- modal confirmation or immediate action? --> **RESOLVED: Simple confirm dialog** -- use browser native `confirm()` before dispatching RESET action. No custom modal component needed.

* **Q2**: Total population input -- where should it live? --> **RESOLVED: Single header bar** -- one horizontal bar at the top containing title, total population input, mode toggle, and reset button.

* **Q3**: What statistics should the SummaryBar display? --> **RESOLVED: Minimal** -- total population input and current balance mode indicator only. No additional derived statistics.

* **Q4**: Warning indicators in free mode -- where should they appear? --> **RESOLVED: Per-group inline** -- warning text inline next to each sibling group header whose percentages do not sum to 100%. Uses existing `getSiblingDeviation()` utility.

* **Q5**: Responsive breakpoints -- what layout at each breakpoint? --> **RESOLVED: Desktop only** -- single layout for >=1024px. Mobile and tablet layouts deferred per PRD NFR-05 (P1 priority).

* **Q6**: Pie charts in the main layout -- which charts are visible and where? --> **RESOLVED: Gender + subcategory** -- one industry pie chart per gender section (standard size) plus mini pie charts for expanded IT subcategories (4 charts total when both IT sections are expanded).

## Recommendations

- The header bar component should be simple and flat -- title, population input, mode toggle, reset button in a flex row. No need for a complex SummaryBar; a single `DashboardHeader` component suffices.
- The mode toggle should clearly communicate which mode is active. A segmented control or toggle switch with labels "Auto" / "Free" works well. The PRD calls it `<ModeToggle>`.
- For the population input, follow the same pattern as the Slider's numeric input: local string state for partial typing, `useEffect` sync from props, commit on blur/Enter. Use `formatAbsoluteValue()` for display when not editing.
- Free mode deviation warnings should use `getSiblingDeviation()` from `utils/calculations.ts`, which already returns the signed deviation from 100%.
- The layout should pull TreePanel and PieChartPanel side-by-side per gender section. The existing components accept all needed props. The `INDUSTRY_COLORS` map and `generateSubcategoryColors()` from task-006 handle chart coloring.
- Consider the 200-line component limit: App.tsx should orchestrate layout but delegate to focused child components (DashboardHeader, gender section panels).
- Mini pie charts for IT subcategories need `generateSubcategoryColors()` called with the IT base color (`#14B8A6` / teal-500) and the subcategory count (10). This produces a gradient-like palette for 10 slices.
