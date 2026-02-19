# Architecture Overview

## System Components

### Labor Market Dashboard (SPA)

Single-page application for interactive labor market modeling.

**Location**: `apps/labor-market-dashboard/`
**Package**: `@template/labor-market-dashboard`

| Component | Technology | Purpose |
|-----------|------------|---------|
| App Shell | React 19 / Vite 6 | Component framework, fast HMR (per ADR-0001) |
| State Management | React useReducer | Tree state via `treeReducer`, auto-balance logic (per ADR-0004) |
| Visualization | Recharts | Pie charts (per-gender industry breakdown) and grouped bar chart (cross-gender comparison) with tooltips |
| Styling | Tailwind CSS v4 | CSS-first config, `@tailwindcss/vite` plugin (per ADR-0002) |
| Hosting | GitHub Pages | Static SPA, no backend |

### Data Architecture

Tree-based model with 3 levels of depth:

```
Root: Total Employed (13,500k)
  ├─ Level 1: Gender (Male 52.66% / Female 47.34%)
  │   ├─ Level 2: Industries (16 KVED sectors per gender)
  │   │   └─ Level 3: Subcategories (10 IT roles per gender; other industries are leaves)
```

**55 total nodes**: 1 root + 2 gender + 32 industry + 20 IT subcategory

Default data is a pre-computed, hardcoded `TreeNode` literal in `src/data/defaultTree.ts`. No runtime calculation. Percentages are the source of truth; absolute values are derived via `Math.round(parent.absoluteValue * percentage / 100)`.

**Rounding convention**: Largest-remainder method (Hamilton's method) ensures sibling percentages sum to exactly 100.0 at 1 decimal place. Implemented in `src/data/dataHelpers.ts` as `largestRemainder()`.

**Gender split**: Derived from weighted industry data (52.66% male / 47.34% female), not the PRD's approximate 52/48. This is the mathematically consistent value.

**Node ID scheme**: Flat, kebab-case identifiers -- `root`, `gender-male`, `gender-female`, `{gender}-{kved}` (e.g., `male-g`), `{gender}-{kved}-{slug}` (e.g., `male-j-software-dev`).

Key interfaces (implemented in `src/types/tree.ts`):
- `GenderSplit` — `{ male: number; female: number }` (both required, sum = 100 at runtime)
- `BalanceMode` — `'auto' | 'free'` union type for slider behavior
- `TreeNode` — recursive node with id, label, percentage, absoluteValue, genderSplit, children, defaultPercentage, isLocked, optional kvedCode
- `DashboardState` — totalPopulation, balanceMode (BalanceMode), tree (single TreeNode root)

### Auto-Balance Algorithm

Implemented in `src/utils/calculations.ts` as `autoBalance()`. When a slider changes in auto-balance mode:

1. Separate locked, changed, and unlocked siblings
2. Clamp changed value to `[0, 100 - lockedSum]`
3. Distribute remaining to unlocked siblings:
   - Proportionally if `oldUnlockedSum > 0`
   - Equally if all unlocked are at 0%
4. Apply `largestRemainder()` for exact 100.0 sum at 1 decimal place
5. Absolute values recalculated recursively from root via `recalcAbsoluteValues()`

Free mode: independent sliders, sum may deviate from 100% (tracked by `getSiblingDeviation()`).

Lock guard: `canToggleLock()` prevents locking the last unlocked sibling in any group.

Mode switch normalization: switching free-to-auto triggers `normalizeGroup()` on all sibling groups recursively.

### Shared Config Package

**Location**: `packages/config/`
**Package**: `@template/config`

Centralized TypeScript, ESLint, and Prettier configs shared across the monorepo.

| Config Type | Variants | Extension Pattern |
|-------------|----------|-------------------|
| TypeScript | `base`, `next`, `nest`, `react` | `"extends": "@template/config/typescript/{variant}"` |
| ESLint | `base`, `next`, `nest`, `react` | `require.resolve("@template/config/eslint/{variant}")` |
| Prettier | shared | `"@template/config/prettier"` |

## Tech Stack

| Category | Technology | Version | Rationale | ADR |
|----------|------------|---------|-----------|-----|
| Framework | React | 19.x | Component model, hooks, ecosystem | ADR-0001 |
| Language | TypeScript | 5.7+ (strict) | Type safety for tree operations | ADR-0001 |
| Build | Vite | 6.x | Fast HMR, optimal bundle, ESM-native | ADR-0001 |
| Styles | Tailwind CSS | 4.x | CSS-first config, no JS config file | ADR-0002 |
| Linting | ESLint | 8.x (legacy format) | Monorepo consistency, `.eslintrc.cjs` | ADR-0003 |
| Charts | Recharts | 2.15.x | Pie chart support, animations, SVG rendering | ADR-0005 |
| State | React useReducer | 19.x (built-in) | Lightweight tree state, exported reducer for testability | ADR-0004 |
| Tests | Vitest + RTL | 3.x | Unit and integration tests | -- |
| CI/CD | GitHub Actions | TBD | Auto-deploy on push to main | -- |
| Hosting | GitHub Pages | -- | Free, static SPA | -- |

## Module Inventory

### Implemented

| Module | Location | Responsibility | Since |
|--------|----------|----------------|-------|
| App Shell | `apps/labor-market-dashboard/src/App.tsx` | Composition root: wires useTreeState to DashboardHeader + 2 GenderSections. No business logic (named export) | task-001, task-008 |
| Entry Point | `apps/labor-market-dashboard/src/main.tsx` | React 19 StrictMode bootstrap (named import of App) | task-001, task-007 |
| Tailwind Entry | `apps/labor-market-dashboard/src/index.css` | `@import "tailwindcss"` (v4 CSS-first) | task-001 |
| Vite Config | `apps/labor-market-dashboard/vite.config.ts` | React + Tailwind plugins, `@` alias | task-001 |
| TS Config (React) | `packages/config/typescript/react.json` | Shared React/Vite TypeScript config | task-001 |
| ESLint Config (React) | `packages/config/eslint/react.js` | Shared React ESLint config | task-001 |
| Types (tree.ts) | `apps/labor-market-dashboard/src/types/tree.ts` | TreeNode, GenderSplit, BalanceMode, DashboardState interfaces | task-002 |
| Types (barrel) | `apps/labor-market-dashboard/src/types/index.ts` | Type-only barrel re-export | task-002 |
| Vitest Config | `apps/labor-market-dashboard/vitest.config.ts` | Test runner config with `@` path alias | task-002 |
| Type Tests | `apps/labor-market-dashboard/src/__tests__/types/tree.test.ts` | Type-safety tests (11 cases) | task-002 |
| Default Tree | `apps/labor-market-dashboard/src/data/defaultTree.ts` | Ukraine labor market default data (55 nodes, hardcoded TreeNode literal) | task-003 |
| Data Helpers | `apps/labor-market-dashboard/src/data/dataHelpers.ts` | `largestRemainder()` rounding utility (Hamilton's method) | task-003 |
| Data Barrel | `apps/labor-market-dashboard/src/data/index.ts` | Value re-exports for `defaultTree` and `largestRemainder` | task-003 |
| Data Helper Tests | `apps/labor-market-dashboard/src/__tests__/data/dataHelpers.test.ts` | `largestRemainder` edge cases (8 tests) | task-003 |
| Default Tree Tests | `apps/labor-market-dashboard/src/__tests__/data/defaultTree.test.ts` | Structure, math, completeness, DashboardState compatibility (26 tests) | task-003 |
| Action Types | `apps/labor-market-dashboard/src/types/actions.ts` | TreeAction discriminated union (5 action types for useReducer) | task-004 |
| Tree Utils | `apps/labor-market-dashboard/src/utils/treeUtils.ts` | Immutable tree traversal/update helpers (find, update, collect), SiblingInfo interface | task-004 |
| Calculations | `apps/labor-market-dashboard/src/utils/calculations.ts` | autoBalance, normalizeGroup, recalcAbsoluteValues, getSiblingDeviation, canToggleLock | task-004 |
| Utils Barrel | `apps/labor-market-dashboard/src/utils/index.ts` | Value + type re-exports for utils module | task-004 |
| useTreeState Hook | `apps/labor-market-dashboard/src/hooks/useTreeState.ts` | useReducer-based state: treeReducer + useTreeState hook + initialState | task-004 |
| Hooks Barrel | `apps/labor-market-dashboard/src/hooks/index.ts` | Value re-exports for hooks module | task-004 |
| Tree Utils Tests | `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts` | find, update, immutability, sibling info (15 tests) | task-004 |
| Calculations Tests | `apps/labor-market-dashboard/src/__tests__/utils/calculations.test.ts` | auto-balance, normalize, recalc, deviation, lock guard (28 tests) | task-004 |
| useTreeState Tests | `apps/labor-market-dashboard/src/__tests__/hooks/useTreeState.test.ts` | All 5 actions, cascading recalc, performance (19 tests) | task-004 |
| Slider | `apps/labor-market-dashboard/src/components/Slider.tsx` | Controlled range input + numeric input + lock toggle (first UI component) | task-005 |
| Components Barrel | `apps/labor-market-dashboard/src/components/index.ts` | Barrel re-export: 10 components, value + type exports | task-005, task-008 |
| Format Utility | `apps/labor-market-dashboard/src/utils/format.ts` | `formatAbsoluteValue()` (Ukrainian "тис." abbreviation), `formatPercentage()` (1 decimal), `formatPopulation()` (full number with space-separated thousands), manual `formatWithSpaces()` | task-005, task-008 |
| Test Setup | `apps/labor-market-dashboard/src/__tests__/setup.ts` | Global `@testing-library/jest-dom/vitest` matcher registration | task-005 |
| Format Tests | `apps/labor-market-dashboard/src/__tests__/utils/format.test.ts` | 19 tests: formatAbsoluteValue + formatPercentage + formatPopulation edge cases | task-005, task-008 |
| Slider Tests | `apps/labor-market-dashboard/src/__tests__/components/Slider.test.tsx` | 22 tests: rendering, range input, numeric input, lock toggle, a11y, prop sync | task-005 |
| Chart Colors | `apps/labor-market-dashboard/src/data/chartColors.ts` | KVED-to-hex color palette (16 industries), gender colors, ghost/overflow/default colors | task-006 |
| Chart Data Utils | `apps/labor-market-dashboard/src/utils/chartDataUtils.ts` | `toChartData()`, `getNodeColor()`, `generateSubcategoryColors()`, `toBarChartData()`, PieDataEntry and BarChartDataEntry interfaces | task-006, task-012 |
| ChartTooltip | `apps/labor-market-dashboard/src/components/ChartTooltip.tsx` | Custom Recharts tooltip with Ukrainian formatting (reuses format.ts utilities) | task-006 |
| ChartLegend | `apps/labor-market-dashboard/src/components/ChartLegend.tsx` | Scrollable legend with semantic `ul/li` markup and color swatches | task-006 |
| PieChartPanel | `apps/labor-market-dashboard/src/components/PieChartPanel.tsx` | Main pie chart wrapper (React.memo, Recharts PieChart, size variants, ghost slice, sr-only table) | task-006 |
| Chart Color Tests | `apps/labor-market-dashboard/src/__tests__/data/chartColors.test.ts` | 8 tests: palette completeness, valid hex, no duplicates | task-006 |
| Chart Data Utils Tests | `apps/labor-market-dashboard/src/__tests__/utils/chartDataUtils.test.ts` | 21 tests: toChartData, getNodeColor, generateSubcategoryColors, toBarChartData | task-006, task-012 |
| ChartTooltip Tests | `apps/labor-market-dashboard/src/__tests__/components/ChartTooltip.test.tsx` | 5 tests: rendering, null states, ghost slice handling | task-006 |
| ChartLegend Tests | `apps/labor-market-dashboard/src/__tests__/components/ChartLegend.test.tsx` | 5 tests: list items, labels, semantic markup, maxHeight | task-006 |
| PieChartPanel Tests | `apps/labor-market-dashboard/src/__tests__/components/PieChartPanel.test.tsx` | 11 tests: accessibility, legend, free mode, size variants | task-006 |
| GenderBarChart | `apps/labor-market-dashboard/src/components/GenderBarChart.tsx` | Grouped bar chart comparing male/female by industry (React.memo, Recharts BarChart, sr-only table) | task-012 |
| BarChartTooltip | `apps/labor-market-dashboard/src/components/BarChartTooltip.tsx` | Custom bar chart tooltip showing both genders per industry (absolute + percentage) | task-012 |
| GenderBarChart Tests | `apps/labor-market-dashboard/src/__tests__/components/GenderBarChart.test.tsx` | 4 tests: figure role, sr-only table rows, formatted values, empty children | task-012 |
| BarChartTooltip Tests | `apps/labor-market-dashboard/src/__tests__/components/BarChartTooltip.test.tsx` | 4 tests: inactive null, empty payload null, gender rows, color swatches | task-012 |
| ModeToggle | `apps/labor-market-dashboard/src/components/ModeToggle.tsx` | Auto/free balance mode toggle switch (role="switch", aria-checked, 59 lines) | task-008 |
| ResetButton | `apps/labor-market-dashboard/src/components/ResetButton.tsx` | Reset button with browser confirm() guard (51 lines) | task-008 |
| DashboardHeader | `apps/labor-market-dashboard/src/components/DashboardHeader.tsx` | Sticky header bar: h1 title, controlled population input, ModeToggle + ResetButton composition (109 lines) | task-008 |
| GenderSection | `apps/labor-market-dashboard/src/components/GenderSection.tsx` | Container pairing TreePanel + PieChartPanel per gender (44 lines) | task-008 |
| ModeToggle Tests | `apps/labor-market-dashboard/src/__tests__/components/ModeToggle.test.tsx` | 13 tests: mode label, dispatch SET_BALANCE_MODE, role="switch", aria-checked | task-008 |
| ResetButton Tests | `apps/labor-market-dashboard/src/__tests__/components/ResetButton.test.tsx` | 9 tests: confirm dialog, dispatch on OK, no-op on cancel, a11y, keyboard | task-008 |
| DashboardHeader Tests | `apps/labor-market-dashboard/src/__tests__/components/DashboardHeader.test.tsx` | 16 tests: title, population input dispatch/revert, ModeToggle/ResetButton composition | task-008 |
| GenderSection Tests | `apps/labor-market-dashboard/src/__tests__/components/GenderSection.test.tsx` | 7 tests: TreePanel + PieChartPanel pairing, aria-labels, industry data | task-008 |
| TreePanel | `apps/labor-market-dashboard/src/components/TreePanel.tsx` | Single-gender tree container: expand/collapse state (local useState), gender heading, industry rows, deviation warnings (124 lines) | task-007, task-008 |
| TreeRow | `apps/labor-market-dashboard/src/components/TreeRow.tsx` | Recursive tree row: React.memo, chevron toggle, indentation, embedded Slider, canToggleLock, deviation warnings, mini subcategory pie charts | task-007, task-008 |
| TreeRow Tests | `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx` | 32 tests: rendering, chevron, expand/collapse, indentation, Slider, a11y, canLock, deviation warnings, mini pie charts | task-007, task-008 |
| TreePanel Tests | `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx` | 16 tests: single-gender API, industry nodes, expand/collapse, deviation warnings, a11y | task-007, task-008 |

### Planned (Not Yet Implemented)

All components from the initial roadmap are now implemented. Remaining work is polish, animations, and deployment (per PRD milestones M4+).

## Security Architecture

- No backend, no authentication required
- No user data stored (pure client-side SPA)
- No API calls to external services
- All data is static, bundled with the app

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Slider update latency | < 100ms |
| NFR-02 | Lighthouse Performance | > 90 |
| NFR-03 | Lighthouse Accessibility | > 90 |
| NFR-04 | Desktop + Tablet responsive | 1024px+ |
| NFR-05 | Mobile responsive | 320px+ |
| NFR-06 | Browser support | Chrome, Firefox, Safari, Edge |
| NFR-07 | Bundle size | < 500KB gzipped |
| NFR-08 | Animation framerate | 60fps |

## Architectural Decisions

| ADR | Title | Status | Triggered By |
|-----|-------|--------|--------------|
| [ADR-0001](decisions/adr-0001-adopt-react-vite-typescript-frontend-stack.md) | Adopt React 19 + Vite 6 + TypeScript 5.7 as frontend stack | accepted | task-001 |
| [ADR-0002](decisions/adr-0002-use-tailwind-css-v4-css-first-config.md) | Use Tailwind CSS v4 with CSS-first configuration | accepted | task-001 |
| [ADR-0003](decisions/adr-0003-maintain-eslint-v8-legacy-config-format.md) | Maintain ESLint v8 legacy config format across monorepo | accepted | task-001 |
| [ADR-0004](decisions/adr-0004-use-react-usereducer-for-state-management.md) | Use React useReducer for dashboard state management | accepted | task-004 |
| [ADR-0005](decisions/adr-0005-use-recharts-2x-for-pie-chart-visualization.md) | Use Recharts 2.x for pie chart visualization | accepted | task-006 |

## Development Conventions

### Vitest Configuration Pattern

Vitest is the test runner for all apps in the monorepo. Each app that has tests must have its own `vitest.config.ts` (separate from `vite.config.ts`) with these conventions:

| Setting | Value | Rationale |
|---------|-------|-----------|
| Config import | `vitest/config` (not `vite`) | Provides proper `test` field typing |
| `@` path alias | Replicated from `vite.config.ts` | Tests can use the same `@/` imports as source code |
| `globals` | `false` | Explicit imports (`describe`, `it`, `expect` from `vitest`) avoid global namespace pollution |
| `environment` | `'jsdom'` | Required for React component tests; existing pure-logic tests are unaffected |
| `setupFiles` | `['./src/__tests__/setup.ts']` | Registers `@testing-library/jest-dom/vitest` matchers globally |
| `css` | `false` | Disables CSS processing in tests (avoids Tailwind v4 + jsdom conflicts) |
| Plugins | None -- do not include `react()` or `tailwindcss()` in vitest config | Avoid unnecessary build overhead |

The `vitest.config.ts` file must be added to `tsconfig.node.json`'s `include` array for ESLint type-checking to work.

The `test` script in each app's `package.json` should be `vitest run` (single run, not watch mode).

### Test Directory Convention

Tests live in `src/__tests__/` mirroring the source directory structure:

```
src/
  types/
    tree.ts
    index.ts
  data/
    defaultTree.ts
    dataHelpers.ts
    index.ts
  __tests__/
    types/
      tree.test.ts
    data/
      defaultTree.test.ts
      dataHelpers.test.ts
```

- Test files use the `.test.ts` extension (`.test.tsx` for component tests with JSX)
- Directory structure under `__tests__/` mirrors the `src/` structure (e.g., `src/__tests__/types/` for `src/types/`)
- Type-only test imports use `import type { ... }` syntax
- Each test file imports from the corresponding source using the `@/` path alias

### Component Testing Convention

Component tests use React Testing Library (RTL) with these patterns:

| Library | Version | Purpose |
|---------|---------|---------|
| `@testing-library/react` | 16.x | `render`, `screen`, `cleanup`, `fireEvent` |
| `@testing-library/user-event` | 14.x | Realistic user interactions (`userEvent.setup()`) |
| `@testing-library/jest-dom` | 6.x | Extended DOM matchers (`toBeDisabled`, `toHaveAttribute`) |
| `jsdom` | 25.x | DOM environment for Vitest |

- **`userEvent.setup()`** preferred over `fireEvent` for all interactions except range input `onChange`
- **`afterEach(cleanup)`** required when `globals: false`
- **`makeProps()` factory pattern** with `Partial<Props>` overrides for test readability
- **`vi.fn()` for dispatch mock** -- tests verify component behavior in isolation, no real reducer
- **Test setup file**: `src/__tests__/setup.ts` imports `@testing-library/jest-dom/vitest` (note: the `/vitest` entry point)

### Controlled Component Pattern

All interactive dashboard components follow the controlled component pattern established by Slider:

- No internal state for the primary value (percentage). Value always equals props.
- Minimal local state only where needed (e.g., `inputValue: string` for mid-typing text input).
- Dispatch `TreeAction` upward to the reducer; parent re-renders with new props.
- `useEffect` for prop sync when external changes arrive (e.g., sibling auto-balance).
- No `useCallback` on handlers unless expensive child components benefit from referential stability.

### Read-Only Visualization Pattern

Visualization components (PieChartPanel, ChartTooltip, ChartLegend, GenderBarChart, BarChartTooltip) follow a distinct pattern from interactive components:

- **No internal data state**: Receive tree data as props (`TreeNode[]` as `nodes` for pie charts; two `TreeNode` props for bar chart). No dispatch.
- **`React.memo`**: Wrapped via named function pattern `memo(function ComponentName(...))` for devtools clarity. Prevents re-renders when parent re-renders but visualization data has not changed.
- **Data transformation outside component**: Utility functions (`toChartData()` for pie, `toBarChartData()` for bar) in `utils/` convert tree data to chart-library-specific formats. Keeps mapping logic testable without React.
- **Reuse formatting utilities**: Custom tooltip/legend components reuse `formatAbsoluteValue`/`formatPercentage` from `utils/format.ts` for Ukrainian number formatting.
- **Accessibility**: `<figure role="img" aria-label={...}>` wrapper + `sr-only` data `<table>` for screen readers. Color swatches use `aria-hidden="true"`.

### Composition Root Pattern

App.tsx is a pure **composition root** that wires `useTreeState()` and distributes state/dispatch to child components:

- No business logic, no conditional rendering, no local state
- `DashboardHeader` (sticky) at top with population input, mode toggle, reset button
- `<main>` with responsive `grid grid-cols-1 lg:grid-cols-2 gap-6` containing 2 `GenderSection` instances
- Gender nodes accessed via `state.tree.children[0]` (male) and `state.tree.children[1]` (female)
- No direct tests -- all behavior verified via child component test suites

### Dashboard Header Pattern

DashboardHeader composes the sticky top bar:

- **`<h1>` for title**: Required for WCAG 1.3.1 heading hierarchy (gender section `<h2>` elements need a parent `<h1>`)
- **Controlled population input**: Same pattern as Slider -- local `inputValue` string state, `isEditing` guard, `useEffect` prop sync, commit on blur/Enter
- **`formatPopulation()`**: Full number with space-separated thousands (not abbreviated) for the input field
- **Sticky positioning**: `sticky top-0 z-10` with white background and bottom border

### GenderSection Pattern

GenderSection is a thin container (44 lines) pairing a gender's TreePanel + PieChartPanel:

- Receives `genderNode` (single gender TreeNode), passes to both children
- PieChartPanel receives `nodes={genderNode.children}` with `INDUSTRY_COLORS` color map
- Layout: vertical flex (`flex-col gap-4`)

### Container + Recursive Component Pattern

TreePanel + TreeRow establish the **container + recursive child** pattern for hierarchical tree navigation:

- **TreePanel (single-gender container)**: Receives `genderNode: TreeNode` (one gender), NOT the full tree root. Manages expand/collapse state via `useState<Set<string>>` -- UI-only state, NOT in the reducer (per ADR-0004). Renders gender heading (`<h2>`), percentage + absolute value summary, optional deviation warning (free mode), and delegates industry rows to TreeRow.
- **TreeRow (recursive, `React.memo`)**: Renders a single node with chevron toggle + embedded Slider. Recursively renders children when expanded. Also renders mini subcategory pie charts and deviation warnings for expanded nodes. `memo(function TreeRow(...))` follows the PieChartPanel named function pattern.
- **`useCallback` on toggle handler**: Required because TreeRow is memoized -- `handleToggleExpand` uses `setExpandedIds(prev => ...)` functional form to avoid stale closures.
- **Expand initialization**: `collectExpandableIds()` walks the gender node's children once on mount (lazy `useState` initializer). All expandable nodes start expanded.
- **Gender nodes are section headers**: Gender nodes are rendered by GenderSection, not TreePanel. TreePanel starts at industry level.
- **Indentation**: `paddingLeft: ${depth * 24}px` via inline style. Leaf nodes render a spacer `<div>` matching chevron dimensions for alignment.
- **Accessibility**: `aria-expanded` on chevron buttons, `aria-label` with "Expand/Collapse {label}", `<section aria-label>` for gender regions, `<h1>`/`<h2>` heading hierarchy.

### Deviation Warning Pattern (Free Mode)

When `balanceMode === 'free'`, inline warnings appear when sibling percentages deviate from 100%:

- **Gender-level** (TreePanel): `getSiblingDeviation(genderNode)` checks industry percentages. Warning rendered as `<p role="status">` with amber-600 text.
- **Subcategory-level** (TreeRow): `getSiblingDeviation(node)` for expanded nodes with children.
- **Format**: `"Сума: 95.0% (-5.0%)"` or `"Сума: 108.3% (+8.3%)"` using `formatPercentage()`.
- **Auto mode**: No warnings -- deviation is always 0.

### Mini Subcategory Pie Charts

TreeRow renders a mini `PieChartPanel` for expanded nodes with children:

- **Trigger**: `isExpanded && hasChildren` (currently only IT/KVED J nodes have subcategories)
- **Size**: `size="mini"` (200px height), `showLegend={false}`
- **Colors**: `buildSubcategoryColorMap(node)` uses `generateSubcategoryColors()` with opacity-based shades of the parent industry color
- **Indentation**: `paddingLeft: ${(depth + 1) * 24}px` matches child row indentation

### Recharts Integration Convention

Recharts 2.15.x is the charting library for all chart visualizations (per ADR-0005):

- **Pie chart components**: `PieChart`, `Pie`, `Cell`, `Tooltip`, `ResponsiveContainer`
- **Bar chart components**: `BarChart`, `Bar`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer`
- **Color mapping (pie)**: `<Cell fill={entry.color}>` requires hex strings -- use `INDUSTRY_COLORS` map from `src/data/chartColors.ts`, not CSS custom properties
- **Color mapping (bar)**: Uses `GENDER_COLORS` (blue/pink) for male/female bars, not `INDUSTRY_COLORS` -- bars are colored by gender, not by industry
- **Custom tooltips**: `<Tooltip content={<ChartTooltip />}>` for pie charts; `<Tooltip content={<BarChartTooltip />}>` for bar charts. Recharts passes `active` and `payload` props automatically.
- **Animation**: 300ms with `ease-out` easing. Recharts interrupts previous animations gracefully during rapid updates.
- **Ghost slice (free mode, pie only)**: When percentages sum < 100%, a gray "Нерозподілено" entry is appended to chart data. When > 100%, an overflow badge is shown. Ghost slices excluded from legend and sr-only table.
- **Testing**: `ResizeObserver` must be mocked in jsdom. Tests focus on DOM structure (figure, ARIA, data table, legend), not SVG geometry.

## Known Limitations

- Data accuracy: all figures after 2021 are estimates with varying methodology
- No data export (JSON/CSV/PDF) in v1
- No scenario save/load in v1
- No multi-language support in v1
- No side-by-side scenario comparison in v1
