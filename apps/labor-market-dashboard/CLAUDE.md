# Labor Market Dashboard

React + Vite + TypeScript + Tailwind CSS v4 single-page application.

**Package**: `@template/labor-market-dashboard`

## Tech Stack

- React 19, Vite 6, TypeScript 5.7 (strict)
- Tailwind CSS v4 (CSS-first config, `@tailwindcss/vite` plugin)
- ESLint v8 legacy format (`.eslintrc.cjs`)

## Commands

```bash
pnpm dev --filter @template/labor-market-dashboard   # Dev server (Vite, http://localhost:5173)
pnpm build --filter @template/labor-market-dashboard  # Type-check + bundle
pnpm lint --filter @template/labor-market-dashboard   # ESLint
```

## App Structure

```
apps/labor-market-dashboard/
  index.html              # HTML entry point (lang="uk")
  vite.config.ts          # Vite config (react + tailwindcss plugins, @ alias)
  vitest.config.ts        # Vitest config (separate from vite, @ alias, jsdom env)
  tsconfig.json           # Extends @template/config/typescript/react
  tsconfig.node.json      # For vite.config.ts + vitest.config.ts
  .eslintrc.cjs           # Extends @template/config/eslint/react
  package.json            # type: "module", @template/config as workspace:*
  src/
    main.tsx              # React entry point (StrictMode, named import of App)
    App.tsx               # Composition root (named export, wires useTreeState to DashboardHeader + 2 GenderSections)
    App.css               # App-specific styles (placeholder)
    index.css             # Tailwind entry + custom range input CSS
    vite-env.d.ts         # Vite client type declarations
    components/
      DashboardHeader.tsx # Sticky header bar (h1 title, population input, ModeToggle, ResetButton)
      GenderSection.tsx   # Container pairing TreePanel + PieChartPanel per gender
      ModeToggle.tsx      # Auto/free balance mode toggle switch (role="switch")
      ResetButton.tsx     # Reset button with browser confirm() guard
      Slider.tsx          # Interactive slider (controlled, range + numeric + lock)
      PieChartPanel.tsx   # Pie chart visualization (React.memo, Recharts, read-only)
      ChartTooltip.tsx    # Custom tooltip for pie chart slices (Ukrainian formatting)
      ChartLegend.tsx     # Scrollable legend with color swatches (semantic ul/li)
      TreePanel.tsx       # Single-gender tree container (expand/collapse state, deviation warnings)
      TreeRow.tsx         # Recursive tree row (React.memo, chevron, indentation, Slider, mini pie charts)
      index.ts            # Barrel: 10 components + export type for props interfaces
    types/
      tree.ts             # Core data model: TreeNode, GenderSplit, BalanceMode, DashboardState
      actions.ts          # TreeAction discriminated union (5 action types for useReducer)
      index.ts            # Barrel re-export (export type)
    data/
      defaultTree.ts      # Complete TreeNode tree constant (55 nodes, ~600 lines)
      dataHelpers.ts      # largestRemainder() utility (Hamilton's method rounding)
      chartColors.ts      # Color palette constants (KVED-to-hex, gender, ghost, overflow)
      index.ts            # Barrel re-export (value exports)
    utils/
      treeUtils.ts        # Immutable tree traversal/update helpers, SiblingInfo interface
      calculations.ts     # Auto-balance, normalization, recalc, deviation, lock guard
      format.ts           # Ukrainian number formatting (formatAbsoluteValue, formatPercentage, formatPopulation)
      chartDataUtils.ts   # TreeNode-to-Recharts data transform, ghost slice logic, subcategory colors
      index.ts            # Barrel re-export (value + type exports)
    hooks/
      useTreeState.ts     # useReducer-based state management (treeReducer + useTreeState hook)
      index.ts            # Barrel re-export
    __tests__/
      setup.ts               # Test setup: imports @testing-library/jest-dom/vitest matchers
      types/
        tree.test.ts         # Type-safety tests (expectTypeOf + runtime construction)
      data/
        defaultTree.test.ts  # 26 tests: structure, math, completeness, DashboardState
        dataHelpers.test.ts  # 8 tests: largestRemainder edge cases
        chartColors.test.ts  # 8 tests: palette completeness, valid hex, no duplicates
      utils/
        treeUtils.test.ts    # 15 tests: find, update, immutability, sibling info
        calculations.test.ts # 28 tests: auto-balance, normalize, recalc, deviation, lock guard
        format.test.ts       # 19 tests: formatAbsoluteValue + formatPercentage + formatPopulation
        chartDataUtils.test.ts # 16 tests: toChartData, getNodeColor, generateSubcategoryColors
      components/
        DashboardHeader.test.tsx # 16 tests: title, population input dispatch/revert, ModeToggle/ResetButton composition
        GenderSection.test.tsx # 7 tests: TreePanel + PieChartPanel pairing, aria-labels, industry data
        ModeToggle.test.tsx    # 13 tests: mode label, dispatch SET_BALANCE_MODE, role="switch", aria-checked
        ResetButton.test.tsx   # 9 tests: confirm dialog, dispatch on OK, no-op on cancel, a11y, keyboard
        Slider.test.tsx      # 22 tests: rendering, range, numeric, lock, a11y, prop sync
        PieChartPanel.test.tsx # 11 tests: accessibility, legend, free mode, size variants
        ChartTooltip.test.tsx  # 5 tests: rendering, null states, ghost slice handling
        ChartLegend.test.tsx   # 5 tests: list items, labels, semantic markup, maxHeight
        TreeRow.test.tsx       # 32 tests: rendering, chevron, expand/collapse, indent, Slider, deviation warnings, mini pie charts
        TreePanel.test.tsx     # 16 tests: single-gender API, industry nodes, expand/collapse, deviation warnings, a11y
      hooks/
        useTreeState.test.ts # 19 tests: all 5 actions, cascading recalc, performance
```

## Key Patterns

### Path Alias

`@` resolves to `./src` via both `vite.config.ts` (runtime) and `tsconfig.json` (type-checking):

```typescript
import { Something } from '@/components/Something';
```

### Tailwind CSS v4 (CSS-First Config)

Tailwind v4 uses CSS-first configuration. There is **no `tailwind.config.js`**. All config goes through CSS:

```css
/* src/index.css */
@import "tailwindcss";

/* Custom theme values use @theme directive, NOT a JS config file */
```

The `@tailwindcss/vite` plugin handles compilation (not PostCSS).

### Build Script

The build script is `tsc --noEmit && vite build` (type-check then bundle).

### Shared Configs

- TypeScript: `tsconfig.json` extends `@template/config/typescript/react`
- ESLint: `.eslintrc.cjs` extends `@template/config/eslint/react` via `require.resolve()`
- Both reference `tsconfig.node.json` for Vite config file linting

## Data Model

The core data model lives in `src/types/tree.ts`. Key design decisions:

- **Single recursive `TreeNode` interface** (not discriminated union) -- tree levels (root, gender, industry, subcategory) share the same shape. Level-specific logic is handled at runtime, not type level.
- **`BalanceMode`** is a string literal union (`'auto' | 'free'`), not an enum -- idiomatic for React state (`useState<BalanceMode>`).
- **`genderSplit`** is always required on every node (no optional/null) -- uniform shape avoids null checks.
- **`kvedCode?: string`** is the only optional field -- root and gender nodes have no KVED code.
- **`children: TreeNode[]`** -- empty array `[]` for leaf nodes, not `undefined` or `null`.
- Runtime constraints (percentage 0-100, male + female = 100, sibling percentages sum to 100 in auto mode) are NOT enforced at the type level.
- Barrel re-export in `types/index.ts` uses `export type { ... }` syntax (type-only, zero runtime JS).

## Default Data (`src/data/`)

The `defaultTree` constant provides Ukraine's labor market data as a pre-computed, hardcoded `TreeNode` literal. No runtime calculation, no builder pattern -- explicit literals for auditability.

### Tree Shape

- **55 nodes total**: 1 root + 2 gender + 32 industry (16 per gender) + 20 IT subcategories (10 per gender)
- **Root**: 13,500,000 employed, genderSplit `{ male: 52.66, female: 47.34 }` (derived from weighted industry data)
- **Gender nodes**: Male 52.66% / Female 47.34%
- **Industries**: 16 KVED sectors per gender, only IT (KVED J) has Level 3 children
- **IT subcategories**: 10 per gender (Розробка ПЗ, QA, PM, HR, DevOps, Аналітики, UI/UX, Data/ML, Маркетинг, Інші ролі)

### `largestRemainder(values, target, decimals)`

Exported from `dataHelpers.ts`. Rounds an array so values sum to exactly `target` using Hamilton's method (floor, then distribute remaining units by largest fractional remainder). Used for auto-balance logic in task-004.

### Barrel Export Convention

`data/index.ts` uses **value exports** (not `export type`), because `defaultTree` and `largestRemainder` are runtime values:
```typescript
export { defaultTree } from './defaultTree';
export { largestRemainder } from './dataHelpers';
```

Contrast with `types/index.ts` which uses `export type { ... }` for type-only re-exports.

### DO NOT

- Modify `defaultTree` values without re-running largest-remainder normalization across the affected sibling group -- percentages must sum to exactly 100.0
- Use the PRD's rounded 52/48 gender split -- use the derived 52.66/47.34 (see task-003 Q6 resolution)
- Add runtime calculation logic to `defaultTree.ts` -- it is purely static data; computation belongs in `utils/` or `hooks/`
- Use `absoluteValue` as source of truth -- `percentage` is the source of truth; absolute values are derived via `Math.round(parent.absoluteValue * percentage / 100)`

## State Management (`src/hooks/`, `src/utils/`)

The dashboard uses React `useReducer` (not Zustand) for all state management. The architecture follows a strict layered pattern:

```
useTreeState (thin hook)  -->  treeReducer (exported, testable)  -->  pure utility functions (utils/)
```

### Key Design Decisions

- **`treeReducer` is exported as a named function** for direct unit testing without React rendering (`renderHook` is not needed)
- **`initialState` is exported** for test assertions and reference equality checks
- **All tree mutations are immutable** -- recursive clone via spread operator, no structural sharing (negligible cost for 55 nodes)
- **Always recalculate absolute values from root** after any percentage change -- simplicity over optimization (<1ms for 55 nodes)
- **Locks persist across mode switches** -- `SET_BALANCE_MODE` does not clear locks

### Action Types (`src/types/actions.ts`)

5 actions as a discriminated union on `type` field:
- `SET_PERCENTAGE` -- triggers auto-balance (auto mode) or single-node update (free mode)
- `TOGGLE_LOCK` -- with lock guard (`canToggleLock` prevents locking the last unlocked sibling)
- `SET_BALANCE_MODE` -- free-to-auto normalizes all sibling groups to 100%
- `SET_TOTAL_POPULATION` -- recalculates all absolute values, percentages unchanged
- `RESET` -- returns `initialState` (reference to `defaultTree`)

### Utils Module (`src/utils/`)

Two files with distinct responsibilities:

- **`treeUtils.ts`**: Tree traversal and immutable update helpers (`findNodeById`, `findParentById`, `updateNodeInTree`, `updateChildrenInTree`, `collectSiblingInfo`). Also defines `SiblingInfo` interface.
- **`calculations.ts`**: Pure mathematical functions (`autoBalance`, `normalizeGroup`, `recalcAbsoluteValues`, `getSiblingDeviation`, `canToggleLock`). Also defines `PercentageUpdate` interface.

Interfaces (`SiblingInfo`, `PercentageUpdate`) are co-located with the functions that produce/consume them in `utils/`, not in `types/`. The barrel `utils/index.ts` re-exports them with `export type { ... }`.

### Barrel Export Convention (hooks/ and utils/)

`hooks/index.ts` uses **value exports** (runtime functions):
```typescript
export { initialState, treeReducer, useTreeState } from './useTreeState';
```

`utils/index.ts` uses **mixed exports** -- value exports for functions, `export type` for interfaces:
```typescript
export { autoBalance, canToggleLock, ... } from './calculations';
export type { PercentageUpdate } from './calculations';
```

### Auto-Balance Algorithm Summary

1. Separate locked, changed, and unlocked siblings
2. Clamp changed value to `[0, 100 - lockedSum]`
3. Distribute remaining to unlocked: proportionally if `oldUnlockedSum > 0`, equally if all at 0%
4. Apply `largestRemainder(allRaw, 100, 1)` for exact 100.0 sum

### DO NOT (State Management)

- Use `toBe(0)` for floating-point deviation checks -- use `toBeCloseTo(0, 1)` instead. `Math.round(-0.01 * 10) / 10` produces `-0` in JavaScript, which fails strict `toBe(0)` equality
- Put `SiblingInfo` or `PercentageUpdate` in `types/` -- they belong in `utils/` co-located with their producing functions
- Test `useTreeState` hook via `renderHook` -- test `treeReducer` directly instead (faster, no React dependency)
- Forget to recalculate absolute values after any percentage change -- the reducer always calls `recalcTreeFromRoot` after mutations

## Components (`src/components/`)

### Component Categories

Components fall into five categories:
1. **Composition root** (App): Wires hook state to child components. No business logic, no tests of its own -- verified via child component tests.
2. **Composite header** (DashboardHeader): Composes leaf controls (ModeToggle, ResetButton) with a controlled population input. Follows the Slider controlled-input pattern (local string state, useEffect sync, commit on blur/Enter).
3. **Interactive leaf controls** (Slider, ModeToggle, ResetButton): Controlled, dispatch actions upward, minimal local state. ModeToggle uses `role="switch"` + `aria-checked`. ResetButton uses `window.confirm()` guard.
4. **Read-only visualization** (PieChartPanel, ChartTooltip, ChartLegend): Receive data as props, no internal state, no dispatch.
5. **Section containers** (GenderSection, TreePanel + TreeRow): GenderSection pairs TreePanel + PieChartPanel per gender. TreePanel manages UI-only expand/collapse state and deviation warnings. TreeRow is recursive with `React.memo`, renders mini subcategory pie charts for expanded nodes.

### Slider Component Pattern

The Slider is the first interactive component. It establishes the **controlled component pattern** used by all dashboard components:

- **Controlled**: No internal percentage state. `value` always equals props. Dispatch actions upward.
- **Local state is minimal**: Only `inputValue: string` (for partial typing in numeric input) and `isEditing: boolean` (focus tracking). No percentage duplication.
- **`useEffect` for prop sync**: When `percentage` changes externally (e.g., sibling auto-balance), `inputValue` syncs automatically. The `isEditing` guard prevents overwriting mid-typing state.
- **No `useCallback`**: Event handlers are not wrapped in `useCallback` -- no expensive child components benefit from referential stability.
- **SVG icons inline**: Lock/unlock icons use inline SVGs from Heroicons (MIT), with `aria-hidden="true"` since the parent button has its own `aria-label`.
- **Touch targets**: Lock button uses `h-11 w-11` (44x44px) for WCAG 2.5.5 compliance.

### Pie Chart Visualization Pattern

The PieChartPanel + ChartTooltip + ChartLegend form the **read-only visualization pattern**:

- **Read-only**: Receive `TreeNode[]` as `nodes` prop (not `children` -- see DO NOT below). No internal data state, no dispatch.
- **`React.memo`**: Wrapped via named function pattern `memo(function PieChartPanel(...))` for devtools clarity. Prevents re-renders when parent re-renders but chart data hasn't changed.
- **Data transformation outside component**: `toChartData()` in `utils/chartDataUtils.ts` converts TreeNode children to Recharts `PieDataEntry[]` with color mapping and ghost slice logic. Keeps mapping testable without React.
- **Custom tooltip/legend**: Recharts defaults don't support Ukrainian formatting or scrollable layout. `ChartTooltip` reuses `formatAbsoluteValue`/`formatPercentage` from `utils/format.ts`.
- **Ghost slice (free mode)**: When percentages sum < 100%, a gray "Нерозподілено" slice is appended. When > 100%, an overflow badge shows the total. Ghost slices excluded from legend and sr-only table.
- **Size variants**: `size` prop (`'standard'` = 300px, `'mini'` = 200px) controls chart height and radius.
- **Accessibility**: `<figure role="img" aria-label={...}>` wrapper + `sr-only` data `<table>` fallback for screen readers. Color swatches use `aria-hidden="true"`.

### Composition Root Pattern (App.tsx)

App.tsx is a pure **composition root** -- it wires `useTreeState()` and distributes state/dispatch to child components. It contains:
- No business logic, no conditional rendering, no local state
- `DashboardHeader` (sticky) at top
- `<main>` with `grid grid-cols-1 lg:grid-cols-2 gap-6` containing 2 `GenderSection` instances
- Male: `state.tree.children[0]`, Female: `state.tree.children[1]`
- No direct tests -- all behavior verified via child component test suites

### Dashboard Header Pattern

DashboardHeader composes the sticky top bar:
- **`<h1>` for title**: Required for WCAG 1.3.1 heading hierarchy (gender section `<h2>` elements need a parent `<h1>`). Enforced by arch-review condition.
- **Controlled population input**: Same pattern as Slider -- local `inputValue` string state, `isEditing` guard, `useEffect` prop sync, commit on blur/Enter. Parses space-separated input (`"13 500 000"` -> `13500000`), reverts on invalid.
- **Dispatches**: `SET_TOTAL_POPULATION` (population input), delegates `SET_BALANCE_MODE` (ModeToggle) and `RESET` (ResetButton) to child components.
- **Sticky positioning**: `sticky top-0 z-10` with white background and bottom border.

### GenderSection Pattern

GenderSection is a thin **container component** (44 lines) pairing a gender's TreePanel + PieChartPanel:
- Receives `genderNode` (single gender TreeNode), passes it to both children
- PieChartPanel receives `nodes={genderNode.children}` with `INDUSTRY_COLORS` color map
- Layout: vertical flex (`flex-col gap-4`), not side-by-side (columns are already narrow in the 2-column grid)

### Tree Panel Pattern (Single-Gender Container + Recursive)

The TreePanel + TreeRow form the **container + recursive child** pattern for hierarchical navigation:

- **TreePanel (single-gender container)**: Receives `genderNode: TreeNode` (one gender), NOT the full tree root. Manages expand/collapse state via `useState<Set<string>>`. This is UI-only state -- NOT in the reducer (per ADR-0004). Renders gender heading (`<h2>`), percentage + absolute value summary, optional deviation warning, and delegates industry rows to TreeRow.
- **TreeRow (recursive, `React.memo`)**: Renders a single node with chevron toggle + embedded Slider. Recursively renders children when expanded. Also renders mini subcategory pie charts and deviation warnings for expanded nodes. Wrapped in `memo(function TreeRow(...))` for performance during slider interactions.
- **`useCallback` on toggle handler**: Required because TreeRow is memoized. The `handleToggleExpand` callback uses `useCallback` with `setExpandedIds(prev => ...)` functional form to avoid stale closures. This is a justified exception to the "no premature useCallback" general guidance.
- **Expand/collapse initialization**: `collectExpandableIds()` walks the gender node's children once on mount (lazy `useState` initializer) to start all expandable nodes as expanded (per PO Q2 resolution).
- **Gender nodes are section headers**: Gender nodes are rendered by GenderSection, not TreePanel. TreePanel starts at industry level. Only industry-level nodes with children (e.g., IT/KVED J) are tracked in `expandedIds`.
- **Expand state persists across RESET**: Data resets but UI expand/collapse state does not -- this is intentional. Expand state is independent of business data.
- **Siblings prop**: TreeRow receives `siblings: readonly TreeNode[]` from its parent to compute `canToggleLock` for the embedded Slider. This avoids a DFS tree traversal per row.
- **Indentation**: `paddingLeft: ${depth * 24}px` via inline style (dynamic, cannot be static Tailwind classes). Industry depth starts at 0 (industries have no indentation; subcategories get 24px).
- **Spacer for alignment**: Leaf nodes without a chevron render a `<div className="h-11 w-11 shrink-0" />` spacer to maintain horizontal alignment with sibling rows that have chevrons.
- **Accessibility**: Chevron buttons use `aria-expanded` + `aria-label` (`Expand {label}` / `Collapse {label}`). Gender sections use `<section aria-label>` (maps to `role="region"`). DashboardHeader uses `<h1>`, gender section uses `<h2>` for heading hierarchy.

### Deviation Warning Pattern (Free Mode)

When `balanceMode === 'free'`, inline warnings appear when sibling percentages deviate from 100%:

- **Gender-level** (TreePanel): `getSiblingDeviation(genderNode)` checks industry percentages. Warning rendered as `<p role="status">` with amber-600 text below the gender heading.
- **Subcategory-level** (TreeRow): `getSiblingDeviation(node)` for expanded nodes with children. Warning rendered below child rows, indented to `(depth + 1) * 24px`.
- **Format**: `"Сума: 95.0% (-5.0%)"` or `"Сума: 108.3% (+8.3%)"` -- uses `formatPercentage()` from `utils/format.ts`.
- **Auto mode**: Deviation is always 0 (skipped via early guard), so no warnings render.
- **`formatDeviation()` helper**: Private function in TreePanel.tsx that formats the deviation string. TreeRow formats inline (same logic, not extracted).

### Mini Subcategory Pie Charts

TreeRow renders a mini `PieChartPanel` for expanded nodes with children:

- **Trigger**: `isExpanded && hasChildren` (currently only IT/KVED J nodes have subcategories)
- **Size**: `size="mini"` (200px height)
- **Colors**: `buildSubcategoryColorMap(node)` uses `generateSubcategoryColors()` with the parent industry color from `INDUSTRY_COLORS[kvedCode]` -- produces opacity-based shades
- **Legend**: Hidden (`showLegend={false}`) to save space
- **Indentation**: `paddingLeft: ${(depth + 1) * 24}px` matches child row indentation
- **Aria label**: `"Розподіл підкатегорій -- {node.label}"`

### Recharts Integration

- **Version**: Recharts 2.15.x (not 3.x -- 3.x adds `@reduxjs/toolkit`, `immer`, `react-redux` which conflicts with the project's lightweight `useReducer` approach)
- **Recharts components used**: `PieChart`, `Pie`, `Cell`, `Tooltip`, `ResponsiveContainer`
- **Color mapping**: `<Cell fill={entry.color}>` requires hex strings, not CSS custom properties
- **Custom tooltip**: `<Tooltip content={<ChartTooltip />}>` -- Recharts passes `active` and `payload` props automatically
- **Animation**: 300ms with `ease-out` easing. `isAnimationActive={true}`. Recharts interrupts previous animations gracefully during rapid updates.
- **`react-is` peer dependency**: Recharts 2.x depends on `react-is@^18`. With React 19, this produces no hard error (installed cleanly without override).

### Color Palette (`src/data/chartColors.ts`)

- `INDUSTRY_COLORS`: Fixed KVED-code-to-hex mapping (16 colors from Tailwind palette). Same industry = same color across male/female charts.
- `GENDER_COLORS`: `{ male: '#3B82F6', female: '#EC4899' }` (blue-500, pink-500)
- `GHOST_SLICE_COLOR`: `#E2E8F0` (slate-200) for free mode unallocated percentage
- `OVERFLOW_INDICATOR_COLOR`: `#FCA5A5` (red-300)
- `DEFAULT_NODE_COLOR`: `#94A3B8` (slate-400) fallback
- Subcategory mini-chart colors: Auto-generated opacity-based shades via `generateSubcategoryColors()` (100% to 40% opacity blended against white)

### Barrel Export Convention (components/)

```typescript
export { Slider } from './Slider';
export type { SliderProps } from './Slider';
```

Value export for the component, `export type` for the props interface. All 10 components follow this pattern: ChartLegend, ChartTooltip, DashboardHeader, GenderSection, ModeToggle, PieChartPanel, ResetButton, Slider, TreePanel, TreeRow.

## Format Utility (`src/utils/format.ts`)

Shared formatting functions used by Slider, ChartTooltip, PieChartPanel, DashboardHeader, TreePanel, and TreeRow:

- **`formatAbsoluteValue(value)`**: Ukrainian "тис." abbreviation for values >= 1000; plain integer for values < 1000
- **`formatPercentage(value)`**: Always 1 decimal place with `%` suffix (`toFixed(1)`)
- **`formatPopulation(value)`**: Full number with space-separated thousands (e.g., `13_500_000` -> `"13 500 000"`). Unlike `formatAbsoluteValue`, does NOT abbreviate with "тис." -- used by the population input field in DashboardHeader
- **Manual `formatWithSpaces()`** (private): Uses regular ASCII spaces, NOT `Intl.NumberFormat` -- because `Intl.NumberFormat('uk-UA')` produces non-breaking spaces (`\u00A0`) in some environments, causing test flakiness

### DO NOT (Format Utility)

- Use `Intl.NumberFormat` for space-separated thousands -- produces non-breaking spaces inconsistently across environments (Node vs browser)
- Duplicate formatting logic in components -- always import from `@/utils/format`

## Custom CSS for Native Range Inputs (`src/index.css`)

The `index.css` file contains Tailwind import plus custom CSS for native `<input type="range">` styling:

- **Vendor-prefixed pseudo-elements**: `::-webkit-slider-thumb`, `::-webkit-slider-runnable-track` (Chrome/Safari/Edge) and `::-moz-range-thumb`, `::-moz-range-track` (Firefox)
- **Tailwind v4 CSS custom properties**: Uses `var(--color-blue-500)`, `var(--color-slate-200)` etc. -- Tailwind v4 exposes all theme colors as CSS custom properties automatically
- **44x44px touch target**: Achieved via transparent `box-shadow` spread on the thumb (12px spread around 20px thumb)
- **`:focus-visible`** (not `:focus`): Outline only appears for keyboard navigation, not mouse clicks
- **`margin-top: -7px`** on WebKit thumb: Centers 20px thumb on 6px track (`-(20-6)/2 = -7`)

## Vitest Setup

Vitest is configured via a **separate `vitest.config.ts`** (not merged into `vite.config.ts`):

- Import `defineConfig` from `vitest/config` (not `vite`) for proper `test` field typing
- `@` path alias must be replicated from `vite.config.ts` (they do not share config)
- `globals: false` -- tests must explicitly import `describe`, `it`, `expect` from `vitest`
- `environment: 'jsdom'` -- required for React Testing Library; existing pure-logic tests are unaffected
- `setupFiles: ['./src/__tests__/setup.ts']` -- imports `@testing-library/jest-dom/vitest` matchers globally (registers `toBeDisabled()`, `toHaveAttribute()`, `toHaveTextContent()`, etc.)
- `css: false` -- disables CSS processing in tests (avoids Tailwind v4 + jsdom conflicts)
- Do NOT include `react()` or `tailwindcss()` plugins in vitest config -- unnecessary for tests

### Test Directory Convention

Tests live in `src/__tests__/` mirroring the source structure:

```
src/types/tree.ts              -->  src/__tests__/types/tree.test.ts
src/data/defaultTree.ts        -->  src/__tests__/data/defaultTree.test.ts
src/data/dataHelpers.ts        -->  src/__tests__/data/dataHelpers.test.ts
src/data/chartColors.ts        -->  src/__tests__/data/chartColors.test.ts
src/utils/treeUtils.ts         -->  src/__tests__/utils/treeUtils.test.ts
src/utils/calculations.ts      -->  src/__tests__/utils/calculations.test.ts
src/utils/format.ts               -->  src/__tests__/utils/format.test.ts
src/utils/chartDataUtils.ts    -->  src/__tests__/utils/chartDataUtils.test.ts
src/components/DashboardHeader.tsx -->  src/__tests__/components/DashboardHeader.test.tsx
src/components/GenderSection.tsx  -->  src/__tests__/components/GenderSection.test.tsx
src/components/ModeToggle.tsx     -->  src/__tests__/components/ModeToggle.test.tsx
src/components/ResetButton.tsx    -->  src/__tests__/components/ResetButton.test.tsx
src/components/Slider.tsx         -->  src/__tests__/components/Slider.test.tsx
src/components/PieChartPanel.tsx  -->  src/__tests__/components/PieChartPanel.test.tsx
src/components/ChartTooltip.tsx   -->  src/__tests__/components/ChartTooltip.test.tsx
src/components/ChartLegend.tsx    -->  src/__tests__/components/ChartLegend.test.tsx
src/components/TreePanel.tsx      -->  src/__tests__/components/TreePanel.test.tsx
src/components/TreeRow.tsx        -->  src/__tests__/components/TreeRow.test.tsx
src/hooks/useTreeState.ts      -->  src/__tests__/hooks/useTreeState.test.ts
```

### Recharts Testing in jsdom

Recharts uses `ResponsiveContainer` which relies on `ResizeObserver` (not available in jsdom). Tests must mock it:

```typescript
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) { this.callback = callback; }
    observe(target: Element) {
      this.callback(
        [{ target, contentRect: { width: 400, height: 300, top: 0, left: 0, bottom: 300, right: 400, x: 0, y: 0, toJSON: () => ({}) }, borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] }],
        this,
      );
    }
    unobserve() {}
    disconnect() {}
  };
});
```

**Limitations**: jsdom cannot verify SVG geometry (arc sizes), animation timing, responsive breakpoints, or touch tooltip behavior. Chart tests focus on DOM structure (figure wrapper, ARIA attributes, sr-only data table, legend items), not visual correctness.

### React Testing Library (Component Tests)

Component tests use `@testing-library/react` v16 + `@testing-library/user-event` v14 + `@testing-library/jest-dom` v6:

- **`userEvent.setup()`** for realistic user interactions (click, type, tab, keyboard). Preferred over `fireEvent` for all interactions except range input `onChange` (userEvent lacks native range slider support).
- **`fireEvent.change()`** for range input events only (simulating drag).
- **`afterEach(cleanup)`**: Explicit cleanup required when `globals: false`.
- **`makeProps()` factory pattern**: Create default props with `Partial<Props>` overrides for test readability.
- **`vi.fn()` for dispatch mock**: All component tests mock dispatch and assert on exact action payloads. No real reducer used -- tests verify component behavior in isolation.
- **`within()` for scoped queries**: When multiple elements have the same text (e.g., same percentage in different sections), use `within(parentElement)` to scope queries. Example: `within(maleHeader).getByText('60.0%')` to disambiguate gender section percentages from slider values.
- **Minimal test trees**: Container component tests (TreePanel) use a minimal test tree fixture (~8 nodes), NOT the full 55-node `defaultTree` -- keeps tests fast and readable.
- **`<section aria-label>` maps to `role="region"`**: In tests, query gender sections with `screen.getByRole('region', { name: 'Чоловіки' })` -- NOT `getByRole('section')` (HTML `<section>` elements with `aria-label` expose the `region` role in the accessibility tree).
- **Test setup file** at `src/__tests__/setup.ts`: Single-line import of `@testing-library/jest-dom/vitest` (note: the `/vitest` entry point, not default) for global matcher registration.

### Vitest v3 Mock Syntax

**IMPORTANT**: Vitest v3 changed the `vi.fn()` generic signature:

```typescript
// CORRECT (vitest v3): function signature style
const dispatch = vi.fn<(action: TreeAction) => void>();

// WRONG (vitest v2 style, causes type error in v3):
const dispatch = vi.fn<[TreeAction], void>();
```

This is a breaking change from vitest v2. If mock typing fails, check the generic syntax first.

### Type-Only Testing Pattern

For compile-time type assertions, use Vitest's `expectTypeOf`:

```typescript
import { expectTypeOf } from 'vitest';
import type { TreeNode } from '@/types/tree';

// Verify type shape
expectTypeOf<TreeNode>().toHaveProperty('id');

// Verify exact union type
expectTypeOf<BalanceMode>().toEqualTypeOf<'auto' | 'free'>();

// Verify type is not never (exists and is importable)
expectTypeOf<TreeNode>().not.toBeNever();
```

Use `import type` for type-only imports in test files. The `expectTypeOf` pattern consumes the type reference, satisfying `noUnusedLocals`.

## DO NOT

- Use `tsc -b` (project build mode) -- it emits `.d.ts.map` and `.js.map` files even with `noEmit` in referenced projects, polluting the directory. Use `tsc --noEmit` instead.
- Add `"references"` to `tsconfig.json` -- unnecessary without `tsc -b` and causes emit pollution
- Create a `tailwind.config.js` -- Tailwind v4 uses CSS-first config via `@import "tailwindcss"` and `@theme` directive
- Create a `postcss.config.js` -- the `@tailwindcss/vite` plugin replaces PostCSS for Vite projects
- Forget `@types/node` in devDependencies -- needed for `vite.config.ts` to resolve Node.js built-ins (`path`, `__dirname`)
- Forget to add new root-level config files (like `vitest.config.ts`) to `tsconfig.node.json` `include` array -- ESLint will fail to parse them otherwise
- Use `.tsx` extension for files that contain no JSX (e.g., type definitions, utilities) -- triggers `react-refresh/only-export-components` lint warning
- Use `enum` for small fixed sets of string values -- use string literal union types instead (e.g., `type BalanceMode = 'auto' | 'free'`)
- Use `Intl.NumberFormat` for space-separated thousands formatting -- produces non-breaking spaces (`\u00A0`) inconsistently across environments; use manual `formatWithSpaces()` in `format.ts` instead
- Use vitest v2 `vi.fn<[Args], Return>()` syntax -- vitest v3 requires `vi.fn<(args: Args) => Return>()` function signature style
- Store local percentage state in components -- percentage source of truth is always the tree state (useReducer). Components receive percentage as props and dispatch `SET_PERCENTAGE` actions
- Use `useCallback` on component event handlers prematurely -- EXCEPT when the callback is passed to a `React.memo`-wrapped child (e.g., `handleToggleExpand` in TreePanel passed to memoized TreeRow). In that case, `useCallback` is required for memo effectiveness.
- Name a prop `children` when passing `TreeNode[]` data -- `children` is reserved by React. Use `nodes` instead (see PieChartPanel for precedent)
- Use Recharts 3.x -- it adds `@reduxjs/toolkit`, `immer`, `react-redux` as transitive dependencies, conflicting with the project's lightweight `useReducer` approach. Stick with Recharts 2.x
- Skip the `ResizeObserver` mock in Recharts component tests -- `ResponsiveContainer` will not render without it in jsdom
- Use CSS custom properties or Tailwind class names for Recharts `fill`/`stroke` props -- Recharts requires hex color strings directly
- Pass the full tree root to TreePanel -- TreePanel accepts `genderNode: TreeNode` (single gender), not the root. App.tsx passes `state.tree.children[0]` (male) and `state.tree.children[1]` (female) to two separate GenderSection/TreePanel instances
- Remove the `<h1>` from DashboardHeader -- it is required for WCAG 1.3.1 heading hierarchy. TreePanel uses `<h2>` for gender sections, which must have a parent `<h1>`
- Add business logic to App.tsx -- it is a pure composition root. All business logic belongs in the reducer, utilities, or individual components
