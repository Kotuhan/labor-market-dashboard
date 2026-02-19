# Architectural Context: task-011
Generated: 2026-02-18

## Relevant Architecture

### Current Application Structure

The Labor Market Dashboard is a **single-page application with no routing**. The entire app renders through a single composition root (`App.tsx`) that wires `useTreeState()` and distributes state/dispatch to child components. There is currently:

- **No router** -- no `react-router-dom` or any routing library in `package.json`
- **No `base` path** in `vite.config.ts` -- the app assumes root deployment
- **A single entry point** (`main.tsx`) rendering `<App />` in StrictMode
- **A single state tree** managed via `useReducer` in `useTreeState()` -- the hook is called once in `App.tsx` and state is passed down via props

### Composition Root Pattern (App.tsx)

App.tsx is a pure composition root with no business logic:
- Calls `useTreeState()` to get `{ state, dispatch }`
- Renders `DashboardHeader` (sticky) + 2 `GenderSection` instances inside a grid layout
- Gender nodes accessed via `state.tree.children[0]` (male) and `state.tree.children[1]` (female)
- No conditional rendering, no local state, no routing logic

### State Management (useReducer)

Per ADR-0004, state is managed via React `useReducer` with an exported `treeReducer`:
- **5 action types**: `SET_PERCENTAGE`, `TOGGLE_LOCK`, `SET_BALANCE_MODE`, `SET_TOTAL_POPULATION`, `RESET`
- **Single state shape**: `DashboardState` = `{ totalPopulation, balanceMode, tree }`
- State is owned by `App.tsx` and distributed to children via props (no React Context, no global store)
- ADR-0004 explicitly notes: "if the app grows to need cross-component state sharing (e.g., multiple dashboard panels), useReducer would need to be lifted to context or replaced with Zustand"

### Tree Data Model

- `TreeNode` is a recursive interface: `{ id, label, percentage, absoluteValue, genderSplit, children, defaultPercentage, isLocked, kvedCode? }`
- 55 total nodes: 1 root + 2 gender + 32 industry + 20 IT subcategory
- Currently only IT (KVED J) has subcategories (10 per gender); all other industries are leaf nodes
- Node ID scheme: `root`, `gender-male`, `gender-female`, `{gender}-{kved}`, `{gender}-{kved}-{slug}`
- `defaultPercentage` is stored on every node for RESET functionality
- Adding/removing subcategories would require generating new nodes with the correct ID scheme, `genderSplit`, `defaultPercentage`, and then running `largestRemainder()` to normalize sibling percentages

### GitHub Pages Hosting

- The app is deployed to **GitHub Pages** (static hosting)
- Currently no `base` path configured in Vite -- default is `/`
- GitHub Pages can serve from the repo root or a subdirectory -- the deployment path affects how routing works
- `index.html` uses absolute paths for script (`/src/main.tsx`) and favicon (`/vite.svg`)

### Component Boundaries

- **10 components** in `src/components/` with barrel exports
- `TreePanel` receives a single gender node (not the root) and manages expand/collapse UI state locally
- `TreeRow` is recursive, memoized, renders mini subcategory pie charts for expanded nodes with children
- The subcategory management page would need to interact with the same tree data but provide add/remove affordances rather than sliders

## Existing Decisions

### ADR-0001: React 19 + Vite 6 + TypeScript 5.7
- **File**: `architecture/decisions/adr-0001-adopt-react-vite-typescript-frontend-stack.md`
- **Key point**: "App is a client-side SPA with no SSR requirements (GitHub Pages hosting)." Next.js was explicitly rejected because the app has no SSR/SSG requirements. Any routing solution must remain client-side only.

### ADR-0004: React useReducer for State Management
- **File**: `architecture/decisions/adr-0004-use-react-usereducer-for-state-management.md`
- **Key points**:
  - "No cross-component state sharing needed yet (single root component owns all state)"
  - "If the app grows to need cross-component state sharing (e.g., multiple dashboard panels), useReducer would need to be lifted to context or replaced with Zustand"
  - The reducer is exported for direct testing; the hook is a thin wrapper
  - 5 discrete action types in a discriminated union
- **Implication for this task**: Adding a second page that reads/modifies the same tree state is exactly the "cross-component state sharing" scenario ADR-0004 anticipated. The state will need to be accessible from both pages. Options: (a) lift `useTreeState()` above the router and pass via props/context, (b) migrate to Zustand. Option (a) is the minimal change that respects the existing ADR.

### ADR-0005: Recharts 2.x
- **File**: `architecture/decisions/adr-0005-use-recharts-2x-for-pie-chart-visualization.md`
- **Key point**: Recharts was chosen partly to avoid adding Redux-family dependencies. Any new dependency (like react-router) should be evaluated for its transitive dependency footprint against the < 500KB gzipped budget (NFR-07).

## Constraints

### Routing Must Be Client-Side Only
The app is a static SPA on GitHub Pages with no server-side rendering or redirects capability (per ADR-0001). Any routing solution must work entirely in the browser.

### GitHub Pages Routing Compatibility
GitHub Pages does **not** support server-side URL rewriting. If using `BrowserRouter` (HTML5 history API), navigating directly to `/subcategories` would return a 404 because GitHub Pages looks for a literal `subcategories/index.html` file. Two common workarounds:
1. **Hash routing** (`HashRouter`): URLs like `/#/subcategories` -- works natively on GitHub Pages with zero configuration
2. **SPA fallback hack**: A custom `404.html` that redirects to `index.html` with the path as a query parameter -- brittle, requires build-time setup
3. **`base` path in Vite**: If the repo is deployed at a subpath (e.g., `https://user.github.io/EU/`), the Vite `base` config and router `basename` must match

**Constraint**: The routing approach MUST work on GitHub Pages without requiring server-side configuration (per ADR-0001, GitHub Pages hosting is established).

### State Must Be Shared Across Pages
Per ADR-0004, the `useReducer`-based state currently lives in `App.tsx`. Both pages (dashboard and subcategory management) need access to the same `DashboardState` and `dispatch`. The design MUST NOT introduce a second, independent state tree for subcategory management -- this would violate the "single root tree" principle in `DashboardState`.

### New Reducer Actions Must Extend the Existing Discriminated Union
Per ADR-0004, the 5 existing action types form a discriminated union (`TreeAction`). Adding `ADD_SUBCATEGORY` and `REMOVE_SUBCATEGORY` actions MUST extend this union, not create a separate reducer. The `treeReducer` must remain the single reducer for all tree state mutations.

### Node ID Scheme Must Be Followed
Per `architecture/overview.md`, node IDs follow the flat kebab-case pattern: `{gender}-{kved}-{slug}`. New subcategories added dynamically must follow this convention. The design must define how slugs are generated for user-created subcategories (auto-generated from label? user-provided?).

### Percentage Normalization Is Required
Per the data model, percentages are the source of truth and sibling percentages must sum to 100.0 in auto mode. Adding a subcategory requires redistributing percentages among siblings using `largestRemainder()`. Removing a subcategory requires redistributing its percentage to remaining siblings.

### Bundle Size Budget
NFR-07 requires < 500KB gzipped total. `react-router-dom` adds approximately 15-20KB gzipped. This is within budget but should be tracked. Lighter alternatives (e.g., `wouter` at ~2KB) exist if bundle size is a concern.

### TreeNode Interface Should Not Be Modified
The `TreeNode` interface in `src/types/tree.ts` is used across the entire codebase (55 nodes, 19 test files, 10 components). Any changes to the interface have cascading impact. The design should prefer adding new actions and utility functions over modifying the core type.

### Component Size Limit
Per project conventions, no component should exceed 200 lines. The subcategory management page should be composed of smaller components following the established patterns (composition root, container + child, controlled components).

## Integration Points

### State Management Integration
- **Where**: `src/hooks/useTreeState.ts` (reducer + hook)
- **Impact**: New actions (`ADD_SUBCATEGORY`, `REMOVE_SUBCATEGORY`) must be added to `TreeAction` union in `src/types/actions.ts` and handled in `treeReducer`
- **Behavior**: After add/remove, the reducer must call `largestRemainder()` to normalize sibling percentages and `recalcAbsoluteValues()` to update absolute values
- **Reset behavior**: `RESET` returns `initialState` (the hardcoded `defaultTree`). Dynamically added subcategories would be lost on reset. This is acceptable behavior but should be documented.

### Tree Utilities Integration
- **Where**: `src/utils/treeUtils.ts`
- **Impact**: May need new helpers for adding/removing children from a specific parent node immutably
- **Existing helpers**: `findNodeById`, `findParentById`, `updateNodeInTree`, `updateChildrenInTree`, `collectSiblingInfo` -- `updateChildrenInTree` is particularly relevant for add/remove operations

### Composition Root Restructuring
- **Where**: `src/App.tsx` and `src/main.tsx`
- **Impact**: `App.tsx` must be restructured to include a router. `useTreeState()` should be called above the router so both pages share the same state. `main.tsx` may need to wrap `<App />` in a router provider, or `App.tsx` itself becomes the router boundary.
- **Current pattern**: `App.tsx` is a pure composition root with zero logic. Introducing routing adds conditional rendering (which page to show), which increases App.tsx's responsibility. Consider whether routing belongs in `App.tsx` or in a new `Router.tsx` component to maintain the composition root pattern.

### Default Tree Data
- **Where**: `src/data/defaultTree.ts`
- **Impact**: The default tree is a hardcoded literal (55 nodes). Adding subcategories to non-IT industries means the default tree does NOT need to change -- new subcategories are user-created, ephemeral state that is lost on reset.
- **Consideration**: If the task scope includes allowing subcategories for ALL industries (not just IT), the current `defaultTree` structure already supports this -- any industry node can have a `children` array. The current empty `children: []` for non-IT industries is the correct starting state.

### Chart Color Integration
- **Where**: `src/data/chartColors.ts`, `src/utils/chartDataUtils.ts`
- **Impact**: `generateSubcategoryColors()` creates opacity-based shades from the parent industry color. This works dynamically for any number of subcategories, so no changes needed to the color generation logic. However, if subcategory count changes significantly (e.g., 20+ subcategories), the opacity range (100% to 40%) may produce hard-to-distinguish colors.

### Build Configuration
- **Where**: `vite.config.ts`
- **Impact**: If the deployment is at a subpath on GitHub Pages (e.g., `/EU/`), the Vite `base` configuration must be set. This affects all asset URLs and must be coordinated with the router's `basename` setting.

## Recommendations for PO

### Scope Considerations

1. **Routing library choice should be decided early**: This is the first time the SPA needs routing. The choice between `react-router-dom` (full-featured, well-known, ~18KB gzipped) and lighter alternatives like `wouter` (~2KB) has long-term implications. `react-router-dom` is the industry standard and would be the safer choice for a project that may add more pages later. Recommend including the routing library decision as an explicit acceptance criterion.

2. **Hash routing vs history routing**: For GitHub Pages compatibility, **hash routing** (`/#/subcategories`) is the simplest, zero-configuration approach. History routing requires workarounds (404.html redirect hack). PO should decide whether clean URLs matter enough to justify the additional complexity.

3. **Which industries can have subcategories?**: Currently only IT (KVED J) has subcategories. Should the subcategory management page allow adding subcategories to ANY industry, or only IT? Allowing all industries is technically simpler (the tree structure already supports it) but has UX implications (16 industries x 2 genders = 32 potential subcategory-capable parents).

4. **Subcategory limits**: Should there be a maximum number of subcategories per industry? The `largestRemainder()` algorithm works for any count, but UX degrades with too many items (slider crowding, pie chart readability). Consider recommending a cap (e.g., 20 subcategories per industry).

5. **State persistence across page navigation**: Navigating between the dashboard and subcategory management page should preserve state (slider positions, added subcategories). This is naturally handled if `useTreeState()` is called above the router. PO should confirm this is expected behavior.

6. **Reset behavior for custom subcategories**: When the user clicks "Reset", the app restores `initialState` (the hardcoded `defaultTree`). This means dynamically added subcategories are removed. PO should confirm this is acceptable or decide if custom subcategories should persist across reset.

7. **Navigation UX**: How does the user navigate between pages? A button in the header? A sidebar link? This affects `DashboardHeader` (which is currently sticky and contains the mode toggle + reset). Consider whether navigation controls belong in the header or elsewhere.

8. **Subcategory default percentage**: When a new subcategory is added, what is its initial percentage? Options: (a) equal distribution among all siblings, (b) 0% initially (requiring manual slider adjustment), (c) a "remaining" percentage. This has implications for the auto-balance algorithm.

### Things to Exclude from Scope

- **Server-side rendering** -- the app is and should remain a static SPA (per ADR-0001)
- **Persistent storage** (localStorage, IndexedDB) for subcategory data -- this is a separate concern; the task should focus on runtime add/remove
- **Drag-and-drop reordering** of subcategories -- this adds significant complexity and is not mentioned in the task description
- **Editing existing default subcategories** (rename, change KVED code) -- the task mentions add/remove, not edit
