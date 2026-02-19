# PO Analysis: task-011
Generated: 2026-02-18

## Problem Statement

The Labor Market Dashboard Calculator currently provides a fixed tree structure: 2 genders, 16 industries per gender, and 10 IT subcategories per gender (55 nodes total). Users cannot customize this structure to match their specific analytical needs.

**From the user's perspective:**

"As an analyst, I want to add industries or subcategories that are not in the default dataset -- for example, splitting 'Промисловість' into sub-sectors, or adding a new emerging industry. I also want to remove industries that are irrelevant to my scenario. Right now, I can only adjust percentages of the pre-defined categories, which limits the depth and relevance of my 'what-if' modeling."

**Why this is important now:**

- The dashboard has reached feature maturity for its core interaction model (sliders, pie charts, auto-balance). The next logical step is structural flexibility -- letting users shape the tree itself, not just tune its values.
- Multiple PRD-defined industries (agriculture, trade, transport, education, health, construction, finance, government/defense) have detailed subcategory breakdowns in the PRD data (Section 6) but are currently implemented as leaf nodes. Users modeling sector-specific scenarios (e.g., "what if healthcare shifts from hospitals to telemedicine?") cannot express this without subcategories.
- This is the first feature requiring client-side routing. Establishing the routing pattern now creates the foundation for future multi-page features.

**What happens if we do nothing:**

- Users are limited to percentage adjustments on a fixed 55-node tree, reducing the analytical value of the tool.
- Scenarios requiring structural changes (e.g., modeling a new tech sub-sector, splitting an industry) are impossible.
- The app remains a single-page monolith, making future feature additions (data export, scenario comparison) harder to introduce.

## Feature Description

A dedicated **Tree Configuration Page** accessible via a collapsible sidebar. This page displays the full tree structure (both genders) and provides controls to:

1. **Add a new industry** to a gender node (Level 2)
2. **Remove an existing industry** from a gender node (Level 2)
3. **Add a new subcategory** to any industry (Level 3)
4. **Remove an existing subcategory** from any industry (Level 3)

The page shares state with the main dashboard -- changes made on the configuration page are immediately reflected when the user navigates back to the dashboard.

### User Decisions (Resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Routing approach | Hash routing (`/#/config`) | GitHub Pages compatible, zero server config |
| Which nodes are configurable? | Industries (Level 2) and subcategories (Level 3) | User explicitly requested industry add/remove |
| Reset behavior | Custom nodes removed on reset | Consistent with existing behavior -- reset returns to default 55-node tree |
| Default percentage for new nodes | Equal redistribution among all siblings | Intuitive, maintains 100% sum automatically |
| Navigation UX | Collapsible sidebar toggle | Accessible from any page, does not consume header space |

### What the User Provides When Adding a New Node

When adding a **new industry** (Level 2):
- **Label** (required): Ukrainian-language name (e.g., "Кібербезпека")
- **Gender split** is implicit: the industry is added under a specific gender node, so `genderSplit` is `{ male: 100, female: 0 }` or `{ male: 0, female: 100 }` depending on the parent
- **Percentage**: Auto-calculated via equal redistribution. The new industry starts with an equal share alongside its siblings. The user can then fine-tune on the dashboard page.

When adding a **new subcategory** (Level 3):
- **Label** (required): Ukrainian-language name (e.g., "Blockchain розробка")
- **Gender split**: Inherited from parent industry node
- **Percentage**: Auto-calculated via equal redistribution among siblings

In both cases, the node ID is auto-generated following the existing kebab-case scheme: `{gender}-{kved-or-slug}` for industries, `{gender}-{kved}-{slug}` for subcategories. The slug is derived from the label via transliteration or simplification.

### Sidebar Navigation

A collapsible sidebar provides navigation between the two pages:
- **Dashboard** (default route: `/#/`)
- **Configuration** (route: `/#/config`)
- The sidebar collapses to an icon-only rail or hamburger toggle on smaller screens
- State (slider positions, custom nodes) is preserved across page navigation because the tree state lives above the router

### Configuration Page Layout

The configuration page displays the tree in an editable list format, organized by gender:
- Two sections: "Чоловіки" and "Жінки"
- Each section lists industries with their current percentage and absolute value
- Each industry can be expanded to show its subcategories (if any)
- "Add industry" button at the bottom of each gender section
- "Add subcategory" button within each expanded industry
- "Remove" button (trash icon or similar) on each industry and subcategory row
- Removal requires confirmation to prevent accidental deletion

## Success Criteria

1. User can add a new industry to either gender and see it appear on the dashboard with equal-redistributed percentage within 2 seconds of confirming the add action.
2. User can remove an industry (with or without subcategories) and see remaining siblings redistribute percentages correctly within 2 seconds.
3. User can add a subcategory to any industry (not just IT) and see it appear in the expandable tree on the dashboard.
4. User can remove a subcategory and see remaining subcategories redistribute percentages correctly.
5. User can navigate between Dashboard and Configuration pages via sidebar without losing any state (slider positions, custom nodes, balance mode).
6. "Reset to defaults" removes all custom nodes and restores the original 55-node tree.
7. All new UI elements meet the existing accessibility standards (WCAG touch targets >= 44x44px, proper heading hierarchy, ARIA labels).
8. Bundle size remains under 500KB gzipped (NFR-07) after adding the routing library and new page components.

## Acceptance Criteria

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

* Given the user navigates directly to `/#/config` (e.g., browser bookmark)
  When the page loads
  Then the configuration page renders correctly with the default tree state

### Adding Industries

* Given the user is on the configuration page viewing the "Чоловіки" section
  When they click "Add industry" and enter a label (e.g., "Кібербезпека")
  Then a new industry node appears under "Чоловіки" with a percentage equal to `100 / (N+1)` where N is the current number of industries, and all existing industry percentages are redistributed equally

* Given the user adds a new industry under "Чоловіки"
  When they navigate to the dashboard
  Then the new industry appears in the male tree panel with a slider and correct percentage

* Given there are industries under a gender node
  When a new industry is added
  Then its node ID follows the kebab-case convention (`male-{slug}` or `female-{slug}`)

* Given a new industry is added
  When the pie chart for that gender renders
  Then the new industry appears as a slice with a dynamically assigned color

### Adding Subcategories

* Given the user is on the configuration page and expands an industry (e.g., "Торгівля")
  When they click "Add subcategory" and enter a label (e.g., "Онлайн-торгівля")
  Then a new subcategory appears under that industry with equally redistributed percentages among all subcategories

* Given an industry previously had no subcategories (leaf node)
  When the user adds the first subcategory
  Then the industry becomes an expandable node on the dashboard, and the single subcategory receives 100% of the parent

* Given a new subcategory is added to an industry
  When the user navigates to the dashboard and expands that industry
  Then the subcategory appears with a slider and its mini pie chart includes the new subcategory

### Removing Industries

* Given the user is on the configuration page and an industry has no subcategories
  When they click "Remove" on that industry and confirm the action
  Then the industry is removed and remaining industries redistribute percentages via equal redistribution

* Given the user is on the configuration page and an industry has subcategories
  When they click "Remove" on that industry and confirm the action
  Then the industry and all its subcategories are removed, and remaining industries redistribute percentages

* Given there is only one industry remaining under a gender
  When the user attempts to remove it
  Then the removal is blocked with an informative message (a gender node must have at least one industry)

* Given an industry was removed
  When the user navigates to the dashboard
  Then the removed industry no longer appears in the tree panel or pie chart

### Removing Subcategories

* Given an industry has multiple subcategories
  When the user removes one subcategory and confirms
  Then the subcategory is removed and remaining subcategories redistribute percentages

* Given an industry has exactly one subcategory remaining
  When the user removes it and confirms
  Then the industry becomes a leaf node (no expandable children) on the dashboard

### Reset Behavior

* Given the user has added custom industries and subcategories
  When they click "Reset to defaults" (from the dashboard header)
  Then all custom nodes are removed and the tree returns to the default 55-node structure

* Given the user is on the configuration page after a reset
  When the page renders
  Then only the default 16 industries per gender and 10 IT subcategories per gender are shown

### Percentage Redistribution

* Given the balance mode is "auto"
  When a new node is added to a sibling group
  Then all siblings (including the new node) receive equal percentages summing to exactly 100.0%

* Given the balance mode is "free"
  When a new node is added to a sibling group
  Then all siblings (including the new node) receive equal percentages (sum may differ from 100%)

* Given a node is removed from a sibling group in auto mode
  When redistribution occurs
  Then remaining siblings receive equal redistribution of the removed node's percentage, summing to exactly 100.0%

### Confirmation Dialogs

* Given the user clicks "Remove" on any node
  When the confirmation dialog appears
  Then it clearly states the node name and warns that subcategories (if any) will also be removed

* Given the confirmation dialog is shown
  When the user cancels
  Then no changes are made to the tree

### Accessibility

* Given the configuration page is rendered
  When a screen reader navigates the page
  Then all interactive elements have appropriate ARIA labels, the heading hierarchy is correct (`h1` for page title, `h2` for gender sections), and add/remove buttons have descriptive labels

* Given the sidebar navigation is rendered
  When the user navigates via keyboard
  Then all links and toggle buttons are focusable and operable via Enter/Space keys

## Out of Scope

- **Editing existing node labels or KVED codes**: This task covers add/remove only, not rename/edit
- **Reordering nodes**: Drag-and-drop or manual sort order is not included
- **Persistent storage**: Custom tree modifications are not saved to localStorage or any backend; they exist only in the current session (closing the tab loses custom nodes)
- **Adding Level 4+ nodes**: Subcategories cannot have sub-subcategories; the tree remains max 3 levels deep
- **Bulk import/export of tree structure**: No JSON/CSV import for tree configuration
- **Gender-level modification**: Users cannot add/remove/rename gender nodes (Male/Female are structural)
- **Root node modification on config page**: Total population is already managed via the dashboard header input
- **Responsive mobile layout for config page**: Desktop and tablet (1024px+) only for v1; mobile optimization deferred
- **Undo/redo for add/remove operations**: No history stack for structural changes
- **Custom color assignment for new industries**: Colors are auto-assigned; user cannot pick colors
- **Per-gender independent default percentages for new nodes**: New nodes get equal redistribution, not PRD-sourced statistical defaults
- **Modifying the default tree data file**: `defaultTree.ts` remains unchanged; custom nodes are runtime-only state

## Open Questions (All Resolved)

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | Routing approach: hash vs history? | PO | Hash routing (`/#/config`) -- GitHub Pages compatible |
| 2 | Which industries can have subcategories? | PO | ALL industries (expanded to include industry add/remove too) |
| 3 | Max subcategories per industry? | PO | No hard limit in v1 (UX degrades naturally beyond ~15-20 items) |
| 4 | Reset behavior for custom nodes? | PO | Custom nodes removed on reset |
| 5 | Navigation UX? | PO | Collapsible sidebar toggle |
| 6 | Default percentage for new nodes? | PO | Equal redistribution among all siblings |
| 7 | State persistence across navigation? | PO | Yes -- state lives above the router (arch-context confirmed this is natural) |
| 8 | Routing library choice? | TL | Deferred to TL -- `react-router-dom` (standard) vs `wouter` (lightweight) |

## Recommendations

### For TL (Technical Design)

- The routing library decision (react-router-dom vs wouter vs TanStack Router) should be made during TL design, weighing bundle size (NFR-07) against feature needs. Hash routing is confirmed regardless of library choice.
- Consider whether the sidebar should be a new top-level layout component wrapping both pages, or integrated into the existing App.tsx composition root.
- The `ADD_INDUSTRY`, `REMOVE_INDUSTRY`, `ADD_SUBCATEGORY`, `REMOVE_SUBCATEGORY` actions need clear payload definitions. Node ID generation (slug from Ukrainian label) needs a deterministic algorithm.
- Equal redistribution on add means `largestRemainder([100/(N+1), ...], 100, 1)` for all siblings. On remove, it means redistributing the removed node's share equally to remaining siblings, then applying `largestRemainder`.

### For DEV (Implementation)

- The configuration page should follow the composition root pattern: a `ConfigPage.tsx` that composes smaller components (`ConfigGenderSection`, `ConfigIndustryRow`, `AddNodeForm`, etc.), each under 200 lines.
- New reducer actions must extend the existing `TreeAction` discriminated union in `src/types/actions.ts`.
- The `genderSplit` for new nodes is deterministic (100/0 or 0/100 based on parent gender), so the user does not need to provide it.

### For QA (Test Planning)

- Key edge cases to test: adding the first subcategory to a leaf industry, removing the last subcategory (industry becomes leaf), removing an industry with subcategories, attempting to remove the last industry under a gender.
- Verify that pie charts correctly reflect structural changes (new slices appear, removed slices disappear).
- Verify that navigating between pages preserves all state including custom nodes.
- Verify reset removes custom nodes and restores exact default tree.
