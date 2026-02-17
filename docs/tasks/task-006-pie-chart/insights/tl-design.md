# Technical Design: task-006
Generated: 2026-02-17

## Overview

Implement reusable pie chart visualization components for the Labor Market Dashboard using Recharts 2.x. The design creates four components: a generic `PieChartPanel` wrapper, a `ChartTooltip` for formatted hover content, a `ChartLegend` for scrollable color-label mapping, and a data transformation utility plus color constants. Components follow the established controlled pattern (receive TreeNode data as props, no internal data state) and integrate with the existing `formatAbsoluteValue`/`formatPercentage` utilities.

## Open Questions Resolution (TL-owned)

### Q1 -- RECHARTS VERSION

**Decision: Recharts 2.15.x (latest 2.x stable)**

Rationale:
- Recharts 2.15.x peer dependencies include `react: ^19.0.0` -- confirmed React 19 compatible.
- Recharts 3.x (3.7.0) also supports React 19 but introduces heavy transitive dependencies: `@reduxjs/toolkit`, `immer`, `react-redux`, `reselect`. This conflicts with the project's lightweight `useReducer` approach and significantly increases bundle size.
- Recharts 2.x dependencies are lighter: `lodash`, `react-smooth`, `victory-vendor`, `recharts-scale`.
- The `react-is: ^18.3.1` dependency in Recharts 2.x may produce a peer warning with React 19 but is functionally compatible (React 19 includes `react-is`).
- Recharts 2.x API is mature and well-documented; the 3.x API is newer with less community coverage.
- A `react-is` peer dependency override may be needed in `package.json` to suppress warnings.

**Additional dependency: `@types/recharts` is NOT needed** -- Recharts 2.x ships with built-in TypeScript declarations.

### Q2 -- INDUSTRY COLOR PALETTE

**Decision: Fixed mapping in `src/data/chartColors.ts`, keyed by KVED code, using Tailwind CSS color hex values.**

Rationale:
- KVED codes are stable identifiers shared across male and female trees (same industry always gets same color).
- Placing the mapping in `src/data/` (alongside `defaultTree.ts`) keeps data concerns together and allows reuse by any chart type added later.
- Using hex values directly (not CSS custom properties) ensures compatibility with Recharts `<Cell fill={color}>` API.
- The palette uses 16 visually distinct colors drawn from Tailwind's extended palette, chosen for contrast against white backgrounds and between adjacent slices.

16-color palette (ordered by visual distinguishability):

| KVED | Industry | Color | Tailwind Reference |
|------|----------|-------|--------------------|
| G | Торгівля | `#3B82F6` | blue-500 |
| A | Сільське господарство | `#22C55E` | green-500 |
| B-E | Промисловість | `#EF4444` | red-500 |
| O | Держуправління та оборона | `#A855F7` | purple-500 |
| P | Освіта | `#F59E0B` | amber-500 |
| Q | Охорона здоров'я | `#EC4899` | pink-500 |
| H | Транспорт | `#06B6D4` | cyan-500 |
| F | Будівництво | `#F97316` | orange-500 |
| M | Професійна діяльність | `#8B5CF6` | violet-500 |
| J | IT та телеком | `#14B8A6` | teal-500 |
| S | Інші послуги | `#6366F1` | indigo-500 |
| N | Адмін. обслуговування | `#84CC16` | lime-500 |
| I | Готелі, харчування | `#D946EF` | fuchsia-500 |
| L | Нерухомість | `#0EA5E9` | sky-500 |
| K | Фінанси / страхування | `#F43F5E` | rose-500 |
| R | Мистецтво, спорт | `#FACC15` | yellow-400 |

Gender colors (existing PRD specification):
- Male: `#3B82F6` (blue-500)
- Female: `#EC4899` (pink-500)

Ghost slice (free mode deviation):
- Under 100%: `#E2E8F0` (slate-200)
- Over 100%: `#FEF2F2` (red-50) with `#FCA5A5` (red-300) stroke

Subcategory mini-chart colors: Auto-generated shades of the parent industry color using opacity variations (10 shades from 100% to 40% opacity).

### Q6 -- MOBILE TOOLTIP

**Decision: (a) Tap to show, tap-away to dismiss.**

Rationale:
- This is the default behavior of Recharts `<Tooltip>` on touch devices -- it responds to tap events natively.
- Long-press (option b) is non-standard and conflicts with text selection / native browser behaviors.
- Always-show in legend (option c) would duplicate information and clutter small screens.
- Recharts handles the tap/dismiss lifecycle internally; no custom implementation needed.

### Q7 -- ANIMATION DURATION

**Decision: (a) 300ms.**

Rationale:
- 300ms is the standard UI transition duration, matching Material Design and Apple HIG recommendations.
- 500ms feels sluggish during rapid slider dragging (users perceive lag when experimenting with scenarios).
- Making it configurable (option c) adds complexity with no clear user benefit in v1.
- Recharts `<Pie isAnimationActive animationDuration={300}>` handles this directly.
- `animationEasing="ease-out"` provides natural deceleration.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/src/components/`, `apps/labor-market-dashboard/src/data/`, `apps/labor-market-dashboard/src/utils/`, `apps/labor-market-dashboard/src/__tests__/`
- **New modules to create**:
  - `src/data/chartColors.ts` -- Color palette constants (industry KVED-to-color mapping, gender colors, ghost slice colors)
  - `src/utils/chartDataUtils.ts` -- Transform `TreeNode.children` into Recharts-compatible data arrays
  - `src/components/PieChartPanel.tsx` -- Main pie chart component (wraps Recharts PieChart)
  - `src/components/ChartTooltip.tsx` -- Custom tooltip component for pie slices
  - `src/components/ChartLegend.tsx` -- Scrollable legend component
  - `src/__tests__/data/chartColors.test.ts` -- Color palette validation tests
  - `src/__tests__/utils/chartDataUtils.test.ts` -- Data transformation tests
  - `src/__tests__/components/PieChartPanel.test.tsx` -- Chart rendering tests
  - `src/__tests__/components/ChartTooltip.test.tsx` -- Tooltip rendering tests
  - `src/__tests__/components/ChartLegend.test.tsx` -- Legend rendering tests
- **Barrel exports to update**: `src/data/index.ts`, `src/utils/index.ts`, `src/components/index.ts`
- **New production dependency**: `recharts@^2.15.0`
- **New dev dependency**: none (existing test infrastructure is sufficient)
- **DB schema change required?**: No (client-only SPA)
- **Architectural considerations**:
  - Components are read-only visualizations -- they receive TreeNode data as props and render charts. No internal data state, no dispatch.
  - The `chartDataUtils.ts` utility transforms TreeNode children into `{ name, value, color, absoluteValue }[]` for Recharts consumption. This keeps data mapping logic testable outside React.
  - Ghost slice in free mode: when sibling percentages sum to less than 100%, an additional data entry `{ name: 'Нерозподілено', value: 100 - sum, color: GHOST_COLOR }` is appended. When over 100%, slices render proportionally (full circle) with a visual overflow indicator via a colored outer ring.
  - Mini chart for subcategories uses the same `PieChartPanel` component with a `size="mini"` prop variant.
  - Recharts renders SVG -- not Canvas -- which integrates well with jsdom for testing basic rendering (slice count, ARIA attributes). However, SVG geometry (actual arc sizes) cannot be meaningfully tested in jsdom; tests focus on data mapping and DOM structure.
  - `ResponsiveContainer` from Recharts handles responsive sizing. Width is 100% of parent; height is controlled by the parent layout.
- **Known risks or trade-offs**:
  - [Low] Recharts 2.x `react-is` peer warning with React 19: functionally harmless, can be suppressed via `peerDependencyRules.allowedVersions` in `.npmrc` or `package.json` overrides.
  - [Low] Bundle size: Recharts 2.x adds ~150KB gzipped (with tree-shaking). Well within PRD's 500KB budget given current bundle is minimal.
  - [Medium] Testing SVG rendering in jsdom: Recharts renders to SVG, but jsdom does not compute SVG geometry. Tests verify DOM structure (number of path elements, text content, ARIA attributes) but cannot verify visual correctness. Visual regression testing is out of scope for v1.
  - [Low] Animation performance during rapid slider drags: 300ms animation with `isAnimationActive={true}` may cause overlap if slider fires faster than animation completes. Recharts handles this gracefully by interrupting the previous animation. If performance issues arise, `isAnimationActive` can be disabled during drag and re-enabled on drag end (future optimization, not in this task).
- **Test plan**: Unit tests (~35 test cases across 5 test files). No integration or E2E tests needed.

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Recharts 2.15.x over 3.x | Lighter dependencies (no Redux/immer), React 19 compatible, mature API | Recharts 3.x (heavier deps), Chart.js (Canvas-based, harder to test with RTL), custom SVG (too much work) |
| Fixed KVED-to-color map in `data/` | Stable identifiers, data-layer concern, reusable across chart types | Dynamic color generation (less predictable), co-located in component (less reusable), CSS custom properties (Recharts needs hex) |
| Single `PieChartPanel` component with size variants | Reduces duplication between gender chart and mini chart; consistent behavior | Separate `IndustryPieChart` and `MiniPieChart` components (more code, divergent behavior risk) |
| Custom `ChartTooltip` component over Recharts default | Need Ukrainian formatting (`formatAbsoluteValue`, `formatPercentage`) and consistent styling | Recharts default tooltip (English-only, different styling), no tooltip (loses interactivity) |
| Custom `ChartLegend` component over Recharts default | Need scrollable container, responsive placement (right on desktop, below on mobile) | Recharts built-in legend (no scroll, limited layout control) |
| Ghost slice for free mode under-100% | User-resolved Q3: visually truthful representation of deviation | Normalize to full circle (hides deviation), show deviation as text only (less intuitive) |
| 300ms animation over 500ms | Matches standard UI transitions, responsive feel during rapid experimentation | 500ms (sluggish), configurable (unnecessary complexity for v1) |
| Tap-to-show tooltip on mobile | Recharts default behavior, intuitive, no custom touch handling needed | Long-press (non-standard), always-show in legend (cluttered) |

## Component Architecture

### Component Hierarchy

```
PieChartPanel (main wrapper)
  |-- Recharts PieChart
  |     |-- Pie (data slices)
  |     |     |-- Cell (per slice, with fill color)
  |     |-- Pie (ghost slice, conditional for free mode)
  |     |-- Tooltip -> ChartTooltip (custom content)
  |-- ChartLegend (separate, positioned via CSS)
```

### Props Interfaces

#### PieChartPanel

```typescript
/** Variant controlling chart size and feature set. */
type ChartSize = 'standard' | 'mini';

/** Props for PieChartPanel. */
interface PieChartPanelProps {
  /** Child nodes to visualize as pie slices */
  children: TreeNode[];
  /** Map of node ID (or kvedCode) to hex color string */
  colorMap: Record<string, string>;
  /** Accessible label for the chart (e.g., "Male industry distribution") */
  ariaLabel: string;
  /** Chart size variant. 'standard' = ~300px, 'mini' = ~200px */
  size?: ChartSize;
  /** Current balance mode -- controls ghost slice visibility */
  balanceMode: BalanceMode;
  /** Whether to show the legend */
  showLegend?: boolean;
}
```

#### ChartTooltip

```typescript
/** Props for ChartTooltip (passed by Recharts Tooltip content prop). */
interface ChartTooltipProps {
  /** Whether tooltip is currently active (from Recharts) */
  active?: boolean;
  /** Payload array from Recharts (contains data point info) */
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      absoluteValue: number;
      fill: string;
    };
  }>;
}
```

#### ChartLegend

```typescript
/** Single legend entry. */
interface LegendItem {
  /** Display label */
  label: string;
  /** Hex color */
  color: string;
}

/** Props for ChartLegend. */
interface ChartLegendProps {
  /** Legend entries to display */
  items: LegendItem[];
  /** Maximum height before scrolling (in px). Default: 300 */
  maxHeight?: number;
}
```

### Data Transformation Utility

```typescript
/** Single data point for Recharts Pie component. */
interface PieDataEntry {
  /** Display name (node label) */
  name: string;
  /** Percentage value (drives slice size) */
  value: number;
  /** Hex color for the slice */
  color: string;
  /** Absolute value (for tooltip display) */
  absoluteValue: number;
  /** Original node ID */
  nodeId: string;
}

/**
 * Transform TreeNode children into Recharts-compatible data array.
 * Maps each child to a PieDataEntry using the provided color map.
 * Optionally appends a ghost slice if percentages don't sum to 100%.
 */
function toChartData(
  children: TreeNode[],
  colorMap: Record<string, string>,
  balanceMode: BalanceMode,
  defaultColor?: string,
): PieDataEntry[];

/**
 * Get the color for a node from the color map.
 * Uses kvedCode if available, falls back to node ID.
 */
function getNodeColor(
  node: TreeNode,
  colorMap: Record<string, string>,
  defaultColor?: string,
): string;

/**
 * Generate opacity-based color shades for subcategory mini charts.
 * Creates `count` shades from full opacity to 40% opacity of the base color.
 */
function generateSubcategoryColors(
  baseColor: string,
  count: number,
): string[];
```

### File Structure

All components are single-file (not directory-based), following the established Slider pattern:

```
src/
  data/
    chartColors.ts          # NEW: Color palette constants
    index.ts                # MODIFIED: add chartColors exports
  utils/
    chartDataUtils.ts       # NEW: toChartData, getNodeColor, generateSubcategoryColors
    index.ts                # MODIFIED: add chartDataUtils exports
  components/
    PieChartPanel.tsx        # NEW: Main chart wrapper
    ChartTooltip.tsx         # NEW: Custom tooltip
    ChartLegend.tsx          # NEW: Scrollable legend
    index.ts                # MODIFIED: add chart component exports
  __tests__/
    data/
      chartColors.test.ts   # NEW: Color validation
    utils/
      chartDataUtils.test.ts # NEW: Data transformation tests
    components/
      PieChartPanel.test.tsx  # NEW: Chart rendering tests
      ChartTooltip.test.tsx   # NEW: Tooltip tests
      ChartLegend.test.tsx    # NEW: Legend tests
```

### Responsive Strategy

- **Desktop (>= 1024px)**: Standard charts ~300px diameter. Legend positioned to the right of the chart via `flex-row`.
- **Tablet (768px-1023px)**: Charts scale down via `ResponsiveContainer`. Legend stays to the right but with reduced width.
- **Mobile (< 768px)**: Charts at ~250px max. Legend moves below the chart via `flex-col`. Tooltips constrained to viewport via Recharts' built-in positioning.
- The mini chart is always ~200px diameter regardless of viewport.

Responsive behavior is handled via Tailwind responsive classes on the wrapper div, not inside Recharts components. `ResponsiveContainer` from Recharts adapts the SVG to its parent width.

### Ghost Slice Implementation (Free Mode)

When `balanceMode === 'free'`:

1. Calculate `sum = children.reduce((s, c) => s + c.percentage, 0)`.
2. If `sum < 100`: Append a ghost entry `{ name: 'Нерозподілено', value: 100 - sum, color: '#E2E8F0', absoluteValue: 0, nodeId: 'ghost' }`. The pie renders a full circle with a gray gap.
3. If `sum > 100`: All slices render proportionally in a full circle (standard Recharts behavior -- it normalizes to 100%). An overflow indicator is shown as a small badge/label above the chart displaying the sum (e.g., "115.2%"). No ghost slice needed.
4. If `sum === 100`: No ghost slice, standard rendering.

The ghost slice is excluded from the legend and shows a simplified tooltip ("Нерозподілено: X.X%").

### Accessibility Implementation

- Each `PieChartPanel` wraps the chart in a `<figure>` with `role="img"` and `aria-label` describing the chart purpose.
- An invisible `<table>` (visually hidden via `sr-only` class) provides a data table fallback for screen readers, listing each slice's label, percentage, and absolute value.
- Recharts SVG elements receive no additional ARIA attributes (SVG interiors are opaque to most screen readers).
- ChartLegend items use `<ul>/<li>` semantic list markup.
- Color-coded items include the color swatch as `aria-hidden="true"` since the label text carries the information.

### Performance Considerations

- `isAnimationActive={true}` with `animationDuration={300}` and `animationEasing="ease-out"`.
- During initial render, animation plays once. Subsequent updates re-trigger animation.
- `React.memo` on `PieChartPanel` to prevent re-renders when parent re-renders but chart data has not changed. The memo comparison checks `children` array reference (since tree updates produce new arrays, this is sufficient).
- No `useMemo` for `toChartData` inside the component -- the transformation is O(n) where n=16 (trivial, <0.1ms). Memoization overhead is not worth it.

## Implementation Steps

### Step 1 -- Install Recharts dependency

- Files: Modify `apps/labor-market-dashboard/package.json`
- Add `"recharts": "^2.15.0"` to `dependencies`
- Run `pnpm install` from repo root
- Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds; no peer dependency errors (warnings about `react-is` are acceptable)

### Step 2 -- Create color palette constants (`src/data/chartColors.ts`)

- Files: Create `src/data/chartColors.ts`, modify `src/data/index.ts`
- Define `INDUSTRY_COLORS: Record<string, string>` mapping KVED codes to hex colors (16 entries)
- Define `GENDER_COLORS: { male: string; female: string }`
- Define `GHOST_SLICE_COLOR: string` and `OVERFLOW_INDICATOR_COLOR: string`
- Export all constants via `src/data/index.ts`
- Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

### Step 3 -- Create color palette tests (`src/__tests__/data/chartColors.test.ts`)

- Files: Create `src/__tests__/data/chartColors.test.ts`
- ~6 test cases: INDUSTRY_COLORS has exactly 16 entries, all values are valid hex strings, all 16 KVED codes from defaultTree are present, GENDER_COLORS has male and female, no duplicate colors in industry palette, ghost color is defined
- Verification: `pnpm test --filter @template/labor-market-dashboard` -- chartColors tests pass

### Step 4 -- Create data transformation utility (`src/utils/chartDataUtils.ts`)

- Files: Create `src/utils/chartDataUtils.ts`, modify `src/utils/index.ts`
- Implement `toChartData()`: maps TreeNode children to `PieDataEntry[]`, appends ghost slice in free mode when sum < 100
- Implement `getNodeColor()`: looks up color by kvedCode first, then by node ID, falls back to default
- Implement `generateSubcategoryColors()`: creates opacity-based color variations for mini charts
- Export `PieDataEntry` type and all functions via barrel
- Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

### Step 5 -- Create data transformation tests (`src/__tests__/utils/chartDataUtils.test.ts`)

- Files: Create `src/__tests__/utils/chartDataUtils.test.ts`
- ~10 test cases: correct number of entries from defaultTree male children (16), correct name/value mapping, ghost slice appended when sum < 100 in free mode, no ghost slice in auto mode, no ghost slice when sum = 100 in free mode, overflow case (sum > 100) has no ghost slice, getNodeColor with kvedCode, getNodeColor fallback to ID, generateSubcategoryColors produces correct count, generateSubcategoryColors opacity range
- Verification: `pnpm test --filter @template/labor-market-dashboard` -- chartDataUtils tests pass

### Step 6 -- Create ChartTooltip component (`src/components/ChartTooltip.tsx`)

- Files: Create `src/components/ChartTooltip.tsx`, modify `src/components/index.ts`
- Renders label (name), formatted percentage (`formatPercentage`), formatted absolute value (`formatAbsoluteValue`)
- Color swatch dot matching slice color
- Styled with Tailwind classes (white background, shadow, rounded, padding)
- Returns `null` when `active` is false or payload is empty
- Barrel export in `src/components/index.ts`
- Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds; `pnpm lint` passes

### Step 7 -- Create ChartTooltip tests (`src/__tests__/components/ChartTooltip.test.tsx`)

- Files: Create `src/__tests__/components/ChartTooltip.test.tsx`
- ~5 test cases: renders label and formatted values when active, renders null when not active, renders null when payload empty, uses formatAbsoluteValue for absolute display, uses formatPercentage for percentage display
- Verification: `pnpm test --filter @template/labor-market-dashboard` -- ChartTooltip tests pass

### Step 8 -- Create ChartLegend component (`src/components/ChartLegend.tsx`)

- Files: Create `src/components/ChartLegend.tsx`, modify `src/components/index.ts`
- Renders `<ul>` of legend items with color swatch + label
- Scrollable container with `overflow-y-auto` and `maxHeight` prop
- Responsive: uses Tailwind responsive classes
- Color swatch is a small `<span>` with inline `backgroundColor` style
- Barrel export in `src/components/index.ts`
- Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds; `pnpm lint` passes

### Step 9 -- Create ChartLegend tests (`src/__tests__/components/ChartLegend.test.tsx`)

- Files: Create `src/__tests__/components/ChartLegend.test.tsx`
- ~5 test cases: renders correct number of list items, displays labels, renders color swatches, applies maxHeight style, uses semantic list markup (ul/li)
- Verification: `pnpm test --filter @template/labor-market-dashboard` -- ChartLegend tests pass

### Step 10 -- Create PieChartPanel component (`src/components/PieChartPanel.tsx`)

- Files: Create `src/components/PieChartPanel.tsx`, modify `src/components/index.ts`
- Uses `toChartData()` to transform TreeNode children into Recharts data
- Renders Recharts `<PieChart>`, `<Pie>`, `<Cell>` with colors from data entries
- Uses `<Tooltip content={<ChartTooltip />}>` for custom tooltip
- Uses `<ChartLegend>` outside the SVG (Recharts SVG should not contain HTML legend)
- Wraps chart in `<figure>` with `role="img"` and `aria-label`
- Includes screen-reader-only data table (`sr-only` class)
- `React.memo` wrapper for performance
- Size variants: `standard` (300px height) and `mini` (200px height)
- `ResponsiveContainer` for width adaptation
- Barrel export in `src/components/index.ts`
- Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds; `pnpm lint` passes

### Step 11 -- Create PieChartPanel tests (`src/__tests__/components/PieChartPanel.test.tsx`)

- Files: Create `src/__tests__/components/PieChartPanel.test.tsx`
- ~10 test cases: renders figure with aria-label, renders screen-reader data table with correct row count, renders ChartLegend when showLegend is true, hides ChartLegend when showLegend is false, passes correct data entries count, renders with mini size variant, renders ghost slice entry in free mode when sum < 100, no ghost slice in auto mode, renders overflow indicator when sum > 100 in free mode, memoized component does not re-render with same props
- Note: Recharts SVG rendering in jsdom is limited. Tests focus on wrapper DOM structure, ARIA attributes, data table content, and legend integration rather than SVG path geometry.
- Verification: `pnpm test --filter @template/labor-market-dashboard` -- PieChartPanel tests pass

### Step 12 -- Final verification

- Run `pnpm lint --filter @template/labor-market-dashboard` -- no errors
- Run `pnpm test --filter @template/labor-market-dashboard` -- all tests pass (~131 existing + ~36 new)
- Run `pnpm build --filter @template/labor-market-dashboard` -- builds successfully
- Verify no `any` types
- Verify `.tsx` extension only for files with JSX, `.ts` for pure logic/data files
- Verify all new components are under 200 lines each
- Verify barrel exports updated correctly

## Complexity Assessment

- **Estimated effort**: 2-3 days
- **Risk level**: Low-Medium
- **Dependencies**: Recharts 2.15.x (external library, well-established)
- **Step count**: 12 steps
- **New files**: 8 source files + 5 test files = 13 files
- **Modification to existing files**: 3 barrel exports (data/index.ts, utils/index.ts, components/index.ts) + package.json

The primary complexity is in the Recharts integration (ensuring SVG renders correctly, tooltip positioning, responsive behavior). The data transformation and color palette are straightforward. Testing Recharts components in jsdom has inherent limitations that are mitigated by focusing tests on DOM structure rather than visual output.

## Test Strategy

### Unit Tests (36 test cases across 5 files)

| Test File | Component/Module | Test Count | Focus |
|-----------|-----------------|------------|-------|
| `chartColors.test.ts` | Color palette | 6 | Completeness, validity, uniqueness |
| `chartDataUtils.test.ts` | Data transformation | 10 | Mapping correctness, ghost slice logic, color lookup |
| `ChartTooltip.test.tsx` | Custom tooltip | 5 | Rendering, formatting, null states |
| `ChartLegend.test.tsx` | Scrollable legend | 5 | DOM structure, semantics, styling |
| `PieChartPanel.test.tsx` | Main chart wrapper | 10 | ARIA, data table, legend toggle, size variants, ghost slice |

### What is NOT tested (and why)

- **SVG arc geometry**: jsdom does not compute SVG layout. Verifying that a 52% slice is visually larger than a 3% slice requires visual/screenshot testing.
- **Animation timing**: Cannot verify 300ms animation duration in jsdom.
- **Responsive breakpoints**: Requires browser viewport resizing; not feasible in jsdom unit tests.
- **Touch tooltip behavior**: Requires touch events on SVG in a real browser.
- **Recharts internal rendering**: We test our wrapper logic, not Recharts itself.

### Testing Pattern

Component tests follow the established Slider test pattern:
- `makeProps()` factory with `Partial<Props>` overrides
- `vi.fn()` for any callback mocks (none needed for read-only charts, but pattern is available)
- `afterEach(cleanup)` for explicit jsdom cleanup
- `screen.getByRole`, `screen.getByText` for DOM assertions
- Vitest v3 mock syntax: `vi.fn<(args) => void>()`

## Open Technical Questions

None. All TL-owned questions (Q1, Q2, Q6, Q7) are resolved above. All PO-owned questions (Q3, Q4, Q5) were resolved by the user before TL design.
