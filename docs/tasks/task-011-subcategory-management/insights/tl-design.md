# Technical Design: task-011
Generated: 2026-02-18

## Overview

This task introduces a **Tree Configuration Page** for adding/removing industries (Level 2) and subcategories (Level 3), a **hash router** for page navigation, and a **collapsible sidebar** for switching between Dashboard and Configuration views. The design lifts `useTreeState()` into App.tsx (which becomes the router boundary), adds 4 new reducer actions, and creates ~8 new components following existing composition patterns. The routing library is **wouter** (~2 KB gzipped) for minimal bundle impact.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/` (all subdirectories)
- **New modules/entities to create**:
  - `src/components/config/` -- Configuration page components (ConfigPage, ConfigGenderSection, ConfigIndustryRow, ConfigSubcategoryRow, AddNodeForm, ConfirmDialog)
  - `src/components/layout/` -- Layout components (AppLayout, Sidebar)
  - `src/utils/slugify.ts` -- Ukrainian label to kebab-case slug utility
- **DB schema change required?** No (no database)
- **Architectural considerations**:
  - App.tsx transitions from a pure composition root to a router boundary that calls `useTreeState()` above the router. Both pages receive `state` and `dispatch` via props through a shared `AppLayout` component.
  - Hash routing (`/#/config`) avoids GitHub Pages server-side rewrite issues (per arch-context).
  - No React Context needed -- props drilling through `AppLayout` to child pages keeps the architecture minimal and consistent with ADR-0004.
  - New reducer actions (`ADD_INDUSTRY`, `REMOVE_INDUSTRY`, `ADD_SUBCATEGORY`, `REMOVE_SUBCATEGORY`) extend the existing `TreeAction` discriminated union. The single `treeReducer` remains the sole reducer.
  - The `TreeNode` interface is NOT modified. New nodes use the existing shape with runtime-generated IDs and `defaultPercentage: 0` (marking them as custom/ephemeral).
- **Known risks or trade-offs**:
  - **[Medium] Slug collisions**: Two industries with similar Ukrainian names could produce duplicate IDs. Mitigation: append a numeric suffix if collision detected.
  - **[Low] Color exhaustion**: New industries added beyond the 16 KVED palette get `DEFAULT_NODE_COLOR` (slate-400). This is acceptable per PO scope ("colors auto-assigned").
  - **[Low] Expand state stale after add**: TreePanel's `collectExpandableIds()` runs once on mount. After adding a first subcategory to a leaf industry, the new expandable node will not be in `expandedIds`. Mitigation: TreePanel needs to react to children changes to auto-expand newly created expandable nodes.
- **Test plan**: Unit tests for new reducer actions, slug generation utility, and `addNode`/`removeNode` tree utilities. Component tests for ConfigPage, Sidebar, AddNodeForm, ConfirmDialog. Integration test for navigation state preservation.

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| **wouter** as routing library | ~2 KB gzipped (vs react-router-dom ~18 KB). Supports hash routing via `useHashLocation`. Minimal API matches our simple 2-route needs. Current bundle is 175 KB gzipped; wouter keeps us far under 500 KB budget. | react-router-dom (heavier, more features than needed), TanStack Router (newer, more config overhead), manual `window.location.hash` (no library but no link components/hook ergonomics) |
| **Props drilling through AppLayout** (no Context) | ADR-0004 says "if cross-component sharing needed, lift to context or Zustand." With only 2 pages, AppLayout can pass `state`/`dispatch` directly. Avoids creating a Context provider for minimal benefit. If a 3rd page is added, Context would be warranted. | React Context (premature for 2 pages), Zustand (breaks ADR-0004 preference) |
| **App.tsx as router boundary** | `useTreeState()` stays in App.tsx (above router). App.tsx gains a Router + Route setup but delegates all rendering to AppLayout and page components. Minimal change to existing architecture. | Separate Router.tsx component (unnecessary indirection), main.tsx wrapping (breaks composition root pattern) |
| **`defaultPercentage: 0` for custom nodes** | Distinguishes custom nodes from default ones without modifying `TreeNode` interface. On RESET, the reducer restores `initialState` which naturally excludes custom nodes. The `0` value is never used for slider reset (there is no per-node reset). | Adding an `isCustom: boolean` field (modifies TreeNode, cascading impact on 19 test files), Separate custom node tracking (duplicates state) |
| **Equal redistribution on add/remove** | PO decision: new nodes get `100 / N` (N = total siblings after add). Remove redistributes removed share equally to remaining siblings. Both use `largestRemainder()` for exact 100.0 sum. | Proportional redistribution (more complex, less intuitive for users), zero-start for new nodes (breaks 100% constraint in auto mode) |
| **Confirmation via custom ConfirmDialog** (not `window.confirm`) | Config page needs richer confirmation messages (node name, warning about subcategories). `window.confirm()` cannot be styled or show structured content. The existing ResetButton uses `window.confirm()` but that is a simple one-line message. | `window.confirm()` (too limited for structured warning messages), Third-party modal library (unnecessary dependency) |
| **`src/components/config/` subdirectory** | Config page components are only used on the config page and form a cohesive group (~6 components). Placing them in a subdirectory avoids polluting the flat `components/` directory which currently has 10 dashboard-specific components. | Flat in `components/` (would mix dashboard and config concerns), Separate feature directory (overengineered for a single page) |

## New/Modified Types and Interfaces

### New Action Types (in `src/types/actions.ts`)

```typescript
// Extend existing TreeAction union with 4 new actions:
| { type: 'ADD_INDUSTRY'; genderId: string; label: string }
| { type: 'REMOVE_INDUSTRY'; nodeId: string }
| { type: 'ADD_SUBCATEGORY'; industryId: string; label: string }
| { type: 'REMOVE_SUBCATEGORY'; nodeId: string }
```

**Payload rationale:**
- `ADD_INDUSTRY`: needs `genderId` (which gender to add under) and `label` (user-provided Ukrainian name). The reducer generates the node ID, genderSplit, and percentage internally.
- `REMOVE_INDUSTRY`: needs only `nodeId`. The reducer finds the parent and redistributes.
- `ADD_SUBCATEGORY`: needs `industryId` (which industry to add under) and `label`.
- `REMOVE_SUBCATEGORY`: needs only `nodeId`.

### New Utility: `slugify()` (in `src/utils/slugify.ts`)

```typescript
/**
 * Convert a Ukrainian label to a kebab-case slug for node ID generation.
 * Transliterates Cyrillic characters and removes non-alphanumeric characters.
 *
 * @param label - Ukrainian text label
 * @returns Kebab-case ASCII slug
 *
 * @example
 * slugify("Кібербезпека") // => "kiberbezpeka"
 * slugify("Розробка ПЗ")  // => "rozrobka-pz"
 */
export function slugify(label: string): string;
```

Uses a simple Cyrillic-to-Latin transliteration map (covering Ukrainian alphabet). No external library needed (~30 lines).

### New Utility Functions (in `src/utils/treeUtils.ts`)

```typescript
/**
 * Add a child node to a parent, with equal redistribution of percentages.
 * Returns a new tree with the child added and all siblings' percentages
 * redistributed to sum to 100.0% via largestRemainder().
 */
export function addChildToParent(
  tree: TreeNode,
  parentId: string,
  newChild: TreeNode,
): TreeNode;

/**
 * Remove a child node from its parent, with equal redistribution of the
 * removed node's percentage to remaining siblings.
 * Returns a new tree, or the original tree if removal is blocked
 * (last remaining sibling).
 */
export function removeChildFromParent(
  tree: TreeNode,
  parentId: string,
  childId: string,
): TreeNode;

/**
 * Generate a unique node ID given a prefix and label slug.
 * Appends a numeric suffix if the ID already exists in the tree.
 */
export function generateUniqueId(
  tree: TreeNode,
  prefix: string,
  slug: string,
): string;
```

## Component Breakdown

### Layout Components (`src/components/layout/`)

| Component | File | Responsibility | Lines (est.) |
|-----------|------|---------------|--------------|
| **AppLayout** | `AppLayout.tsx` | Flex container: Sidebar + main content area. Receives `state`, `dispatch`, and `children` (page content). Manages sidebar open/close state locally. | ~50 |
| **Sidebar** | `Sidebar.tsx` | Collapsible navigation rail. Shows "Dashboard" and "Configuration" links. Uses wouter's `useHashLocation` for active link highlighting. Toggle button with hamburger/close icon. `aria-label="Navigation"`, keyboard accessible. | ~90 |

### Config Page Components (`src/components/config/`)

| Component | File | Responsibility | Lines (est.) |
|-----------|------|---------------|--------------|
| **ConfigPage** | `ConfigPage.tsx` | Composition root for config page. Receives `state`, `dispatch`. Renders `<h1>` page title + 2 `ConfigGenderSection` instances. | ~50 |
| **ConfigGenderSection** | `ConfigGenderSection.tsx` | Renders a gender section with `<h2>` heading, list of `ConfigIndustryRow`, and "Add industry" button. Manages expand/collapse state for industries locally (same pattern as TreePanel). | ~90 |
| **ConfigIndustryRow** | `ConfigIndustryRow.tsx` | Single industry row: label, percentage, absolute value, remove button, expand chevron. When expanded, shows subcategory rows + "Add subcategory" button. | ~120 |
| **ConfigSubcategoryRow** | `ConfigSubcategoryRow.tsx` | Single subcategory row: label, percentage, absolute value, remove button. Simpler than ConfigIndustryRow (no expand, no children). | ~40 |
| **AddNodeForm** | `AddNodeForm.tsx` | Inline form for adding a new node. Text input for label + "Add" button. Validates non-empty label. Dispatches `ADD_INDUSTRY` or `ADD_SUBCATEGORY` depending on context. | ~70 |
| **ConfirmDialog** | `ConfirmDialog.tsx` | Modal dialog for removal confirmation. Shows node name, warning about subcategory cascade. "Confirm"/"Cancel" buttons. Uses `<dialog>` element for native modal behavior. Focus trap via `showModal()` API. | ~80 |

### Dashboard Page Component

| Component | File | Responsibility | Lines (est.) |
|-----------|------|---------------|--------------|
| **DashboardPage** | `DashboardPage.tsx` | Extracts current App.tsx dashboard rendering into a standalone page component. Receives `state`, `dispatch`. Renders DashboardHeader + 2 GenderSections in the existing grid layout. | ~50 |

### Modified Existing Components

| Component | Change | Reason |
|-----------|--------|--------|
| **App.tsx** | Adds wouter Router, calls `useTreeState()`, wraps in `AppLayout` with route-based page rendering | Router boundary, state above router |
| **components/index.ts** | Adds exports for new layout and config components | Barrel convention |
| **TreePanel.tsx** | Auto-expand newly expandable nodes when children change | When first subcategory is added via config page, the industry should auto-expand on the dashboard |

## File-by-File Change List

### New Files

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | `src/utils/slugify.ts` | Utility | Cyrillic-to-Latin transliteration + kebab-case slug generation |
| 2 | `src/components/layout/AppLayout.tsx` | Component | Sidebar + content wrapper |
| 3 | `src/components/layout/Sidebar.tsx` | Component | Collapsible nav sidebar with hash routing links |
| 4 | `src/components/layout/index.ts` | Barrel | Exports AppLayout, Sidebar |
| 5 | `src/components/config/ConfigPage.tsx` | Component | Config page composition root |
| 6 | `src/components/config/ConfigGenderSection.tsx` | Component | Gender section with editable industry list |
| 7 | `src/components/config/ConfigIndustryRow.tsx` | Component | Industry row with remove + expand |
| 8 | `src/components/config/ConfigSubcategoryRow.tsx` | Component | Subcategory row with remove |
| 9 | `src/components/config/AddNodeForm.tsx` | Component | Inline label input + add button |
| 10 | `src/components/config/ConfirmDialog.tsx` | Component | Removal confirmation modal |
| 11 | `src/components/config/index.ts` | Barrel | Exports all config components |
| 12 | `src/components/DashboardPage.tsx` | Component | Dashboard page extracted from App.tsx |
| 13 | `src/__tests__/utils/slugify.test.ts` | Test | Slugify unit tests |
| 14 | `src/__tests__/utils/treeUtils.test.ts` | Test update | Add tests for addChildToParent, removeChildFromParent, generateUniqueId |
| 15 | `src/__tests__/hooks/useTreeState.test.ts` | Test update | Add tests for 4 new reducer actions |
| 16 | `src/__tests__/components/config/ConfigPage.test.tsx` | Test | Config page rendering tests |
| 17 | `src/__tests__/components/config/ConfigGenderSection.test.tsx` | Test | Gender section with add/remove |
| 18 | `src/__tests__/components/config/AddNodeForm.test.tsx` | Test | Form validation and dispatch |
| 19 | `src/__tests__/components/config/ConfirmDialog.test.tsx` | Test | Dialog open/close, confirm/cancel |
| 20 | `src/__tests__/components/layout/Sidebar.test.tsx` | Test | Navigation links, active state |
| 21 | `src/__tests__/components/DashboardPage.test.tsx` | Test | Dashboard page rendering |

### Modified Files

| # | File | Change Description |
|---|------|--------------------|
| 1 | `package.json` | Add `wouter` to dependencies |
| 2 | `src/types/actions.ts` | Add 4 new action types to `TreeAction` union |
| 3 | `src/utils/treeUtils.ts` | Add `addChildToParent()`, `removeChildFromParent()`, `generateUniqueId()` |
| 4 | `src/utils/index.ts` | Add exports for new tree utility functions and slugify |
| 5 | `src/hooks/useTreeState.ts` | Add 4 new case handlers in `treeReducer` |
| 6 | `src/App.tsx` | Add wouter hash router, AppLayout wrapper, route-based page rendering |
| 7 | `src/components/index.ts` | Add exports for DashboardPage and re-export layout/config barrels |
| 8 | `src/components/TreePanel.tsx` | Add `useEffect` to auto-expand newly expandable nodes |
| 9 | `src/data/chartColors.ts` | Add `DYNAMIC_COLOR_PALETTE` array for new industries beyond KVED-16 |

## Implementation Steps

### Step 1 -- Install wouter and verify build

- **Files**: `package.json`
- **Actions**: `pnpm add wouter --filter @template/labor-market-dashboard`
- **Verification**: `pnpm build` passes. Check that wouter is in dependencies. Check gzipped bundle size delta (expect ~2 KB increase).

### Step 2 -- Add slugify utility with tests

- **Files**:
  - Create `src/utils/slugify.ts`
  - Create `src/__tests__/utils/slugify.test.ts`
  - Modify `src/utils/index.ts` (add export)
- **Details**:
  - Implement Cyrillic-to-Latin transliteration map for Ukrainian alphabet (33 letters + common combos like "ьо" -> "o", "зг" -> "zgh")
  - Convert to lowercase, replace spaces/non-alphanum with hyphens, collapse multiple hyphens, trim leading/trailing hyphens
  - Test cases: basic Ukrainian words, multi-word labels, special characters, empty string, already-latin input
- **Verification**: `pnpm test` -- slugify tests pass. No lint errors.

### Step 3 -- Add tree utility functions with tests

- **Files**:
  - Modify `src/utils/treeUtils.ts` (add `addChildToParent`, `removeChildFromParent`, `generateUniqueId`)
  - Modify `src/utils/index.ts` (add exports)
  - Modify `src/__tests__/utils/treeUtils.test.ts` (add test cases)
- **Details**:
  - `addChildToParent(tree, parentId, newChild)`:
    1. Find parent by ID
    2. Append `newChild` to parent's children
    3. Equal redistribution: `largestRemainder(Array(N).fill(100/N), 100, 1)` where N = new children count
    4. Assign redistributed percentages to all children (including new one)
    5. Return updated tree via `updateChildrenInTree`
  - `removeChildFromParent(tree, parentId, childId)`:
    1. Find parent by ID
    2. If parent has <= 1 child, return original tree (block removal)
    3. Filter out the removed child
    4. Equal redistribution: `largestRemainder(Array(N).fill(100/N), 100, 1)` where N = remaining children
    5. Return updated tree
  - `generateUniqueId(tree, prefix, slug)`:
    1. Candidate = `${prefix}-${slug}`
    2. If `findNodeById(tree, candidate)` returns undefined, use it
    3. Otherwise append `-2`, `-3`, etc. until unique
  - Test edge cases: add to empty children, add to existing group, remove last-allowed, remove with subcategories, ID collision resolution
- **Verification**: `pnpm test` -- all treeUtils tests pass (existing + new).

### Step 4 -- Extend TreeAction with 4 new action types

- **Files**:
  - Modify `src/types/actions.ts`
- **Details**:
  - Add to the `TreeAction` union:
    ```
    | { type: 'ADD_INDUSTRY'; genderId: string; label: string }
    | { type: 'REMOVE_INDUSTRY'; nodeId: string }
    | { type: 'ADD_SUBCATEGORY'; industryId: string; label: string }
    | { type: 'REMOVE_SUBCATEGORY'; nodeId: string }
    ```
  - Update JSDoc to document all 9 action types
- **Verification**: `pnpm build` passes (TypeScript type-checks). No downstream type errors in existing code (new union members are additive).

### Step 5 -- Implement reducer handlers for new actions

- **Files**:
  - Modify `src/hooks/useTreeState.ts`
  - Modify `src/__tests__/hooks/useTreeState.test.ts`
- **Details**:
  - `ADD_INDUSTRY` handler:
    1. Get `genderId` and `label` from action
    2. Find gender node by `genderId`
    3. Determine gender prefix (`male` or `female`) from the gender node ID
    4. Generate slug from label via `slugify()`
    5. Generate unique ID via `generateUniqueId(tree, genderPrefix, slug)`
    6. Create new TreeNode: `{ id, label, percentage: 0, defaultPercentage: 0, absoluteValue: 0, genderSplit: {male: 100, female: 0} or {male: 0, female: 100}, isLocked: false, children: [] }`
    7. Use `addChildToParent(tree, genderId, newNode)` to add and redistribute
    8. Recalc absolute values from root
  - `REMOVE_INDUSTRY` handler:
    1. Find parent (gender node) via `findParentById`
    2. Use `removeChildFromParent(tree, parent.id, nodeId)` -- returns original tree if blocked
    3. Recalc absolute values from root
  - `ADD_SUBCATEGORY` handler:
    1. Get `industryId` and `label`
    2. Find industry node; determine gender prefix from industry node ID
    3. Find industry's kvedCode (if any) for ID generation
    4. Generate unique ID: `generateUniqueId(tree, '{gender}-{kved or industrySlug}', slug)`
    5. Create subcategory node with genderSplit inherited from parent industry
    6. Use `addChildToParent` to add and redistribute
    7. Recalc absolute values
  - `REMOVE_SUBCATEGORY` handler:
    1. Find parent (industry node) via `findParentById`
    2. Use `removeChildFromParent`
    3. If parent now has 0 children, it becomes a leaf node naturally (children = [])
    4. Recalc absolute values
  - Test cases: add first industry, add to existing 16, remove with subcategories, remove last-blocked, add first subcategory to leaf, remove last subcategory (industry becomes leaf), percentage math verification, ID uniqueness
- **Verification**: `pnpm test` -- all useTreeState tests pass (existing 19 + new ~12 tests).

### Step 6 -- Add dynamic color palette for new industries

- **Files**:
  - Modify `src/data/chartColors.ts`
  - Modify `src/data/index.ts` (add export)
  - Modify `src/utils/chartDataUtils.ts` (update `getNodeColor` for dynamic colors)
- **Details**:
  - Add `DYNAMIC_COLOR_PALETTE: string[]` -- 8 additional distinct hex colors for industries without a KVED code. Colors cycle if more than 8 custom industries are added.
  - Update `getNodeColor()` to accept an optional `dynamicIndex` parameter for nodes without a KVED code match, falling back to cycling through the dynamic palette instead of always returning `DEFAULT_NODE_COLOR`.
  - Alternatively, the ConfigPage can build a color map that includes custom industry colors based on their position index.
- **Verification**: `pnpm test` -- chartDataUtils tests pass. Manual verification: new industries get distinct colors in pie charts.

### Step 7 -- Create layout components (AppLayout + Sidebar)

- **Files**:
  - Create `src/components/layout/AppLayout.tsx`
  - Create `src/components/layout/Sidebar.tsx`
  - Create `src/components/layout/index.ts`
  - Create `src/__tests__/components/layout/Sidebar.test.tsx`
- **Details**:
  - **Sidebar**: Collapsible panel on the left. Two nav links: "Dashboard" (`/#/`) and "Configuration" (`/#/config`). Uses wouter's `useHashLocation` to determine active link. Toggle button with `aria-label="Toggle navigation"`. When collapsed, shows only icons. When open, shows icon + text. Transition via Tailwind `transition-all duration-200`.
  - **AppLayout**: Flex row container. `<Sidebar />` on left, `<main className="flex-1">` for page content. Receives `state`, `dispatch` as props (passed to children pages). Manages `isSidebarOpen: boolean` locally.
  - Accessibility: `<nav aria-label="Main navigation">`, links have descriptive text, keyboard navigation via Tab/Enter.
- **Verification**: `pnpm test` -- Sidebar tests pass (active link highlighting, toggle, a11y).

### Step 8 -- Create DashboardPage component

- **Files**:
  - Create `src/components/DashboardPage.tsx`
  - Create `src/__tests__/components/DashboardPage.test.tsx`
- **Details**:
  - Extract the dashboard rendering from current App.tsx into a `DashboardPage` component
  - Props: `state: DashboardState`, `dispatch: React.Dispatch<TreeAction>`
  - Renders DashboardHeader + 2 GenderSections in the same grid layout
  - Essentially the current App.tsx return block as a standalone component
- **Verification**: `pnpm test` -- DashboardPage test passes. Existing component tests unaffected.

### Step 9 -- Create ConfirmDialog component

- **Files**:
  - Create `src/components/config/ConfirmDialog.tsx`
  - Create `src/__tests__/components/config/ConfirmDialog.test.tsx`
- **Details**:
  - Uses native `<dialog>` element with `showModal()` for proper focus trap and backdrop
  - Props: `isOpen: boolean`, `title: string`, `message: string`, `onConfirm: () => void`, `onCancel: () => void`
  - Renders title, message paragraph, and two buttons (Cancel + Confirm with destructive styling)
  - `useEffect` to call `dialogRef.current.showModal()` / `close()` based on `isOpen`
  - Handles Escape key natively via `<dialog>` cancel event
  - Touch targets >= 44x44px
- **Verification**: `pnpm test` -- ConfirmDialog tests pass (open, close, confirm, cancel, keyboard).

### Step 10 -- Create AddNodeForm component

- **Files**:
  - Create `src/components/config/AddNodeForm.tsx`
  - Create `src/__tests__/components/config/AddNodeForm.test.tsx`
- **Details**:
  - Inline form with a text input and an "Add" button
  - Props: `parentId: string`, `actionType: 'ADD_INDUSTRY' | 'ADD_SUBCATEGORY'`, `dispatch: React.Dispatch<TreeAction>`, `placeholder: string`
  - Local state: `label: string`
  - On submit: validates non-empty label (trimmed), dispatches appropriate action, clears input
  - Input has `aria-label` matching the placeholder text
  - Button disabled when label is empty
- **Verification**: `pnpm test` -- AddNodeForm tests pass (submit, validation, dispatch payload).

### Step 11 -- Create ConfigSubcategoryRow component

- **Files**:
  - Create `src/components/config/ConfigSubcategoryRow.tsx`
- **Details**:
  - Simple row: label, percentage display, absolute value display, remove button (trash icon)
  - Props: `node: TreeNode`, `dispatch: React.Dispatch<TreeAction>`, `onRemoveRequest: (nodeId: string, label: string) => void`
  - Remove button triggers `onRemoveRequest` callback (parent manages ConfirmDialog state)
  - Accessibility: remove button has `aria-label="Remove {label}"`
- **Verification**: Visual inspection / tested as part of ConfigGenderSection tests.

### Step 12 -- Create ConfigIndustryRow component

- **Files**:
  - Create `src/components/config/ConfigIndustryRow.tsx`
- **Details**:
  - Industry row with expand/collapse chevron, label, percentage, absolute value, remove button
  - When expanded: renders ConfigSubcategoryRow for each child + AddNodeForm for subcategories
  - Props: `node: TreeNode`, `dispatch: React.Dispatch<TreeAction>`, `onRemoveRequest: (nodeId: string, label: string, hasChildren: boolean) => void`, `isExpanded: boolean`, `onToggleExpand: (id: string) => void`
  - Remove button triggers `onRemoveRequest`
  - Indentation consistent with dashboard TreeRow (depth * 24px)
- **Verification**: Tested as part of ConfigGenderSection tests.

### Step 13 -- Create ConfigGenderSection component with tests

- **Files**:
  - Create `src/components/config/ConfigGenderSection.tsx`
  - Create `src/__tests__/components/config/ConfigGenderSection.test.tsx`
- **Details**:
  - Renders `<h2>` gender heading, list of ConfigIndustryRow components, AddNodeForm for industries
  - Manages local expand state (`useState<Set<string>>`) and ConfirmDialog state locally
  - Props: `genderNode: TreeNode`, `dispatch: React.Dispatch<TreeAction>`
  - ConfirmDialog is rendered here (one per gender section) and opened/closed based on pending removal
  - Tests: renders industries, add industry dispatches correctly, remove flow (confirm/cancel), expand/collapse
- **Verification**: `pnpm test` -- ConfigGenderSection tests pass.

### Step 14 -- Create ConfigPage component with tests

- **Files**:
  - Create `src/components/config/ConfigPage.tsx`
  - Create `src/components/config/index.ts`
  - Create `src/__tests__/components/config/ConfigPage.test.tsx`
- **Details**:
  - Composition root for config page
  - Props: `state: DashboardState`, `dispatch: React.Dispatch<TreeAction>`
  - Renders `<h1>Configuration</h1>` + 2 ConfigGenderSection instances
  - Barrel exports all config components
- **Verification**: `pnpm test` -- ConfigPage test passes.

### Step 15 -- Restructure App.tsx with hash router

- **Files**:
  - Modify `src/App.tsx`
  - Update `src/components/index.ts`
- **Details**:
  - Import `Router` and `Route` from wouter, `useHashLocation` from `wouter/use-hash-location`
  - App.tsx now:
    1. Calls `useTreeState()` (state lives above router)
    2. Wraps content in `<Router hook={useHashLocation}>`
    3. Inside router: `<AppLayout state={state} dispatch={dispatch}>`
    4. Routes: `<Route path="/">` -> DashboardPage, `<Route path="/config">` -> ConfigPage
  - Default route (`/`) shows dashboard (existing behavior preserved for all existing URLs)
- **Verification**: `pnpm build` passes. `pnpm dev` -- navigate between pages, state preserved. Direct URL `/#/config` works.

### Step 16 -- Fix TreePanel auto-expand for new expandable nodes

- **Files**:
  - Modify `src/components/TreePanel.tsx`
  - Update `src/__tests__/components/TreePanel.test.tsx`
- **Details**:
  - Add `useEffect` that watches `genderNode.children` and checks for newly expandable nodes (nodes with children that are not in `expandedIds`). Adds them to `expandedIds` automatically.
  - This ensures that when a user adds the first subcategory to a leaf industry on the config page and navigates back to the dashboard, the industry is automatically expanded.
  - Test: verify that a node transitioning from leaf to parent (children added) gets auto-expanded.
- **Verification**: `pnpm test` -- TreePanel tests pass (existing + new auto-expand test).

### Step 17 -- Update barrel exports and verify integration

- **Files**:
  - Modify `src/components/index.ts` (add DashboardPage, re-export layout/ and config/ barrels)
  - Verify all imports resolve
- **Verification**: `pnpm build` passes. `pnpm lint` passes.

### Step 18 -- Final verification: full test suite, lint, build

- **Files**: None (verification only)
- **Actions**:
  1. `pnpm test` -- all tests pass, no skips
  2. `pnpm lint` -- no errors
  3. `pnpm build` -- builds successfully
  4. Check gzipped bundle size (expect ~177 KB, must be < 500 KB)
  5. Manual smoke test: navigate between pages, add/remove industries and subcategories, verify pie charts update, verify reset removes custom nodes
- **Verification**: All commands pass. Bundle < 500 KB.

## Complexity Assessment

- **Total implementation steps**: 18
- **New files**: ~21 (12 source + 9 test)
- **Modified files**: ~9
- **Estimated effort**: 3-4 days
- **Risk level**: Medium
  - First routing introduction adds structural complexity
  - 4 new reducer actions with redistribution logic need careful testing
  - Component count increases from 10 to ~18
- **Dependencies**: wouter (npm package, ~2 KB gzipped, well-maintained)

**Decomposition recommendation**: This task has 18 steps and medium-high complexity (new routing, new page, 4 reducer actions, 8+ new components). It should be decomposed into 4-5 subtasks:

1. **Subtask 1**: Core infrastructure (Steps 1-5) -- wouter install, slugify utility, tree helpers, action types, reducer handlers
2. **Subtask 2**: Layout and routing (Steps 7-8, 15) -- AppLayout, Sidebar, DashboardPage, App.tsx restructure
3. **Subtask 3**: Config page components (Steps 9-14) -- ConfirmDialog, AddNodeForm, ConfigSubcategoryRow, ConfigIndustryRow, ConfigGenderSection, ConfigPage
4. **Subtask 4**: Integration and polish (Steps 6, 16-18) -- dynamic colors, TreePanel auto-expand, barrel exports, final verification

## Test Strategy

### Unit Tests
- **slugify**: Cyrillic transliteration, edge cases (empty, spaces, special chars, already-latin)
- **addChildToParent**: Equal redistribution math, empty children, large groups
- **removeChildFromParent**: Block removal of last child, redistribution math, cascade
- **generateUniqueId**: No collision, with collision (append suffix)
- **Reducer actions**: ADD_INDUSTRY, REMOVE_INDUSTRY, ADD_SUBCATEGORY, REMOVE_SUBCATEGORY -- each with happy path + edge cases
- **Existing tests**: All 246+ existing tests must continue to pass unchanged

### Component Tests
- **Sidebar**: Navigation links render, active state matches current route, toggle open/close, keyboard navigation
- **DashboardPage**: Renders DashboardHeader + 2 GenderSections (same assertions as current App behavior)
- **ConfirmDialog**: Opens/closes based on prop, confirm fires callback, cancel fires callback, Escape closes
- **AddNodeForm**: Submit dispatches correct action, empty label blocked, input clears after submit
- **ConfigGenderSection**: Renders industries, add button opens form, remove flow with confirmation
- **ConfigPage**: Renders 2 gender sections with correct headings

### Integration Scenarios (Manual Smoke Test)
- Navigate Dashboard -> Config -> Dashboard: all state preserved
- Add industry on config page -> navigate to dashboard: new industry visible with slider and pie chart slice
- Add first subcategory to leaf industry -> dashboard: industry becomes expandable
- Remove industry with subcategories -> dashboard: industry and subs gone, pie chart updated
- Reset to defaults -> config page: only default 55 nodes visible
- Direct URL `/#/config`: config page loads correctly
- Direct URL `/#/`: dashboard loads correctly

## Open Technical Questions

None. All design decisions are resolved based on existing conventions, architectural constraints, and PO decisions.
