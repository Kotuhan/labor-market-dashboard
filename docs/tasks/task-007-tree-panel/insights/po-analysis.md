# PO Analysis: task-007

Generated: 2026-02-17

## Problem Statement

The dashboard currently has individual components (Slider, PieChartPanel) and state management (useTreeState), but no hierarchical UI that organizes the data tree for the user. Without a tree panel, users cannot navigate the labor market structure -- they cannot see which industries belong to which gender group, expand an industry to see subcategories, or understand the parent-child relationship between nodes.

**From the user's perspective**: "I want to explore Ukraine's labor market by expanding gender groups to see industries, and expanding industries (like IT) to see subcategories. I need clear visual hierarchy so I know what level I am at, and I want sliders right next to each category so I can adjust values in context."

**Why now**: Tasks 2-6 have built all the foundational layers (data model, default data, state management, sliders, charts). The tree panel is the primary navigation and interaction surface that ties everything together. Without it, no other UI assembly task can proceed -- the tree panel is the structural backbone of the dashboard layout described in PRD Section 9.

**If we do nothing**: The dashboard remains a placeholder `<App>` with no usable interface. All completed work (55-node tree, auto-balance reducer, slider component, pie charts) sits idle with no way for users to interact with it.

## Success Criteria

1. User can see the full tree hierarchy (root -> gender -> industries) on initial load, with industries collapsed by default
2. User can expand a gender node to reveal its 16 industry children with associated sliders
3. User can expand an industry that has subcategories (currently only IT/KVED J) to reveal its 10 subcategory children with sliders
4. User can collapse any expanded section to hide its children
5. Visual indentation clearly communicates tree depth (3 distinct levels visible)
6. All expand/collapse interactions complete within 100ms (NFR-01)
7. The tree panel renders efficiently with all 55 nodes without layout jank
8. Touch targets for expand/collapse controls meet the 44x44px minimum (WCAG 2.5.5)
9. Each tree row integrates the existing Slider component, passing the correct node data and dispatch function

## Acceptance Criteria

### Tree Structure Display

* Given the dashboard loads with default data
  When the tree panel renders
  Then the root node "Зайняте населення" is visible with its absolute value (13 500 тис.)

* Given the tree panel is in its initial state
  When the user views the gender level
  Then both "Чоловіки" and "Жінки" nodes are visible with their percentages and absolute values

* Given a gender node (e.g., "Чоловіки") is visible
  When the user views its children
  Then 16 industry nodes are listed in their data order, each showing label, percentage, and absolute value

### Expand / Collapse Behavior

* Given a gender node is collapsed
  When the user clicks the expand control on "Чоловіки"
  Then all 16 industry children appear below it with proper indentation

* Given a gender node is expanded showing its industries
  When the user clicks the collapse control on "Чоловіки"
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
  Then the slider appears in its locked/disabled state (consistent with existing Slider component behavior)

### Visual Hierarchy

* Given nodes at different tree levels are displayed
  When the user views the tree
  Then Level 1 (gender) has no indentation, Level 2 (industry) has one level of indentation, and Level 3 (subcategory) has two levels of indentation

* Given a node can be expanded (has children)
  When it is displayed
  Then an expand/collapse indicator (chevron or similar) is visible, oriented to show current state (collapsed vs. expanded)

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

## Out of Scope

- **Drag-and-drop reordering** of tree nodes -- node order is fixed by data
- **Search/filter** within the tree -- not in PRD v1
- **Adding/removing tree nodes** -- the tree structure is static (defined in defaultTree)
- **Inline editing of labels** -- labels are read-only Ukrainian text from the data layer
- **Mini pie charts within tree rows** -- these are a separate integration concern (FR-04 mentions them but they will be wired in a layout/assembly task)
- **Virtual scrolling / windowing** -- the tree has only 55 nodes total, which does not require virtualization. Standard React rendering is sufficient.
- **Lazy loading of subcategories** -- the TaskMaster description mentioned lazy loading, but with only 20 subcategory nodes (10 per gender, only IT has subcategories), this optimization is unnecessary. All data is already in memory via defaultTree.
- **Animated expand/collapse transitions** -- animation polish is deferred to a later task (PRD M4: "Polish: animations, responsive, a11y"). The tree panel should function correctly without animation first.
- **Responsive mobile layout** (below 1024px) -- NFR-05 is P1, deferred to a layout/assembly task
- **Mode toggle integration** -- ModeToggle is a separate component (PRD Section 9); the tree panel receives balanceMode as a prop but does not render the toggle itself
- **Summary bar / warnings** -- SummaryBar is a separate component

## Open Questions

* **Q1**: Should gender nodes (Level 1) be collapsible, or always expanded? --> **RESOLVED: Always expanded** — gender nodes act as section headers, not collapsible. Matches PRD wireframe.

* **Q2**: Should the tree panel initially render with industries visible or collapsed? --> **RESOLVED: Start expanded** — industries visible immediately on load. Matches PRD wireframe.

* **Q3**: Single tree component or per-gender component? --> **RESOLVED: Single tree component** — one component renders full tree. Simpler data flow, single dispatch context.

* **Q4**: Expand/collapse indicator icon style? --> **RESOLVED: Chevron (> / v)** — right-pointing when collapsed, down-pointing when expanded.

## Recommendations

- The tree panel should be designed as a recursive component that renders a `TreeNode` and its children, making it naturally composable for any depth. This aligns with the recursive TreeNode data model from task-002.
- The existing Slider component exports `SliderProps` with all needed fields (nodeId, label, percentage, absoluteValue, isLocked, canLock, balanceMode, dispatch). The tree panel should render one Slider per visible node, passing these props from the TreeNode data.
- The `canToggleLock` function from `utils/calculations.ts` is needed to compute the `canLock` prop for each Slider -- it requires the sibling array from the parent node.
- Consider using `React.memo` on the tree row component (same pattern as PieChartPanel) since parent re-renders will be frequent during slider interactions.
- The 200-line component limit from CLAUDE.md means the tree panel will likely need to be split into at least two files: a container/panel component and a recursive row/node component.
