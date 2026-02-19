---
id: task-011
title: Tree Configuration Page (Add/Remove Industries & Subcategories)
status: po
priority: medium
dependencies: [9]
created_at: 2026-02-18
---

# Tree Configuration Page (Add/Remove Industries & Subcategories)

## Problem (PO)

The Labor Market Dashboard Calculator currently provides a fixed tree structure: 2 genders, 16 industries per gender, and 10 IT subcategories per gender (55 nodes total). Users cannot customize this structure to match their specific analytical needs.

**From the user's perspective:**

"As an analyst, I want to add industries or subcategories that are not in the default dataset -- for example, splitting 'Промисловість' into sub-sectors, or adding a new emerging industry. I also want to remove industries that are irrelevant to my scenario. Right now, I can only adjust percentages of the pre-defined categories, which limits the depth and relevance of my 'what-if' modeling."

**Why now:**

- The dashboard has reached feature maturity for its core interaction model (sliders, pie charts, auto-balance). Structural flexibility is the next logical step.
- Multiple PRD-defined industries have detailed subcategory breakdowns (PRD Section 6) but are implemented as leaf nodes. Users modeling sector-specific scenarios cannot express structural changes.
- This is the first feature requiring client-side routing, establishing the pattern for future multi-page features.

**If we do nothing:** Users remain limited to percentage adjustments on a fixed 55-node tree, unable to model structural labor market changes.

**Scope:** A dedicated Configuration Page accessible via collapsible sidebar. Users can add/remove industries (Level 2) and subcategories (Level 3) for both genders. Gender nodes and root are not configurable. Navigation uses hash routing (`/#/config`). State is shared with the dashboard.

## Success Criteria (PO)

1. User can add a new industry to either gender and see it on the dashboard with equal-redistributed percentage within 2 seconds.
2. User can remove an industry (with or without subcategories) and see remaining siblings redistribute correctly within 2 seconds.
3. User can add a subcategory to any industry (not just IT) and see it in the expandable tree on the dashboard.
4. User can remove a subcategory and see remaining subcategories redistribute correctly.
5. User can navigate between Dashboard and Configuration via sidebar without losing any state.
6. "Reset to defaults" removes all custom nodes and restores the original 55-node tree.
7. All new UI elements meet existing accessibility standards (WCAG touch targets >= 44x44px, heading hierarchy, ARIA labels).
8. Bundle size remains under 500KB gzipped (NFR-07) after adding routing library and new page components.

## Acceptance Criteria (PO)

### Routing and Navigation

* Given the app is loaded at the root URL
  When the page renders
  Then the dashboard is displayed as the default view (route `/#/`)

* Given the user is on any page
  When they click the sidebar toggle
  Then a sidebar appears showing navigation links for "Dashboard" and "Configuration"

* Given the sidebar is open
  When the user clicks "Configuration"
  Then the URL changes to `/#/config` and the configuration page is displayed

* Given the user is on the configuration page
  When they click "Dashboard" in the sidebar
  Then the URL changes to `/#/` and the dashboard is displayed with all current state preserved

* Given the user navigates directly to `/#/config` (browser bookmark)
  When the page loads
  Then the configuration page renders correctly with the default tree state

### Adding Industries

* Given the user is on the configuration page viewing a gender section (e.g., "Чоловіки")
  When they click "Add industry" and enter a label (e.g., "Кібербезпека")
  Then a new industry node appears under that gender with equally redistributed percentages among all siblings (including the new one), summing to 100.0%

* Given the user adds a new industry
  When they navigate to the dashboard
  Then the new industry appears in the corresponding gender tree panel with a slider and correct percentage

* Given a new industry is added
  When its node ID is generated
  Then the ID follows the kebab-case convention (`{gender}-{slug}`)

* Given a new industry is added
  When the pie chart for that gender renders
  Then the new industry appears as a slice with a dynamically assigned color

### Adding Subcategories

* Given the user expands an industry on the configuration page
  When they click "Add subcategory" and enter a label
  Then a new subcategory appears under that industry with equally redistributed percentages among all subcategories

* Given an industry previously had no subcategories (leaf node)
  When the user adds the first subcategory
  Then the industry becomes expandable on the dashboard, and the single subcategory receives 100% of the parent

* Given a new subcategory is added to an industry
  When the user navigates to the dashboard and expands that industry
  Then the subcategory appears with a slider and the mini pie chart includes the new subcategory

### Removing Industries

* Given an industry exists under a gender
  When the user clicks "Remove" and confirms
  Then the industry (and all its subcategories) is removed, and remaining industries redistribute percentages

* Given there is only one industry remaining under a gender
  When the user attempts to remove it
  Then the removal is blocked with an informative message

* Given an industry was removed
  When the user navigates to the dashboard
  Then it no longer appears in the tree panel or pie chart

### Removing Subcategories

* Given an industry has multiple subcategories
  When the user removes one and confirms
  Then it is removed and remaining subcategories redistribute percentages

* Given an industry has exactly one subcategory remaining
  When the user removes it and confirms
  Then the industry becomes a leaf node on the dashboard

### Reset Behavior

* Given the user has added custom industries and subcategories
  When they click "Reset to defaults"
  Then all custom nodes are removed and the tree returns to the default 55-node structure

### Percentage Redistribution

* Given the balance mode is "auto"
  When a new node is added to a sibling group
  Then all siblings receive equal percentages summing to exactly 100.0%

* Given a node is removed in auto mode
  When redistribution occurs
  Then remaining siblings receive equal redistribution summing to exactly 100.0%

### Confirmation Dialogs

* Given the user clicks "Remove" on any node
  When the confirmation dialog appears
  Then it states the node name and warns that subcategories (if any) will also be removed

### Accessibility

* Given the configuration page is rendered
  When a screen reader navigates the page
  Then all interactive elements have ARIA labels, heading hierarchy is correct, and add/remove buttons are descriptive

* Given the sidebar navigation is rendered
  When the user navigates via keyboard
  Then all links and toggle buttons are focusable and operable via Enter/Space

## Out of Scope (PO)

- **Editing existing node labels or KVED codes** -- add/remove only, not rename/edit
- **Reordering nodes** -- no drag-and-drop or manual sort
- **Persistent storage** -- custom modifications are session-only (no localStorage/backend)
- **Level 4+ nodes** -- tree remains max 3 levels deep
- **Bulk import/export** -- no JSON/CSV import for tree configuration
- **Gender-level modification** -- Male/Female nodes are structural, not configurable
- **Root node modification on config page** -- total population managed via dashboard header
- **Mobile layout for config page** -- desktop and tablet (1024px+) only for v1
- **Undo/redo** -- no history stack for structural changes
- **Custom color assignment** -- colors auto-assigned for new industries
- **Modifying defaultTree.ts** -- custom nodes are runtime-only state

## Open Questions (PO)

All questions resolved:

| # | Question | Resolution |
|---|----------|------------|
| 1 | Routing approach | Hash routing (`/#/config`) |
| 2 | Configurable node levels | Industries (L2) and subcategories (L3) for all industries |
| 3 | Subcategory limits | No hard limit in v1 |
| 4 | Reset behavior | Custom nodes removed on reset |
| 5 | Navigation UX | Collapsible sidebar toggle |
| 6 | Default percentage for new nodes | Equal redistribution among all siblings |
| 7 | State across navigation | Preserved -- state lives above the router |
| 8 | Routing library choice | Deferred to TL design |

---

## Technical Notes (TL)

- **Affected modules**: `apps/labor-market-dashboard/` (all subdirectories: types, utils, hooks, components, data)
- **New modules/entities to create**:
  - `src/components/config/` -- 6 components (ConfigPage, ConfigGenderSection, ConfigIndustryRow, ConfigSubcategoryRow, AddNodeForm, ConfirmDialog)
  - `src/components/layout/` -- 2 components (AppLayout, Sidebar)
  - `src/components/DashboardPage.tsx` -- extracted from App.tsx
  - `src/utils/slugify.ts` -- Ukrainian label to kebab-case slug utility
- **DB schema change required?** No (no database)
- **Routing library**: wouter (~2 KB gzipped) with `useHashLocation` for hash routing (`/#/`, `/#/config`)
- **State lifting**: `useTreeState()` stays in App.tsx above the router. Props drilling through AppLayout to page components. No React Context needed for 2 pages.
- **New reducer actions**: 4 new actions extend `TreeAction` union:
  - `ADD_INDUSTRY { genderId, label }` -- creates node, equal redistribution
  - `REMOVE_INDUSTRY { nodeId }` -- removes node + children, equal redistribution
  - `ADD_SUBCATEGORY { industryId, label }` -- creates subcategory, equal redistribution
  - `REMOVE_SUBCATEGORY { nodeId }` -- removes subcategory, industry may become leaf
- **TreeNode interface**: NOT modified. Custom nodes use `defaultPercentage: 0` to distinguish from defaults.
- **Known risks**:
  - [Medium] Slug collisions from similar Ukrainian labels -- mitigated by numeric suffix
  - [Low] Color exhaustion for >16 industries -- mitigated by dynamic color palette fallback
  - [Low] TreePanel expand state stale after add -- mitigated by useEffect auto-expand
- **Architectural decision**: `src/components/config/` subdirectory keeps config components separated from dashboard components
- **Bundle impact**: wouter adds ~2 KB gzipped. Current total is ~175 KB gzipped. Expected total ~177 KB (well under 500 KB budget).
- **Test plan**: Unit tests for slugify, tree helpers, reducer actions. Component tests for Sidebar, DashboardPage, ConfirmDialog, AddNodeForm, ConfigGenderSection, ConfigPage. All 246+ existing tests must pass.

## Implementation Steps (TL)

**Total steps**: 18 | **Estimated effort**: 3-4 days | **Risk level**: Medium

**Decomposition recommendation**: 4 subtasks (steps >= 5, medium-high complexity with new routing + page + 4 reducer actions + 8 components):
- Subtask 1: Core infrastructure (Steps 1-5)
- Subtask 2: Layout and routing (Steps 7-8, 15)
- Subtask 3: Config page components (Steps 9-14)
- Subtask 4: Integration and polish (Steps 6, 16-18)

### Step 1 -- Install wouter and verify build
- Files: `package.json`
- Actions: `pnpm add wouter --filter @template/labor-market-dashboard`
- Verification: `pnpm build` passes, bundle size delta ~2 KB

### Step 2 -- Add slugify utility with tests
- Files: Create `src/utils/slugify.ts`, `src/__tests__/utils/slugify.test.ts`; modify `src/utils/index.ts`
- Details: Cyrillic-to-Latin transliteration, kebab-case output
- Verification: `pnpm test` passes

### Step 3 -- Add tree utility functions with tests
- Files: Modify `src/utils/treeUtils.ts`, `src/utils/index.ts`, `src/__tests__/utils/treeUtils.test.ts`
- Details: `addChildToParent()`, `removeChildFromParent()`, `generateUniqueId()`
- Verification: `pnpm test` passes

### Step 4 -- Extend TreeAction with 4 new action types
- Files: Modify `src/types/actions.ts`
- Details: ADD_INDUSTRY, REMOVE_INDUSTRY, ADD_SUBCATEGORY, REMOVE_SUBCATEGORY
- Verification: `pnpm build` passes (type-check)

### Step 5 -- Implement reducer handlers for new actions
- Files: Modify `src/hooks/useTreeState.ts`, `src/__tests__/hooks/useTreeState.test.ts`
- Details: 4 new case handlers using tree utility functions
- Verification: `pnpm test` passes (existing 19 + new ~12 tests)

### Step 6 -- Add dynamic color palette for new industries
- Files: Modify `src/data/chartColors.ts`, `src/data/index.ts`, `src/utils/chartDataUtils.ts`
- Verification: `pnpm test` passes

### Step 7 -- Create layout components (AppLayout + Sidebar)
- Files: Create `src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `index.ts`; create `src/__tests__/components/layout/Sidebar.test.tsx`
- Verification: `pnpm test` passes

### Step 8 -- Create DashboardPage component
- Files: Create `src/components/DashboardPage.tsx`, `src/__tests__/components/DashboardPage.test.tsx`
- Details: Extract dashboard rendering from App.tsx
- Verification: `pnpm test` passes

### Step 9 -- Create ConfirmDialog component
- Files: Create `src/components/config/ConfirmDialog.tsx`, `src/__tests__/components/config/ConfirmDialog.test.tsx`
- Details: Native `<dialog>` element with `showModal()` for focus trap
- Verification: `pnpm test` passes

### Step 10 -- Create AddNodeForm component
- Files: Create `src/components/config/AddNodeForm.tsx`, `src/__tests__/components/config/AddNodeForm.test.tsx`
- Details: Inline form with label validation
- Verification: `pnpm test` passes

### Step 11 -- Create ConfigSubcategoryRow component
- Files: Create `src/components/config/ConfigSubcategoryRow.tsx`
- Details: Simple row with label, percentage, remove button
- Verification: Tested as part of ConfigGenderSection

### Step 12 -- Create ConfigIndustryRow component
- Files: Create `src/components/config/ConfigIndustryRow.tsx`
- Details: Expandable row with subcategories and add subcategory form
- Verification: Tested as part of ConfigGenderSection

### Step 13 -- Create ConfigGenderSection component with tests
- Files: Create `src/components/config/ConfigGenderSection.tsx`, `src/__tests__/components/config/ConfigGenderSection.test.tsx`
- Details: Gender section with industry list, add/remove, expand/collapse, ConfirmDialog
- Verification: `pnpm test` passes

### Step 14 -- Create ConfigPage component with tests
- Files: Create `src/components/config/ConfigPage.tsx`, `index.ts`, `src/__tests__/components/config/ConfigPage.test.tsx`
- Verification: `pnpm test` passes

### Step 15 -- Restructure App.tsx with hash router
- Files: Modify `src/App.tsx`, `src/components/index.ts`
- Details: wouter Router with useHashLocation, AppLayout wrapper, route-based page rendering
- Verification: `pnpm build` passes, navigation works

### Step 16 -- Fix TreePanel auto-expand for new expandable nodes
- Files: Modify `src/components/TreePanel.tsx`, `src/__tests__/components/TreePanel.test.tsx`
- Details: useEffect to auto-expand nodes that gain children
- Verification: `pnpm test` passes

### Step 17 -- Update barrel exports and verify integration
- Files: Modify `src/components/index.ts`
- Verification: `pnpm build` passes, `pnpm lint` passes

### Step 18 -- Final verification: full test suite, lint, build
- Verification: `pnpm test`, `pnpm lint`, `pnpm build` all pass. Bundle < 500 KB gzipped.

---

## Implementation Log (DEV)

_To be filled during implementation._

---

## QA Notes (QA)

_To be filled by QA agent._
