---
id: task-007
title: Create Expandable Tree Panel UI
status: backlog
priority: medium
dependencies: [5]
created_at: 2026-02-17
---

# Create Expandable Tree Panel UI

## Problem (PO)

The dashboard has individual components (Slider, PieChartPanel) and state management (useTreeState), but no hierarchical UI that organizes the data tree for the user. Without a tree panel, users cannot navigate the labor market structure -- they cannot see which industries belong to which gender group, expand an industry to see subcategories, or understand the parent-child relationship between nodes.

**User perspective**: "I want to explore Ukraine's labor market by expanding gender groups to see industries, and expanding industries (like IT) to see subcategories. I need clear visual hierarchy so I know what level I am at, and I want sliders right next to each category so I can adjust values in context."

**Why now**: Tasks 2-6 built all foundational layers (data model, default data, state management, sliders, charts). The tree panel is the primary navigation and interaction surface that ties everything together. Without it, no other UI assembly task can proceed.

**If we do nothing**: The dashboard remains a placeholder App with no usable interface. All completed work (55-node tree, auto-balance reducer, slider component, pie charts) sits idle.

## Success Criteria (PO)

1. User can see the full tree hierarchy (root -> gender -> industries) on initial load
2. User can expand a gender node to reveal its 16 industry children with associated sliders
3. User can expand an industry with subcategories (currently only IT/KVED J) to reveal its 10 subcategory children with sliders
4. User can collapse any expanded section to hide its children
5. Visual indentation clearly communicates tree depth (3 distinct levels visible)
6. All expand/collapse interactions complete within 100ms (NFR-01)
7. The tree panel renders efficiently with all 55 nodes without layout jank
8. Touch targets for expand/collapse controls meet 44x44px minimum (WCAG 2.5.5)
9. Each tree row integrates the existing Slider component, passing correct node data and dispatch

## Acceptance Criteria (PO)

### Tree Structure Display

* Given the dashboard loads with default data
  When the tree panel renders
  Then the root node "Зайняте населення" is visible with its absolute value (13 500 тис.)

* Given the tree panel is in its initial state
  When the user views the gender level
  Then both "Чоловіки" and "Жінки" nodes are visible with their percentages and absolute values

* Given a gender node is visible
  When the user views its children
  Then 16 industry nodes are listed in their data order, each showing label, percentage, and absolute value

### Expand / Collapse Behavior

* Given a gender node is collapsed
  When the user clicks the expand control
  Then all 16 industry children appear below it with proper indentation

* Given a gender node is expanded showing its industries
  When the user clicks the collapse control
  Then all industry children (and any expanded subcategories within) are hidden

* Given the IT industry node (KVED J) is visible under a gender
  When the user clicks the expand control on IT
  Then 10 subcategory children appear below IT with deeper indentation

* Given a leaf industry node (e.g., "Торгівля" with no subcategories)
  When the user views it
  Then no expand/collapse control is shown (since children array is empty)

* Given an industry with subcategories is expanded
  When the user collapses the parent gender node
  Then both the industry and its subcategories are hidden
  And when the gender node is re-expanded, the previously expanded industry retains its expanded state

### Slider Integration

* Given an industry node is visible in the tree
  When the user adjusts its slider
  Then a SET_PERCENTAGE action is dispatched with the correct nodeId
  And sibling nodes update via auto-balance (in auto mode)

* Given a subcategory node is visible within an expanded IT industry
  When the user adjusts its slider
  Then only IT subcategory siblings are affected by auto-balance (not industry-level siblings)

* Given a node is locked (isLocked = true)
  When it is displayed in the tree
  Then the slider appears in its locked/disabled state

### Visual Hierarchy

* Given nodes at different tree levels are displayed
  When the user views the tree
  Then Level 1 (gender) has no indentation, Level 2 (industry) has one level of indentation, and Level 3 (subcategory) has two levels of indentation

* Given a node can be expanded (has children)
  When it is displayed
  Then an expand/collapse indicator is visible, oriented to show current state

### Accessibility

* Given the tree panel is rendered
  When a screen reader user navigates it
  Then expand/collapse controls have appropriate aria-label or aria-expanded attributes

* Given expand/collapse controls exist
  When the user uses keyboard navigation
  Then Enter/Space activates the expand/collapse toggle

* Given all interactive elements in the tree
  When measured
  Then each has a minimum touch target of 44x44px

## Out of Scope (PO)

- **Drag-and-drop reordering** of tree nodes -- node order is fixed by data
- **Search/filter** within the tree -- not in PRD v1
- **Adding/removing tree nodes** -- tree structure is static (defaultTree)
- **Inline editing of labels** -- labels are read-only Ukrainian text
- **Mini pie charts within tree rows** -- separate integration concern (wired in a layout/assembly task)
- **Virtual scrolling / windowing** -- 55 nodes does not require virtualization
- **Lazy loading of subcategories** -- only 20 subcategory nodes exist, all already in memory
- **Animated expand/collapse transitions** -- deferred to polish task (PRD M4)
- **Responsive mobile layout** (below 1024px) -- NFR-05 is P1, deferred
- **Mode toggle integration** -- ModeToggle is a separate component; tree panel receives balanceMode as a prop
- **Summary bar / warnings** -- SummaryBar is a separate component

## Open Questions (PO)

* **Q1**: Should gender nodes (Level 1) be collapsible, or always expanded? --> **RESOLVED: Always expanded** — gender nodes act as section headers, not collapsible. Matches PRD wireframe.

* **Q2**: Should the tree panel initially render with industries visible or collapsed? --> **RESOLVED: Start expanded** — industries visible immediately on load. Matches PRD wireframe.

* **Q3**: Single tree component or per-gender component? --> **RESOLVED: Single tree component** — one component renders full tree. Simpler data flow, single dispatch context.

* **Q4**: Expand/collapse indicator icon style? --> **RESOLVED: Chevron (> / v)** — right-pointing when collapsed, down-pointing when expanded.

---

## Technical Notes (TL)

- **Affected modules**: `apps/labor-market-dashboard/src/components/`, `apps/labor-market-dashboard/src/App.tsx`
- **New modules/entities to create**:
  - `src/components/TreePanel.tsx` -- container component, manages expand/collapse state, renders root header + gender sections
  - `src/components/TreeRow.tsx` -- recursive row component, renders a single node with indentation + chevron + embedded Slider
- **DB schema change required?** No
- **Architectural considerations**:
  - Two-component split (TreePanel + TreeRow) keeps each file under 200-line limit
  - Expand/collapse state is local `useState<Set<string>>` in TreePanel (UI-only state, not in reducer)
  - Gender nodes are non-collapsible section headers (Q1 resolution)
  - Industries start expanded on initial load (Q2 resolution)
  - TreeRow is wrapped in `React.memo` (same pattern as PieChartPanel) for performance during slider interactions
  - `useCallback` on toggle handler in TreePanel to preserve memo effectiveness
  - TreeRow receives `siblings` prop from parent to compute `canToggleLock` for Slider
  - Indentation via `paddingLeft` scaled by `depth` prop (24px per level)
  - Chevron icons as inline SVG (consistent with Slider lock icons pattern)
  - Touch targets `h-11 w-11` (44x44px) for WCAG 2.5.5
  - `aria-expanded` on toggle buttons for screen reader accessibility
- **Known risks or trade-offs**:
  - Low: Expand state persists across RESET action (data resets, UI state does not) -- intentional
  - Low: React.memo requires stable `onToggleExpand` callback via `useCallback`
- **Test plan**: Unit tests for TreeRow (~15-20 tests) and TreePanel (~10-12 tests) using React Testing Library, covering rendering, expand/collapse, slider integration, accessibility, and edge cases
- **Estimated effort**: 1.5 days
- **Risk level**: Low -- all patterns established by Slider and PieChartPanel, no new dependencies

## Implementation Steps (TL)

1. **Create TreeRow component** -- Recursive tree row with indentation, chevron toggle, and embedded Slider
   - Files: Create `apps/labor-market-dashboard/src/components/TreeRow.tsx`
   - Props: `node`, `siblings`, `depth`, `balanceMode`, `dispatch`, `expandedIds`, `onToggleExpand`
   - Computes `canLock` via `canToggleLock(node.id, siblings)`; renders chevron only if `node.children.length > 0`
   - `React.memo` wrapped via named function pattern
   - Indentation via `paddingLeft: depth * 24`; chevron button `h-11 w-11` with `aria-expanded`
   - Recursively renders children when expanded
   - Verification: File exists, exports `TreeRow` + `TreeRowProps`, under 200 lines

2. **Create TreePanel component** -- Container managing expand state, rendering root header + gender sections + TreeRow instances
   - Files: Create `apps/labor-market-dashboard/src/components/TreePanel.tsx`
   - Props: `tree`, `balanceMode`, `dispatch`
   - `useState<Set<string>>` initialized with all expandable node IDs (nodes with children)
   - `useCallback` for `handleToggleExpand`
   - Renders: root header (label + absolute value), gender section headers (non-collapsible), TreeRow per industry
   - Verification: File exists, exports `TreePanel` + `TreePanelProps`, under 200 lines

3. **Update barrel exports** -- Add TreePanel and TreeRow to components barrel
   - Files: Modify `apps/labor-market-dashboard/src/components/index.ts`
   - Add value + type exports for both new components
   - Verification: Barrel exports 6 components with type exports

4. **Integrate TreePanel into App.tsx** -- Wire up TreePanel with useTreeState hook
   - Files: Modify `apps/labor-market-dashboard/src/App.tsx`
   - Import `useTreeState`, render `<TreePanel tree={state.tree} balanceMode={state.balanceMode} dispatch={dispatch} />`
   - Convert to named export (align with project convention)
   - Verification: `pnpm dev` shows tree panel with live sliders

5. **Write TreeRow unit tests** -- ~15-20 tests covering rendering, expand/collapse, accessibility
   - Files: Create `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx`
   - Tests: rendering, chevron presence/absence, expand/collapse callback, children visibility, indentation, Slider props, aria-expanded, locked state, canLock guard
   - Verification: `pnpm test` passes with all TreeRow tests green

6. **Write TreePanel unit tests** -- ~10-12 tests covering container behavior
   - Files: Create `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx`
   - Tests: root display, gender sections, industry visibility, expand/collapse integration, no chevron on leaves/gender, accessibility
   - Uses minimal test tree (not full 55-node defaultTree)
   - Verification: `pnpm test` passes with all TreePanel tests green

7. **Verification** -- Run lint, test, build
   - Run `pnpm lint`, `pnpm test`, `pnpm build`
   - All three commands exit with code 0
   - Record results

---

## Implementation Log (DEV)

_To be filled during implementation._

---

## QA Notes (QA)

_To be filled by QA agent._
