# Technical Design: task-007

Generated: 2026-02-17

## Overview

Build a hierarchical tree panel component (`TreePanel` + `TreeRow`) that renders the 55-node labor market tree with expand/collapse behavior, integrated sliders, and visual indentation. The tree panel is a single component rendering root -> gender (always expanded, non-collapsible) -> industries (expanded on load) -> subcategories (only IT/KVED J has children). Each tree row embeds the existing `Slider` component and passes the correct node data plus dispatch. Expand/collapse state is managed locally via `useState<Set<string>>` since it is purely UI state with no business logic implications.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/src/components/`, `apps/labor-market-dashboard/src/App.tsx`
- **New modules/entities to create**:
  - `src/components/TreePanel.tsx` -- container component, manages expand/collapse state, renders root node header + gender sections
  - `src/components/TreeRow.tsx` -- recursive row component, renders a single node with indentation + chevron + slider, recurses for children
- **DB schema change required?** No
- **Architectural considerations**:
  - **Component split**: TreePanel (~container, expand state, root header) + TreeRow (recursive, per-node rendering with Slider integration). This keeps each file under 200 lines per CLAUDE.md constraint.
  - **Expand/collapse state**: Local `useState<Set<string>>` in TreePanel, not in the reducer. This is UI-only state (which nodes are visually expanded) -- it has no effect on data or calculations. Passed down as props + toggle callback.
  - **Gender nodes are always expanded**: Per Q1 resolution, gender nodes (Level 1) are rendered as section headers with no collapse toggle. Their children are always visible.
  - **Initial expand state**: Per Q2 resolution, industries start expanded. The initial `expandedIds` set contains all industry node IDs that have children (only `male-j` and `female-j` in current data).
  - **Controlled pattern**: TreeRow receives `TreeNode`, `dispatch`, `balanceMode`, `expandedIds`, `onToggleExpand` as props. No internal data state.
  - **React.memo on TreeRow**: Follows PieChartPanel pattern. Prevents re-renders when parent re-renders but node data unchanged. Important during slider interactions where many siblings re-render.
  - **canToggleLock computation**: TreeRow needs the sibling array from the parent to compute `canLock` for the Slider. TreePanel/TreeRow passes the parent's `children` array as a `siblings` prop.
  - **Indentation**: CSS `padding-left` based on depth. Level 0 (root): special header. Level 1 (gender): `pl-0` (section header). Level 2 (industry): `pl-6` (24px). Level 3 (subcategory): `pl-12` (48px). Exact values tuned in Tailwind classes.
  - **Chevron icons**: Inline SVG (same pattern as Slider lock icons). Right-pointing `>` when collapsed, down-pointing `v` when expanded. Only rendered for nodes with `children.length > 0`.
  - **Touch targets**: Chevron toggle button uses `h-11 w-11` (44x44px) per WCAG 2.5.5, same pattern as Slider lock button.
  - **Keyboard accessibility**: Toggle button is a `<button>` element, so Enter/Space work natively. `aria-expanded` attribute on the button communicates state to screen readers.
- **Known risks or trade-offs**:
  - **Low risk**: TreeRow is recursive but max depth is 3 -- no stack overflow concern for 55 nodes.
  - **Low risk**: Expand/collapse state is local to TreePanel. If the tree resets (RESET action), expanded state persists (collapsed industries stay collapsed). This is intentional -- RESET changes data, not UI state. If undesirable, a `useEffect` could sync on tree identity.
  - **Low risk**: React.memo shallow comparison. `dispatch` is stable (from useReducer), but `onToggleExpand` callback would be recreated each render. Must use `useCallback` for the toggle handler in TreePanel to preserve memo effectiveness.
- **Test plan**: Unit tests for TreePanel and TreeRow using React Testing Library. Tests focus on rendering (correct labels, values, indentation), expand/collapse behavior (click toggles children visibility), slider integration (correct props passed), accessibility (aria-expanded, aria-label), and edge cases (leaf nodes without chevron, gender nodes without collapse control).

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Two components (TreePanel + TreeRow) | Keeps each under 200 lines; separates container concerns (expand state) from recursive rendering | Single TreePanel with internal recursion (would exceed 200 lines) |
| Local `useState<Set<string>>` for expand state | Expand/collapse is pure UI state with no business implications; no reason to add it to the reducer | Add to DashboardState/TreeAction (overcomplicates reducer, couples UI layout to data model) |
| TreeRow receives `siblings` prop for canToggleLock | canToggleLock needs the sibling array from parent; cleanest to pass as prop from the recursive parent | Traverse tree in TreeRow to find parent (wasteful DFS per row) |
| `useCallback` on toggle handler | Required for React.memo on TreeRow to be effective; dispatch is already stable from useReducer | Skip useCallback (memo would be ineffective, re-render on every parent update) |
| Depth prop passed numerically | Simple integer `depth` prop drives indentation CSS and decides rendering variant (root header vs gender section vs node row) | CSS-only nesting via child selectors (harder to control, less explicit) |
| Gender nodes as section headers, not collapsible | Per PO Q1 resolution; matches PRD wireframe | Make them collapsible like industries (rejected by PO) |
| Initialize expanded with IT nodes | Per PO Q2, industries are visible. Only IT nodes (`male-j`, `female-j`) have children, so only they need expand state. Industry leaf nodes have no expand toggle. | Start fully collapsed (rejected by PO) |
| Inline SVG chevrons | Consistent with Slider lock icons pattern; no icon library dependency | Icon library like react-icons (adds dependency), Unicode characters (inconsistent rendering) |

## Implementation Steps

### Step 1 -- Create TreeRow component

Create the recursive tree row component that renders a single node with optional expand/collapse chevron, indentation, and an embedded Slider.

- **Files**: Create `apps/labor-market-dashboard/src/components/TreeRow.tsx`
- **Details**:
  - Props interface `TreeRowProps`: `node: TreeNode`, `siblings: TreeNode[]`, `depth: number`, `balanceMode: BalanceMode`, `dispatch: React.Dispatch<TreeAction>`, `expandedIds: ReadonlySet<string>`, `onToggleExpand: (id: string) => void`
  - Compute `canLock` via `canToggleLock(node.id, siblings)` from `@/utils/calculations`
  - Compute `hasChildren = node.children.length > 0`
  - Compute `isExpanded = expandedIds.has(node.id)`
  - Indentation: `depth * 24` pixels via inline style `paddingLeft`
  - Chevron button: only if `hasChildren`, `aria-expanded={isExpanded}`, `aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}`, `h-11 w-11` touch target
  - Embed `<Slider>` with all props from node data + computed canLock
  - If `isExpanded && hasChildren`, recursively render children as `<TreeRow>` with `depth + 1`, passing `node.children` as the `siblings` prop for child rows
  - Wrap in `React.memo` using named function pattern: `export const TreeRow = memo(function TreeRow(...))`
  - Export `TreeRowProps` as named type export
- **Verification**: File exists, exports `TreeRow` and `TreeRowProps`, under 200 lines

### Step 2 -- Create TreePanel component

Create the container component that manages expand/collapse state and renders the full tree structure.

- **Files**: Create `apps/labor-market-dashboard/src/components/TreePanel.tsx`
- **Details**:
  - Props interface `TreePanelProps`: `tree: TreeNode`, `balanceMode: BalanceMode`, `dispatch: React.Dispatch<TreeAction>`
  - `useState<Set<string>>` for `expandedIds`, initialized with IDs of nodes that have children (computed once from tree on mount via lazy initializer: walk tree to find all nodes with `children.length > 0`)
  - `useCallback` for `handleToggleExpand(id: string)`: creates new Set with id added/removed
  - Render structure:
    1. Root header section: `<div>` with root label (`tree.label`) and formatted absolute value (`formatAbsoluteValue(tree.absoluteValue)`)
    2. For each gender node (`tree.children`): render a gender section header (`<h2>` or `<div>` with label, percentage, absolute value) -- NOT collapsible (per Q1)
    3. For each gender child (industry): render `<TreeRow node={industry} siblings={gender.children} depth={2} ...>`
  - No expand/collapse control on gender nodes (always expanded)
  - Export as named function (not memo -- TreePanel is a top-level container that re-renders with state)
  - Export `TreePanelProps` as named type export
- **Verification**: File exists, exports `TreePanel` and `TreePanelProps`, under 200 lines

### Step 3 -- Update barrel exports

Add TreePanel and TreeRow to the components barrel file.

- **Files**: Modify `apps/labor-market-dashboard/src/components/index.ts`
- **Details**:
  - Add `export { TreePanel } from './TreePanel';` and `export type { TreePanelProps } from './TreePanel';`
  - Add `export { TreeRow } from './TreeRow';` and `export type { TreeRowProps } from './TreeRow';`
  - Maintain alphabetical order
- **Verification**: Barrel file exports all 6 components (ChartLegend, ChartTooltip, PieChartPanel, Slider, TreePanel, TreeRow) with type exports

### Step 4 -- Integrate TreePanel into App.tsx

Wire up the TreePanel in the main App component using the existing `useTreeState` hook.

- **Files**: Modify `apps/labor-market-dashboard/src/App.tsx`
- **Details**:
  - Import `useTreeState` from `@/hooks`
  - Import `TreePanel` from `@/components`
  - Call `const { state, dispatch } = useTreeState()` in App
  - Render `<TreePanel tree={state.tree} balanceMode={state.balanceMode} dispatch={dispatch} />`
  - Keep basic layout wrapper (bg-slate-50, centered, etc.)
  - Convert `App` from default export to named export (per project convention -- "Named exports only, no default exports, exception: legacy App.tsx"). Since we are modifying App.tsx, align it with the convention now.
- **Verification**: App renders TreePanel with live data; `pnpm dev` shows the tree panel with sliders

### Step 5 -- Write TreeRow unit tests

Create comprehensive tests for the TreeRow component.

- **Files**: Create `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx`
- **Details**:
  - Follow `Slider.test.tsx` pattern: `makeProps()` factory, `afterEach(cleanup)`, `vi.fn()` for dispatch
  - Test categories:
    - **Rendering**: Displays label, percentage, absolute value via embedded Slider
    - **Chevron**: Shows chevron for nodes with children, hides for leaf nodes
    - **Expand/collapse**: Clicking chevron calls `onToggleExpand` with node ID
    - **Children visibility**: When expanded, children render; when collapsed, children do not render
    - **Indentation**: Verify padding-left scales with depth
    - **Slider integration**: Slider receives correct props (nodeId, label, percentage, absoluteValue, isLocked, canLock, balanceMode, dispatch)
    - **Accessibility**: `aria-expanded` attribute on chevron button, `aria-label` on chevron button
    - **Locked state**: Locked node renders with Slider in locked state
    - **canLock computation**: When only 1 unlocked sibling, canLock is false
  - Use `.ts` extension only if no JSX; this file has JSX so use `.tsx`
  - Target: ~15-20 tests
- **Verification**: `pnpm test` passes with all TreeRow tests green

### Step 6 -- Write TreePanel unit tests

Create tests for the TreePanel container component.

- **Files**: Create `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx`
- **Details**:
  - Follow `PieChartPanel.test.tsx` pattern: factory for props, `afterEach(cleanup)`
  - Create a minimal test tree (root + 2 gender + 2 industries per gender + 2 subcategories under one industry) -- do NOT use the full 55-node `defaultTree` in tests
  - Test categories:
    - **Root display**: Root label and absolute value are visible
    - **Gender sections**: Both gender nodes visible as section headers
    - **Industry nodes**: All industry children of each gender visible on initial render (per Q2: start expanded)
    - **Gender not collapsible**: No collapse control on gender nodes
    - **Expand/collapse integration**: Click chevron on expandable industry -> subcategories appear; click again -> subcategories disappear
    - **Expanded state persistence**: Collapse parent gender... wait, gender is not collapsible (Q1). Instead: collapse an expanded industry -> children hide -> expand again -> children show.
    - **Accessibility**: Section headers have correct structure
  - Target: ~10-12 tests
- **Verification**: `pnpm test` passes with all TreePanel tests green

### Step 7 -- Verification: lint, test, build

Run the full verification suite to ensure nothing is broken.

- **Files**: No file changes
- **Details**:
  - Run `pnpm lint` -- all files pass ESLint
  - Run `pnpm test` -- all tests pass (existing + new TreeRow + TreePanel tests)
  - Run `pnpm build` -- successful build with no TypeScript errors
  - Record results
- **Verification**: All three commands exit with code 0

## Complexity Assessment

- **Estimated effort**: 1.5 days
  - Step 1 (TreeRow): 3-4 hours -- recursive component with Slider integration, memo, accessibility
  - Step 2 (TreePanel): 2-3 hours -- container with expand state, gender sections, root header
  - Step 3 (barrel): 10 minutes
  - Step 4 (App.tsx): 20 minutes
  - Step 5 (TreeRow tests): 3-4 hours -- 15-20 tests covering rendering, interaction, accessibility
  - Step 6 (TreePanel tests): 2-3 hours -- 10-12 tests with test tree fixture
  - Step 7 (verification): 15 minutes
- **Risk level**: Low
  - All patterns established by Slider and PieChartPanel
  - No new dependencies
  - No state management changes
  - Recursive rendering is standard React pattern
  - Max tree depth is 3 (trivial for recursion)
- **Dependencies**:
  - Task 5 (Slider component) -- completed
  - Task 4 (useTreeState hook) -- completed
  - Task 3 (defaultTree data) -- completed
  - Task 2 (TreeNode type) -- completed

## Test Strategy

- **Unit tests (TreeRow)**: ~15-20 tests
  - Rendering: label, percentage, absolute value displayed via Slider
  - Chevron: present/absent based on children, correct orientation (aria-expanded)
  - Expand/collapse: onToggleExpand callback called with correct ID
  - Children rendering: conditional on expandedIds
  - Indentation: padding-left corresponds to depth
  - Slider props: all 8 props passed correctly from node data
  - canLock guard: computed from siblings array
  - Accessibility: aria-expanded, aria-label on toggle button
  - Locked node: Slider rendered in locked state

- **Unit tests (TreePanel)**: ~10-12 tests
  - Root display: label and formatted absolute value
  - Gender sections: both visible, non-collapsible
  - Industry nodes: visible on initial load (expanded default)
  - Expand/collapse: click toggles subcategory visibility
  - No chevron on leaf nodes or gender nodes
  - Integration with Slider component (correct dispatch passed)
  - Accessibility: appropriate heading/section structure

- **Integration tests**: Not required -- TreePanel + TreeRow + Slider integration is covered by unit tests with real Slider rendering (not mocked).

- **E2E tests**: Not required for this task.

## Open Technical Questions

None. All questions were resolved during PO analysis (Q1-Q4). No new technical questions discovered during design. The implementation follows established patterns exactly.
