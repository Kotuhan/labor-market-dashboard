# Technical Design: task-005
Generated: 2026-02-17

## Overview

Build the `Slider` component as a controlled, reusable React component that connects the tree state management layer (task-004) to a visual slider interface. The component combines a native HTML5 `<input type="range">` for the drag track, a numeric `<input>` for precise entry, a lock toggle button, and value displays (percentage + abbreviated absolute value). A new `format.ts` utility provides Ukrainian number formatting. The vitest environment switches to `jsdom` to enable React Testing Library for component tests.

## TL Decisions on Open Questions

### Q1: Slider Library Choice -- Native HTML5 `<input type="range">`

**Decision**: Use native `<input type="range">` with custom Tailwind CSS v4 styling.

**Rationale**:
- **Bundle size**: Zero added dependency. The project currently has only `react` and `react-dom` as runtime dependencies. Adding `rc-slider` (~28KB min) or `@radix-ui/react-slider` (~12KB min + `@radix-ui/react-primitive` transitive deps) would be the first third-party UI dependency, which is premature for this SPA.
- **Accessibility**: Native `<input type="range">` has built-in ARIA semantics (`role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`), keyboard support (Arrow keys), and screen reader announcements. We add `aria-label` and `aria-valuetext` for the node label and formatted value.
- **Touch support**: Native range inputs work on all mobile browsers (Safari, Chrome, Firefox) with no additional code. Touch targets are controlled via CSS (`appearance: none` + custom thumb sizing to 44x44px minimum).
- **Styling with Tailwind CSS v4**: Using `@theme` and `appearance: none` with pseudo-element selectors (`::-webkit-slider-thumb`, `::-moz-range-thumb`) provides full visual control. This avoids the CSS-in-JS or class override gymnastics required by rc-slider.
- **Complexity**: The component's complexity is in the state integration and formatting, not in the slider widget itself. A native input is the simplest possible base.

**Alternatives Considered**:
| Option | Pros | Cons |
|--------|------|------|
| `rc-slider` | Mature, range mode, marks/ticks | 28KB, own CSS required (conflicts with Tailwind v4 CSS-first), no tree-shaking, overkill for single-value slider |
| `@radix-ui/react-slider` | Good a11y, composable, headless | 12KB + transitive deps, first Radix dependency (opens floodgates), primitives API is verbose for a simple slider |
| Native `<input type="range">` (chosen) | 0KB, built-in a11y/touch, simple | Cross-browser styling requires vendor prefixes, no built-in marks/ticks (not needed for this use case) |

### Q2: Numeric Input Update Behavior During Drag -- Real-time with dispatch on every change

**Decision**: The numeric input display updates on every `onChange` event (every mousemove/touchmove during drag). The component dispatches `SET_PERCENTAGE` on every change event.

**Rationale**:
- **React 19 automatic batching**: React 19 batches all state updates by default (including those in event handlers, setTimeout, and promises). Multiple rapid dispatches during a single frame are batched into a single re-render. This eliminates the "excessive re-render" concern that existed in React 17.
- **Tree size is small**: The 55-node tree with immutable recursive clone + `largestRemainder` completes in <1ms (proven by task-004 performance tests). Even at 60fps drag, the total computation budget per frame is ~16ms, and we use <1ms. No throttling needed.
- **User experience**: The PRD (NFR-01) requires "< 100ms" visual feedback. Real-time updates during drag provide continuous feedback, which is the expected behavior for a "what-if" modeling tool. Updating only on drag-end would create a jarring delayed response.
- **Sibling auto-balance visualization**: In auto-balance mode, siblings must visually redistribute during drag for the user to see the "live" effect. Deferred updates would hide this core interaction.
- **No debounce/throttle needed**: Given the above performance characteristics, no `requestAnimationFrame` batching or debounce is necessary for v1. If profiling later reveals issues (unlikely with 55 nodes), `requestAnimationFrame` can be added as a wrapper around dispatch without changing the component API.

## Technical Notes

- **Affected modules**: `apps/labor-market-dashboard/src/components/`, `apps/labor-market-dashboard/src/utils/`, `apps/labor-market-dashboard/src/__tests__/`
- **New modules/entities to create**:
  - `src/components/Slider.tsx` -- Main slider component
  - `src/utils/format.ts` -- Number formatting utility (Ukrainian "тис." abbreviation)
  - `src/__tests__/components/Slider.test.tsx` -- Component tests (React Testing Library)
  - `src/__tests__/utils/format.test.ts` -- Format utility unit tests
- **Barrel exports to update**:
  - `src/utils/index.ts` -- Add format exports
  - `src/components/index.ts` -- Create barrel for components
- **DB schema change required?**: No (client-only SPA)
- **Architectural considerations**:
  - **Controlled component pattern**: Slider receives all values as props and dispatches actions upward. No internal percentage state (avoids desync with reducer state). The range input's `value` is always the prop `percentage`.
  - **Single-file component**: The Slider is a single `.tsx` file (~150 lines estimated), not a directory with sub-components. It has one visual responsibility and no sub-compositions that warrant extraction.
  - **Format utility is separate**: `format.ts` in `utils/` is a pure function, reusable by PieChart tooltips (task-007) and SummaryBar (task-009).
  - **Vitest environment change**: Component tests require `jsdom`. The vitest.config.ts `environment` changes from `'node'` to `'jsdom'`. Existing pure-logic tests are unaffected by this change. `@testing-library/react` and `@testing-library/jest-dom` are added as devDependencies.
  - **CSS approach**: Custom slider styling uses Tailwind utility classes for layout, plus a small `<style>` block or `index.css` additions for vendor-prefixed pseudo-elements (`::-webkit-slider-thumb`, `::-moz-range-thumb`). This aligns with the CSS-first Tailwind v4 pattern.
  - **No `useCallback` wrappers**: The Slider component does not wrap its event handlers in `useCallback` because: (a) it has no expensive child components that would benefit from referential stability, and (b) premature memoization adds complexity without measurable gain for 32 slider instances.
- **Known risks or trade-offs**:
  - [Low] Cross-browser slider thumb styling: vendor prefixes are well-documented; Firefox (`::-moz-range-thumb`) and WebKit (`::-webkit-slider-thumb`) cover all target browsers
  - [Low] Numeric input parsing: `parseFloat` may produce unexpected results for edge inputs (e.g., "1.23.45"); clamping and NaN guard mitigate this
  - [Low] Component file size: estimated ~150 lines, well under 200-line project limit
- **Test plan**: Unit tests for `format.ts` (~6 tests); component tests for Slider (~15 tests) using React Testing Library (render, user events, assertions on dispatch calls). No integration or E2E tests needed.

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Native `<input type="range">` | 0KB, built-in a11y/touch, sufficient for single-value slider | rc-slider (28KB, overkill), @radix-ui/react-slider (12KB+, premature dependency) |
| Dispatch on every drag event | React 19 batching + <1ms tree recalc = no perf issue; best UX for live modeling | Dispatch on drag-end only (jarring UX), requestAnimationFrame batching (premature) |
| Single-file Slider.tsx | Under 200 lines, single responsibility, no sub-compositions | Directory with sub-components (over-engineering for this scope) |
| Controlled component (no local state for percentage) | Avoids desync with reducer; percentage source of truth is always the tree state | Uncontrolled with local state synced via useEffect (complex, error-prone) |
| Local state for numeric input editing | Allows user to type partial values ("4", "45", "45.") before committing on blur/Enter | Direct dispatch on every keystroke (dispatches invalid intermediate values like "4" when user wants "45") |
| `jsdom` vitest environment | Required for React Testing Library; existing node-env tests unaffected | Separate vitest config for component tests (over-complicated) |
| format.ts in utils/ (not in components/) | Reusable by PieChart, SummaryBar, and any future formatting needs | Co-located in Slider component (not reusable) |

## Component Architecture

### Props Interface

```typescript
/** Props for the Slider component. */
interface SliderProps {
  /** Unique ID of the tree node this slider controls */
  nodeId: string;
  /** Display label (Ukrainian text, e.g., "Торгівля") */
  label: string;
  /** Current percentage value (0-100, 1 decimal place) */
  percentage: number;
  /** Computed absolute value for display */
  absoluteValue: number;
  /** Whether this node is locked */
  isLocked: boolean;
  /** Whether the lock toggle can be activated (canToggleLock result) */
  canLock: boolean;
  /** Current balance mode (affects clamping behavior display, not logic) */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}
```

### Component Structure (visual layout)

```
[Label] ................ [Percentage%] [AbsoluteValue тис.]
[========|============] [NumInput] [LockBtn]
  ^range input           ^text input  ^button
```

### Internal State

The component uses **one** piece of local state: `inputValue: string` for the numeric input field. This is necessary because:
1. While the user is typing "45.5", intermediate states ("4", "45", "45.") are not valid percentages
2. The local `inputValue` is synced FROM props when not actively editing (i.e., when the input is not focused)
3. On blur or Enter, the local value is parsed, clamped, and dispatched as `SET_PERCENTAGE`
4. When the range slider is dragged, it dispatches directly (no local state needed -- the range input's `value` is always `props.percentage`)

### Event Flow

```
Range drag:
  onChange -> parse integer -> dispatch SET_PERCENTAGE -> parent re-renders -> new percentage prop

Numeric input:
  onFocus -> mark editing
  onChange -> update local inputValue string
  onBlur/Enter -> parse float, clamp [0, 100], round to 1 decimal -> dispatch SET_PERCENTAGE -> clear editing flag

Lock toggle:
  onClick -> dispatch TOGGLE_LOCK (if canLock is true)

External prop change (sibling auto-balance):
  percentage prop changes -> range input updates automatically (controlled)
  if not editing -> inputValue syncs to new percentage
```

## Format Utility Design

### `formatAbsoluteValue(value: number): string`

Formats a number using Ukrainian thousands abbreviation convention.

**Rules**:
- Values >= 1000: divide by 1000, round to nearest integer, format with space-separated groups, append " тис."
- Values < 1000: display as-is with no abbreviation
- Examples:
  - `13_500_000` -> `"13 500 тис."`
  - `1_194_329` -> `"1 194 тис."`
  - `6_171` -> `"6 тис."`
  - `500` -> `"500"`
  - `0` -> `"0"`

### `formatPercentage(value: number): string`

Formats a percentage with 1 decimal place.

**Rules**:
- Always 1 decimal place: `18.5` -> `"18.5%"`, `0.0` -> `"0.0%"`, `100.0` -> `"100.0%"`

## Implementation Steps

### Step 1 -- Create format utility (`src/utils/format.ts`)

- **Files**: Create `src/utils/format.ts`, modify `src/utils/index.ts`
- **What**: Implement `formatAbsoluteValue(value: number): string` and `formatPercentage(value: number): string`
  - `formatAbsoluteValue`: For values >= 1000, divide by 1000, `Math.round()`, then format integer part with space-separated thousands, append `" тис."`. For values < 1000, format as plain integer.
  - `formatPercentage`: `value.toFixed(1) + '%'`
  - Use `Intl.NumberFormat('uk-UA', { useGrouping: true })` for space-separated thousands formatting, or manual implementation if `Intl` formatting produces non-breaking spaces (use regular space for consistency).
- **Barrel export**: Add `export { formatAbsoluteValue, formatPercentage } from './format';` to `src/utils/index.ts`
- **Verification**: `pnpm build --filter @template/labor-market-dashboard` succeeds

### Step 2 -- Create format utility tests (`src/__tests__/utils/format.test.ts`)

- **Files**: Create `src/__tests__/utils/format.test.ts`
- **What**: ~8 test cases:
  - `formatAbsoluteValue`: large number (13500000 -> "13 500 тис."), medium (6171 -> "6 тис."), small (<1000, e.g., 500 -> "500"), zero (0 -> "0"), boundary (999 -> "999"), boundary (1000 -> "1 тис.")
  - `formatPercentage`: standard (18.5 -> "18.5%"), zero (0 -> "0.0%"), hundred (100 -> "100.0%"), integer (30 -> "30.0%")
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` -- format tests pass

### Step 3 -- Add testing dependencies for React component tests

- **Files**: Modify `apps/labor-market-dashboard/package.json`, modify `apps/labor-market-dashboard/vitest.config.ts`
- **What**:
  - Add devDependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
  - Change vitest.config.ts `environment` from `'node'` to `'jsdom'`
  - Run `pnpm install` from monorepo root
- **Note**: Changing to `jsdom` environment does NOT break existing pure-logic tests (they don't use DOM APIs). The only cost is slightly slower test startup (~100ms).
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` -- all existing tests still pass

### Step 4 -- Add slider CSS styles to `src/index.css`

- **Files**: Modify `src/index.css`
- **What**: Add custom CSS for the native range input slider appearance:
  - Reset default appearance: `input[type="range"] { appearance: none; }` (with `-webkit-appearance`)
  - Track styling: height, background color, border-radius
  - Thumb styling: 20x20px (visual) with 44x44px touch target (via transparent border or padding), rounded, cursor pointer
  - Disabled state: reduced opacity, cursor not-allowed
  - Focus visible: outline ring for keyboard navigation
  - Use Tailwind CSS v4 theme values via `var()` references where possible (e.g., colors)
- **Verification**: `pnpm build --filter @template/labor-market-dashboard` succeeds; dev server shows styled range input

### Step 5 -- Create Slider component (`src/components/Slider.tsx`)

- **Files**: Create `src/components/Slider.tsx`, create `src/components/index.ts`
- **What**: Implement the `Slider` component with:
  - **Props**: `SliderProps` interface (nodeId, label, percentage, absoluteValue, isLocked, canLock, balanceMode, dispatch)
  - **Range input**: `<input type="range" min={0} max={100} step={1} value={percentage} />` with `aria-label={label}`, `aria-valuetext` with formatted percentage
  - **Numeric input**: `<input type="text" inputMode="decimal" />` with local `inputValue` state, blur/Enter commit, non-numeric rejection
  - **Lock toggle**: `<button>` with lock/unlock icon (inline SVG or Unicode), `aria-label`, `disabled={!canLock}`, dispatches `TOGGLE_LOCK`
  - **Display**: Label, formatted percentage, formatted absolute value ("тис.")
  - **Disabled state**: When `isLocked`, range input has `disabled` attribute, numeric input has `readOnly`, visual dimming via Tailwind opacity classes
  - **Clamping**: Numeric input value clamped to [0, 100] on commit; range input inherently clamped by `min`/`max`
- **Barrel export**: Create `src/components/index.ts` with `export { Slider } from './Slider';`
- **Verification**: `pnpm build --filter @template/labor-market-dashboard` succeeds; `pnpm lint --filter @template/labor-market-dashboard` passes

### Step 6 -- Create Slider component tests (`src/__tests__/components/Slider.test.tsx`)

- **Files**: Create `src/__tests__/components/Slider.test.tsx`
- **What**: ~15 test cases using React Testing Library + user-event:
  - **Rendering**: Displays label, percentage, absolute value in correct format
  - **Range input**: Changing range input value dispatches SET_PERCENTAGE with nodeId and numeric value
  - **Numeric input**: Typing and blurring dispatches SET_PERCENTAGE; Enter key commits
  - **Numeric input clamping**: Values > 100 clamped to 100; negative values clamped to 0; NaN rejected (reverts to prop value)
  - **Numeric input partial typing**: Typing "45." does not dispatch until commit
  - **Lock toggle**: Click dispatches TOGGLE_LOCK; disabled when canLock=false
  - **Locked state**: Range input disabled, numeric input readOnly, lock button shows locked icon
  - **Accessibility**: Range input has aria-label matching node label; lock button has accessible name
  - **Display formatting**: Large absolute values show "тис." abbreviation
  - All tests use `vi.fn()` for dispatch mock; no real reducer needed
- **Verification**: `pnpm test --filter @template/labor-market-dashboard` -- all Slider tests pass

### Step 7 -- Final verification

- Run `pnpm lint --filter @template/labor-market-dashboard` -- no errors
- Run `pnpm test --filter @template/labor-market-dashboard` -- all tests pass (existing ~96 + ~23 new = ~119 total)
- Run `pnpm build --filter @template/labor-market-dashboard` -- builds successfully
- Verify no `any` types used
- Verify Slider.tsx is under 200 lines
- Verify `.tsx` extension used only for files with JSX (Slider.tsx, Slider.test.tsx)

## Complexity Assessment

- **Estimated effort**: 1.5 days
  - Step 1-2 (format utility + tests): 0.25 day
  - Step 3 (test deps + vitest config): 0.25 day
  - Step 4 (CSS): 0.25 day
  - Step 5 (Slider component): 0.5 day
  - Step 6 (Slider tests): 0.25 day
- **Risk level**: Low
  - The component is straightforward; all state logic already exists in task-004
  - Cross-browser slider styling is well-documented
  - No new architectural patterns introduced
- **Dependencies**:
  - task-004 (state management) -- COMPLETED
  - New devDependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`

## Test Strategy

- **Unit tests** (`format.test.ts`, ~8 tests):
  - `formatAbsoluteValue` with boundary values, large numbers, small numbers, zero
  - `formatPercentage` with standard, zero, 100, integer values
- **Component tests** (`Slider.test.tsx`, ~15 tests):
  - Render verification (label, values, formatting)
  - User interactions (drag, type, lock toggle)
  - Edge cases (clamping, NaN, locked state, canLock=false)
  - Accessibility assertions (aria-label, button names)
  - Integration with dispatch mock (correct action types and payloads)
- **No integration tests**: The Slider is a presentational component that dispatches actions. Integration with the real reducer is tested in task-004's useTreeState tests. The Slider tests verify it dispatches the correct actions with correct values.
- **No E2E tests**: Not needed for a single component. E2E will be added when the full dashboard is assembled.

## Open Technical Questions

None. All open questions have been resolved as TL decisions (Q1, Q2) or by the user via PO (Q3, Q4, Q5).
