# Technical Design: task-008

Generated: 2026-02-17

## Overview

This task composes all existing building-block components (TreePanel, PieChartPanel, Slider, TreeRow, ChartTooltip, ChartLegend) into a functional dashboard layout with three new lightweight components (ModeToggle, ResetButton, DashboardHeader) and a redesigned App.tsx. The layout uses CSS flexbox/grid for a desktop-only (>=1024px) two-column gender section arrangement with per-section pie charts, a sticky header bar with population input and mode/reset controls, and inline free-mode deviation warnings integrated into TreePanel.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/src/components/`, `apps/labor-market-dashboard/src/App.tsx`
- **New modules/entities to create**:
  - `src/components/ModeToggle.tsx` -- toggle switch for auto/free balance mode
  - `src/components/ResetButton.tsx` -- reset button with browser confirm()
  - `src/components/DashboardHeader.tsx` -- header bar composing title, population input, ModeToggle, ResetButton
  - `src/components/GenderSection.tsx` -- container for one gender's TreePanel + PieChartPanel side-by-side
  - `src/__tests__/components/ModeToggle.test.tsx`
  - `src/__tests__/components/ResetButton.test.tsx`
  - `src/__tests__/components/DashboardHeader.test.tsx`
  - `src/__tests__/components/GenderSection.test.tsx`
- **DB schema change required?** No
- **Architectural considerations**:
  - App.tsx is the composition root: wires `useTreeState()` and distributes state/dispatch to children. Must stay under 200 lines.
  - DashboardHeader is a flat component -- no nesting beyond composing ModeToggle and ResetButton inline.
  - GenderSection wraps TreePanel (for a single gender node) and PieChartPanel side-by-side. This is needed because the current TreePanel renders ALL gender sections internally -- we need to either (a) split TreePanel to render per-gender or (b) create a GenderSection wrapper that pairs a gender's data with its pie chart. Option (a) is cleaner: App.tsx iterates over `state.tree.children` (gender nodes) and renders a GenderSection for each.
  - TreePanel needs a minor refactor: instead of rendering root header + all gender sections, the root header moves to App.tsx/DashboardHeader, and TreePanel renders industries for a SINGLE gender node. This simplifies TreePanel and makes it reusable per gender section.
  - Free-mode deviation warnings belong in the tree hierarchy (TreePanel or TreeRow level) since they are per-sibling-group inline indicators. Add warning rendering to TreePanel (gender-level deviation) and TreeRow (subcategory-level deviation for expanded industries).
  - Population input follows the same controlled input pattern as Slider: local string state, useEffect sync from props, commit on blur/Enter.
  - Mini pie charts for IT subcategories appear when an IT node is expanded. TreeRow already knows if a node is expanded and has children -- it can conditionally render a PieChartPanel inline.
  - All new components follow the barrel export pattern in `components/index.ts`.
- **Known risks or trade-offs**:
  - **TreePanel refactor (Medium)**: Changing TreePanel from "renders everything" to "renders one gender's industries" is a breaking change for existing TreePanel tests. Mitigation: Update tests in the same step.
  - **Component count (Low)**: Adding 4 new components plus modifying 3 existing ones is moderate scope. Each new component is small (<100 lines).
  - **PieChartPanel reuse (Low)**: PieChartPanel already accepts all needed props. No changes required to PieChartPanel itself.
  - **200-line limit (Low)**: App.tsx as composition root may approach the limit. Mitigated by extracting GenderSection as a separate component.
- **Test plan**: Unit tests for all new components (ModeToggle, ResetButton, DashboardHeader, GenderSection). Updated tests for refactored TreePanel. No integration tests needed -- components are tested in isolation with mock dispatch.

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Split TreePanel to render single gender | TreePanel currently renders root header + all genders. Splitting lets us pair each gender's tree with its pie chart in a GenderSection wrapper. | Keep TreePanel as-is and hack pie charts around it (messier, violates single responsibility) |
| New GenderSection component | Encapsulates the side-by-side layout of tree + pie chart per gender. Keeps App.tsx lean. | Inline all layout in App.tsx (exceeds 200-line limit, hard to test) |
| DashboardHeader as flat composition | Title + population input + ModeToggle + ResetButton in one flex row. Simple, no deep nesting. | SummaryBar with derived stats (rejected by PO -- minimal only) |
| Population input with local string state | Same pattern as Slider numeric input. Allows partial typing (e.g., "13" before "13500000"). | Controlled number input only (blocks partial typing, poor UX) |
| Inline deviation warnings in tree | Warnings appear next to the group they describe, using existing `getSiblingDeviation()`. | Global warning banner (disconnected from context), tooltip warnings (less visible) |
| Subcategory mini pie charts in TreeRow | TreeRow already tracks expansion state. When expanded and node has children, render a mini PieChartPanel below the children. | Separate component outside TreeRow (harder to coordinate with expand/collapse) |
| Move root header to DashboardHeader | Root label ("Зайняте населення") and total population display merge with the header bar controls. Avoids duplicate information. | Keep root header in TreePanel and repeat info in header bar |

## Implementation Steps

### Step 1 -- Create ModeToggle component

Create a toggle switch for auto/free balance mode. Controlled component: receives `balanceMode` and `dispatch` as props.

- **Files to create**:
  - `apps/labor-market-dashboard/src/components/ModeToggle.tsx`
  - `apps/labor-market-dashboard/src/__tests__/components/ModeToggle.test.tsx`
- **Files to modify**:
  - `apps/labor-market-dashboard/src/components/index.ts` (add barrel export)
- **Component spec**:
  - Props: `balanceMode: BalanceMode`, `dispatch: React.Dispatch<TreeAction>`
  - Renders a button/toggle with labels "Авто" / "Вільний" (or "Auto" / "Free")
  - On click, dispatches `{ type: 'SET_BALANCE_MODE', mode: <opposite> }`
  - Visual indicator of active mode (e.g., highlighted segment)
  - `aria-label` and `role="switch"` or `aria-pressed` for screen readers
  - 44x44px minimum touch target
- **Tests** (~8-10):
  - Renders correct mode label for auto and free
  - Dispatches SET_BALANCE_MODE with 'free' when in auto mode
  - Dispatches SET_BALANCE_MODE with 'auto' when in free mode
  - Has accessible name and role
  - Touch target meets 44px minimum
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes; component renders in isolation.

### Step 2 -- Create ResetButton component

Create a reset button with browser `confirm()` dialog guard.

- **Files to create**:
  - `apps/labor-market-dashboard/src/components/ResetButton.tsx`
  - `apps/labor-market-dashboard/src/__tests__/components/ResetButton.test.tsx`
- **Files to modify**:
  - `apps/labor-market-dashboard/src/components/index.ts` (add barrel export)
- **Component spec**:
  - Props: `dispatch: React.Dispatch<TreeAction>`
  - Renders a button labeled "Скинути" or with a reset icon
  - On click, calls `window.confirm(...)`. If confirmed, dispatches `{ type: 'RESET' }`. If cancelled, no-op.
  - `aria-label="Скинути до початкових значень"` (or similar descriptive label)
  - 44x44px minimum touch target
- **Tests** (~6-8):
  - Renders the button
  - Calls `window.confirm` on click
  - Dispatches RESET when confirmed
  - Does NOT dispatch when cancelled
  - Has accessible label
  - Button is focusable and keyboard-activatable
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes.

### Step 3 -- Create DashboardHeader component

Create the header bar composing title, population input, ModeToggle, and ResetButton.

- **Files to create**:
  - `apps/labor-market-dashboard/src/components/DashboardHeader.tsx`
  - `apps/labor-market-dashboard/src/__tests__/components/DashboardHeader.test.tsx`
- **Files to modify**:
  - `apps/labor-market-dashboard/src/components/index.ts` (add barrel export)
- **Component spec**:
  - Props: `totalPopulation: number`, `balanceMode: BalanceMode`, `dispatch: React.Dispatch<TreeAction>`
  - Layout: horizontal flex row with:
    - Application title (text, not `<h1>` -- heading hierarchy will be managed at page level)
    - Population numeric input: local string state pattern (like Slider). On blur/Enter, parses number, dispatches `SET_TOTAL_POPULATION` if valid. Reverts if invalid. `aria-label="Загальна кількість зайнятих"`.
    - `<ModeToggle>` with current mode and dispatch
    - `<ResetButton>` with dispatch
  - Background: white with bottom border or shadow for header separation
  - All interactive elements >= 44px touch targets
- **Tests** (~10-12):
  - Renders title text
  - Renders population input with formatted default value
  - Dispatches SET_TOTAL_POPULATION on valid input commit
  - Reverts input on invalid (non-numeric) input
  - Renders ModeToggle (test via its aria attributes)
  - Renders ResetButton (test via its accessible name)
  - Population input has accessible label
  - Layout renders without errors
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes.

### Step 4 -- Refactor TreePanel for single-gender rendering + add deviation warnings

Refactor TreePanel to render industries for a single gender node (instead of root + all genders). Move root header logic to DashboardHeader. Add inline free-mode deviation warnings.

- **Files to modify**:
  - `apps/labor-market-dashboard/src/components/TreePanel.tsx` (major refactor)
  - `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx` (update tests for new API)
- **TreePanel refactored API**:
  - Props: `genderNode: TreeNode` (single gender node), `balanceMode: BalanceMode`, `dispatch: React.Dispatch<TreeAction>`
  - Removed: `tree` prop (no longer needs root)
  - Renders: gender heading (`<h2>`), percentage + absolute value display, deviation warning (if free mode and deviation != 0), then industry TreeRow list
  - Deviation warning: uses `getSiblingDeviation(genderNode)` to compute deviation. If `balanceMode === 'free'` and deviation !== 0, renders inline warning text like "Сума: 95.0% (-5.0%)" or "Сума: 108.3% (+8.3%)"
  - `collectExpandableIds` now walks a single gender node's children (not the full tree)
- **TreeRow update for subcategory deviation warnings**:
  - When a node is expanded and has children and `balanceMode === 'free'`, compute `getSiblingDeviation(node)`. If != 0, show inline warning below the children.
  - This handles IT subcategory deviation warnings.
- **Files to modify (additionally)**:
  - `apps/labor-market-dashboard/src/components/TreeRow.tsx` (add deviation warning rendering for expanded nodes with children)
  - `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx` (add tests for deviation warning)
- **Tests to update/add**:
  - TreePanel: update all existing tests for new single-gender API (~14 tests adapted)
  - TreePanel: add deviation warning tests (renders when free mode + deviation, hidden in auto mode) (~4 new tests)
  - TreeRow: add deviation warning tests (~3-4 new tests)
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes; all existing behavior preserved under new API.

### Step 5 -- Create GenderSection component (tree + pie chart side-by-side)

Create a container component that pairs a gender's TreePanel with its industry PieChartPanel.

- **Files to create**:
  - `apps/labor-market-dashboard/src/components/GenderSection.tsx`
  - `apps/labor-market-dashboard/src/__tests__/components/GenderSection.test.tsx`
- **Files to modify**:
  - `apps/labor-market-dashboard/src/components/index.ts` (add barrel export)
- **Component spec**:
  - Props: `genderNode: TreeNode`, `balanceMode: BalanceMode`, `dispatch: React.Dispatch<TreeAction>`
  - Layout: side-by-side flex or grid. Left: TreePanel (for this gender). Right: PieChartPanel (industry distribution).
  - Industry pie chart: uses `INDUSTRY_COLORS` from `data/chartColors.ts`, `ariaLabel` like "Розподіл галузей -- Чоловіки"
  - Passes `genderNode.children` as `nodes` to PieChartPanel
  - Standard size pie chart
- **Note on mini IT subcategory charts**: These are handled in TreeRow (step 6), not in GenderSection.
- **Tests** (~6-8):
  - Renders TreePanel for the gender node
  - Renders PieChartPanel with correct aria label
  - Pie chart receives gender node's children as nodes
  - Layout renders both side-by-side
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes.

### Step 6 -- Add mini IT subcategory pie charts to TreeRow

When an industry node with children is expanded, render a mini PieChartPanel showing the subcategory distribution below the children.

- **Files to modify**:
  - `apps/labor-market-dashboard/src/components/TreeRow.tsx` (add conditional mini pie chart)
  - `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx` (add tests for mini pie chart)
- **Implementation**:
  - After rendering expanded children, if `node.children.length > 0` and `isExpanded`, render a mini PieChartPanel.
  - Color map: generate via `generateSubcategoryColors()` from `utils/chartDataUtils.ts`. Base color comes from `INDUSTRY_COLORS[node.kvedCode]` (or `DEFAULT_NODE_COLOR` fallback). Map each child node ID to a generated color.
  - Size: `'mini'` variant
  - `ariaLabel`: `"Розподіл підкатегорій -- {node.label}"`
  - Indented to match child depth (`paddingLeft: ${(depth + 1) * 24}px`)
- **Tests** (~4-6):
  - Renders mini PieChartPanel when node is expanded and has children
  - Does NOT render mini chart when node is collapsed
  - Does NOT render mini chart on leaf nodes
  - Mini chart has correct aria label
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` passes.

### Step 7 -- Compose dashboard layout in App.tsx

Wire all components together in App.tsx as the composition root.

- **Files to modify**:
  - `apps/labor-market-dashboard/src/App.tsx` (complete rewrite of render tree)
- **Layout structure**:
  ```
  <div className="min-h-screen bg-slate-50">
    <DashboardHeader ... />            (sticky top bar)
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenderSection genderNode={maleNode} ... />
        <GenderSection genderNode={femaleNode} ... />
      </div>
    </main>
  </div>
  ```
- **State wiring**:
  - `useTreeState()` provides `state` and `dispatch`
  - Male node: `state.tree.children[0]` (or find by id `gender-male`)
  - Female node: `state.tree.children[1]` (or find by id `gender-female`)
  - Pass `state.totalPopulation`, `state.balanceMode`, and `dispatch` to DashboardHeader
  - Pass `genderNode`, `state.balanceMode`, and `dispatch` to each GenderSection
- **No new test file for App.tsx**: App.tsx is a thin composition root. Its behavior is covered by the component tests. If needed, a smoke test can be added later.
- **Verification**: `pnpm build --filter @template/labor-market-dashboard` succeeds; `pnpm lint --filter @template/labor-market-dashboard` passes; visual inspection in browser via `pnpm dev`.

### Step 8 -- Update barrel exports and run full verification

Ensure all new components are properly exported and all tests pass.

- **Files to modify**:
  - `apps/labor-market-dashboard/src/components/index.ts` (verify all exports)
- **Verification**:
  - `pnpm lint` passes (no lint errors across monorepo)
  - `pnpm test` passes (all tests, including new ones)
  - `pnpm build` passes (no type errors, successful bundle)
  - Manual: open in browser at localhost:5173, verify header bar controls, two gender sections with pie charts, mode toggle, reset, and free-mode warnings

## Complexity Assessment

- **Estimated effort**: 2-3 days
- **Risk level**: Medium
  - The TreePanel refactor (step 4) is the most complex step: changes the API contract, requires updating all 14+ existing tests, and adds deviation warning logic.
  - Other steps are straightforward new component creation following established patterns.
- **Dependencies**: Tasks 2-7 (all complete). No external dependencies.
- **Step count**: 8 steps
- **Decomposition recommendation**: Yes -- 8 steps with a medium-complexity refactor step (step 4) meets the decomposition criteria (steps >= 5). Suggest decomposing into subtasks along step boundaries.

## Decomposition Recommendation

Given 8 implementation steps and the medium-risk TreePanel refactor, this task should be decomposed into subtasks. Suggested grouping:

| Subtask | Steps | Description |
|---------|-------|-------------|
| 8.1 | 1, 2 | Create ModeToggle and ResetButton (new leaf components, no dependencies on refactor) |
| 8.2 | 3 | Create DashboardHeader (composes ModeToggle + ResetButton + population input) |
| 8.3 | 4 | Refactor TreePanel for single-gender + deviation warnings (breaking change, test updates) |
| 8.4 | 5, 6 | Create GenderSection + add mini subcategory pie charts to TreeRow |
| 8.5 | 7, 8 | Compose layout in App.tsx + final verification |

## Test Strategy

- **Unit tests**: All 4 new components (ModeToggle, ResetButton, DashboardHeader, GenderSection) get dedicated test files following existing patterns:
  - `makeProps()` factory with `Partial<Props>` overrides
  - `vi.fn()` for dispatch mock
  - `afterEach(cleanup)`
  - `userEvent.setup()` for interactions
  - jsdom environment + ResizeObserver mock (for GenderSection and TreeRow tests that render PieChartPanel)
- **Updated tests**: TreePanel tests adapted for new single-gender API. TreeRow tests extended for deviation warnings and mini pie charts.
- **No integration tests needed**: Components are tested in isolation. App.tsx is a thin composition root.
- **Test file extensions**: `.tsx` for component tests with JSX, following existing convention.

## Open Technical Questions

No new technical questions discovered. All PO open questions were resolved. The design uses only established patterns and existing utilities.
