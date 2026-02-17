---
id: task-008
title: Build Dashboard Layout and Mode Controls
status: backlog
priority: medium
dependencies: [6, 7]
created_at: 2026-02-17
---

# Build Dashboard Layout and Mode Controls

## Problem (PO)

The dashboard has all foundational building blocks completed -- a 55-node tree data model (task-002), default Ukraine labor market data (task-003), state management with auto-balance and free mode (task-004), interactive sliders with lock/unlock (task-005), pie chart visualization with tooltips, legends, and ghost/overflow handling (task-006), and a tree panel with expand/collapse navigation (task-007). However, these components exist in isolation. The current `App.tsx` renders only a bare TreePanel inside a single card.

Users cannot: switch between auto-balance and free slider modes, edit the total employed population, reset to default values, see pie chart visualizations alongside the tree, or receive feedback when free-mode percentages deviate from 100%.

**User perspective**: "I have sliders and a tree, but I cannot actually model scenarios. I need to change the total population, switch between auto and free mode, see pie charts updating as I adjust values, and get warnings when my numbers do not add up."

**Why now**: All six prerequisite tasks (2-7) are complete. This is the integration and assembly task that transforms disconnected components into a usable product. Every subsequent task (polish, animations, deployment) depends on having a functioning dashboard layout.

**If we do nothing**: The app remains a single TreePanel in a white card with no mode controls, no population input, no reset capability, no charts, and no warnings. Users cannot perform any meaningful scenario modeling.

## Success Criteria (PO)

1. User can see a complete dashboard layout with header bar, tree panels, and pie charts on desktop (>=1024px)
2. User can toggle between auto-balance and free slider modes via a visible control in the header
3. User can edit the total employed population via a numeric input in the header, and all absolute values recalculate instantly
4. User can reset all values to defaults via a button that shows a browser `confirm()` dialog first
5. User can see industry pie charts for both male and female gender sections alongside their respective tree panels
6. User can see mini pie charts for IT subcategories when the IT industry node is expanded (4 charts total when both genders have IT expanded)
7. User receives inline warning text next to any sibling group whose percentages do not sum to 100% in free mode
8. All interactions (mode toggle, population input, reset) dispatch correct actions and UI updates within 100ms (NFR-01)
9. The header bar displays the current balance mode indicator (auto/free)

## Acceptance Criteria (PO)

### Header Bar

* Given the dashboard loads
  When the header bar renders
  Then it displays the application title, a total population input (default: 13 500 000), a mode toggle control, and a reset button in a single horizontal bar

* Given the header bar is visible
  When the user changes the total population input to a valid number
  Then a SET_TOTAL_POPULATION action is dispatched and all absolute values throughout the tree recalculate

* Given the population input field
  When the user enters a non-numeric value
  Then the input reverts to the previous valid value (no dispatch occurs)

* Given the header bar is visible
  When the user views the mode toggle
  Then the current balance mode (auto or free) is clearly indicated

### Mode Toggle

* Given the dashboard is in auto-balance mode (default)
  When the user activates the mode toggle
  Then the balance mode switches to free, a SET_BALANCE_MODE action is dispatched with mode 'free', and the mode indicator updates

* Given the dashboard is in free mode
  When the user activates the mode toggle
  Then the balance mode switches to auto, all sibling groups are normalized to sum to exactly 100%, and the mode indicator updates

### Reset Button

* Given the user clicks the reset button
  When the browser confirmation dialog appears
  Then the dialog asks the user to confirm the reset action

* Given the browser confirmation dialog is showing
  When the user confirms (clicks OK)
  Then a RESET action is dispatched and all values return to defaults (population, mode, all percentages)

* Given the browser confirmation dialog is showing
  When the user cancels
  Then no action is dispatched and current state is preserved

### Main Layout Structure

* Given the dashboard loads on a desktop viewport (>=1024px)
  When the layout renders
  Then the header bar spans the full width at the top, and below it, male and female sections are visible

* Given both gender sections are visible
  When the user views either gender section
  Then it contains the TreePanel (industries with sliders) and an industry pie chart for that gender

### Pie Chart Integration

* Given a gender section is visible
  When the user views its pie chart
  Then it shows a standard-size pie chart of that gender's industry distribution using INDUSTRY_COLORS, updating in real-time as sliders are adjusted

* Given the IT industry node (KVED J) under a gender is expanded
  When the user views the expanded IT section
  Then a mini pie chart appears showing the 10 IT subcategory percentages using opacity-based shades of teal-500

* Given an IT subcategory slider is adjusted
  When auto-balance mode is active
  Then the mini pie chart updates to reflect the new subcategory distribution

### Free Mode Warnings

* Given the dashboard is in free mode
  When a sibling group's percentages do not sum to 100%
  Then inline warning text appears next to that group showing the deviation (e.g., "Sum: 95.0% (-5.0%)" or "Sum: 108.3% (+8.3%)")

* Given the dashboard is in auto-balance mode
  When the user views any sibling group
  Then no deviation warning text is displayed

* Given the dashboard switches from free mode to auto mode
  When sibling groups had deviations
  Then all warning text disappears as groups normalize to 100%

### Accessibility

* Given the mode toggle control
  When a screen reader user encounters it
  Then appropriate aria attributes convey the current state (auto vs. free)

* Given all interactive elements in the header bar
  When measured
  Then each meets the 44x44px minimum touch target (WCAG 2.5.5)

* Given the total population input
  When a screen reader user encounters it
  Then it has an accessible label describing its purpose

## Out of Scope (PO)

- **Mobile and tablet layouts** (below 1024px) -- deferred per PRD NFR-05 (P1)
- **Custom modal component for reset** -- using browser native `confirm()`. A styled modal is a polish concern.
- **Root-level gender pie chart** (male/female split pie) -- only industry-level and subcategory-level charts included
- **Summary statistics beyond population and mode** -- no derived stats (total male/female count) in the header
- **Animated transitions between layout states** -- deferred to PRD M4 polish task
- **Drag-and-drop or reordering** of layout panels
- **Persisting layout preferences** (expanded/collapsed state, mode preference) to localStorage
- **Export or sharing** of dashboard state
- **Internationalization (i18n)** -- labels remain in Ukrainian per existing convention
- **Keyboard shortcuts** for mode toggle or reset (beyond standard button focus/activation)
- **Gender slider** (dedicated male/female percentage split control) -- not part of this layout task; gender nodes serve as section headers in the tree

## Open Questions (PO)

All questions resolved with user input:

* **Q1**: Reset button -- modal confirmation or immediate action? --> **RESOLVED: Simple confirm dialog** -- use browser native `confirm()` before dispatching RESET. No custom modal needed.
* **Q2**: Total population input -- where should it live? --> **RESOLVED: Single header bar** -- one horizontal bar at top with title, total population input, mode toggle, and reset button.
* **Q3**: What statistics should the SummaryBar display? --> **RESOLVED: Minimal** -- total population input + current balance mode indicator only.
* **Q4**: Warning indicators in free mode -- where should they appear? --> **RESOLVED: Per-group inline** -- warning text inline next to each sibling group header whose percentages do not sum to 100%. Uses `getSiblingDeviation()` from `utils/calculations.ts`.
* **Q5**: Responsive breakpoints -- what layout at each breakpoint? --> **RESOLVED: Desktop only** -- single layout for >=1024px. Mobile/tablet deferred per PRD NFR-05 (P1).
* **Q6**: Pie charts in the main layout -- which charts are visible and where? --> **RESOLVED: Gender + subcategory** -- one industry pie chart per gender section (standard size) plus mini pie charts for expanded IT subcategories (4 charts total when both IT sections expanded).

---

## Technical Notes (TL)

- **Affected modules**: `apps/labor-market-dashboard/src/components/`, `apps/labor-market-dashboard/src/App.tsx`
- **New modules/entities to create**:
  - `src/components/ModeToggle.tsx` -- toggle switch for auto/free balance mode
  - `src/components/ResetButton.tsx` -- reset button with browser confirm()
  - `src/components/DashboardHeader.tsx` -- header bar (title + population input + ModeToggle + ResetButton)
  - `src/components/GenderSection.tsx` -- container pairing TreePanel + PieChartPanel per gender
  - Test files for each new component in `src/__tests__/components/`
- **DB schema change required?** No
- **Architectural considerations**:
  - TreePanel refactored from "renders all genders" to "renders one gender's industries" -- root header moves to DashboardHeader
  - GenderSection pairs a gender's tree + pie chart side-by-side in a flex/grid layout
  - Population input uses same controlled-input pattern as Slider (local string state, useEffect sync, commit on blur/Enter)
  - Free-mode deviation warnings rendered inline in TreePanel (gender-level) and TreeRow (subcategory-level) using existing `getSiblingDeviation()`
  - Mini IT subcategory pie charts rendered conditionally in TreeRow when node is expanded and has children
  - App.tsx is composition root only -- iterates `state.tree.children` and renders DashboardHeader + 2 GenderSections
- **Known risks or trade-offs**:
  - TreePanel API change (Medium): breaking change to existing tests, mitigated by updating tests in same step
  - Component count (Low): 4 new components, each < 100 lines
- **Test plan**: Unit tests for all new components; updated tests for refactored TreePanel and TreeRow; no integration tests needed

## Implementation Steps (TL)

### Step 1 -- Create ModeToggle component
- **Files**: create `src/components/ModeToggle.tsx`, `src/__tests__/components/ModeToggle.test.tsx`; modify `src/components/index.ts`
- **Details**: Toggle switch with "Авто" / "Вільний" labels. Props: `balanceMode`, `dispatch`. Dispatches `SET_BALANCE_MODE`. Uses `role="switch"` or `aria-pressed`. 44x44px touch target.
- **Tests**: ~8-10 (renders mode label, dispatches correct action, accessible name/role, touch target)
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes

### Step 2 -- Create ResetButton component
- **Files**: create `src/components/ResetButton.tsx`, `src/__tests__/components/ResetButton.test.tsx`; modify `src/components/index.ts`
- **Details**: Button labeled "Скинути". On click calls `window.confirm()`, dispatches `{ type: 'RESET' }` only if confirmed. `aria-label="Скинути до початкових значень"`. 44x44px touch target.
- **Tests**: ~6-8 (renders button, calls confirm, dispatches on OK, no-op on cancel, accessible label, keyboard-activatable)
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes

### Step 3 -- Create DashboardHeader component
- **Files**: create `src/components/DashboardHeader.tsx`, `src/__tests__/components/DashboardHeader.test.tsx`; modify `src/components/index.ts`
- **Details**: Horizontal flex row: app title, population numeric input, ModeToggle, ResetButton. Population input: local string state pattern, dispatches `SET_TOTAL_POPULATION` on blur/Enter, reverts on invalid. `aria-label="Загальна кількість зайнятих"`.
- **Tests**: ~10-12 (title, population input, dispatch on valid input, revert on invalid, ModeToggle and ResetButton present, accessible labels)
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes

### Step 4 -- Refactor TreePanel for single-gender rendering + deviation warnings
- **Files**: modify `src/components/TreePanel.tsx`, `src/__tests__/components/TreePanel.test.tsx`, `src/components/TreeRow.tsx`, `src/__tests__/components/TreeRow.test.tsx`
- **Details**: TreePanel now receives `genderNode: TreeNode` (single gender) instead of `tree: TreeNode` (root). Renders gender heading, industry rows, and inline deviation warning when `balanceMode === 'free'` and `getSiblingDeviation(genderNode) !== 0`. TreeRow also renders deviation warning for expanded nodes with children in free mode.
- **Tests**: Update ~14 existing TreePanel tests for new API; add ~4 deviation warning tests. Add ~3-4 TreeRow deviation tests.
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes; all existing behavior preserved

### Step 5 -- Create GenderSection component (tree + pie chart)
- **Files**: create `src/components/GenderSection.tsx`, `src/__tests__/components/GenderSection.test.tsx`; modify `src/components/index.ts`
- **Details**: Side-by-side flex/grid layout. Left: TreePanel (single gender). Right: PieChartPanel with `INDUSTRY_COLORS`, standard size, `ariaLabel="Розподіл галузей -- {genderNode.label}"`.
- **Tests**: ~6-8 (renders TreePanel, renders PieChartPanel with correct props/aria, layout structure)
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes

### Step 6 -- Add mini IT subcategory pie charts to TreeRow
- **Files**: modify `src/components/TreeRow.tsx`, `src/__tests__/components/TreeRow.test.tsx`
- **Details**: When `isExpanded && node.children.length > 0`, render mini PieChartPanel below children. Color map via `generateSubcategoryColors(INDUSTRY_COLORS[node.kvedCode], node.children.length)`. Size: `'mini'`. `ariaLabel="Розподіл підкатегорій -- {node.label}"`. Indented to child depth.
- **Tests**: ~4-6 (mini chart on expanded node, no chart when collapsed, no chart on leaf, correct aria label)
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes

### Step 7 -- Compose dashboard layout in App.tsx
- **Files**: modify `src/App.tsx`
- **Details**: Rewrite render: `DashboardHeader` (sticky top), `<main>` with `grid lg:grid-cols-2 gap-6` containing 2 `GenderSection` components. Wire `useTreeState()` state/dispatch to all children. Male: `state.tree.children[0]`, Female: `state.tree.children[1]`.
- **Verification**: `pnpm build` succeeds; `pnpm lint` passes; visual verification in browser

### Step 8 -- Final verification
- **Files**: verify `src/components/index.ts` has all exports
- **Verification**: `pnpm lint` passes, `pnpm test` passes (all tests including new), `pnpm build` passes
- **Complexity**: 8 steps, estimated 2-3 days, risk level Medium
- **Decomposition**: Recommended -- 8 steps with medium-risk refactor step

---

## Implementation Log (DEV)

_To be filled during implementation._

---

## QA Notes (QA)

_To be filled by QA agent._
