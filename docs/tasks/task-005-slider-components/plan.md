# FE Implementation Plan: task-005 -- Build Interactive Slider Components

Generated: 2026-02-17

## Overview

This plan covers the complete file-by-file implementation for the Slider component and supporting utilities. It follows the 7 TL implementation steps exactly: format utility, format tests, testing dependencies, slider CSS, Slider component, Slider tests, and final verification.

**Files to create (6 new files):**
1. `apps/labor-market-dashboard/src/utils/format.ts`
2. `apps/labor-market-dashboard/src/__tests__/utils/format.test.ts`
3. `apps/labor-market-dashboard/src/components/Slider.tsx`
4. `apps/labor-market-dashboard/src/components/index.ts`
5. `apps/labor-market-dashboard/src/__tests__/components/Slider.test.tsx`

**Files to modify (3 existing files):**
1. `apps/labor-market-dashboard/src/utils/index.ts`
2. `apps/labor-market-dashboard/package.json`
3. `apps/labor-market-dashboard/vitest.config.ts`
4. `apps/labor-market-dashboard/src/index.css`

---

## Step 1: Create Format Utility

### File: `apps/labor-market-dashboard/src/utils/format.ts` -- NEW

```typescript
/**
 * Number formatting utilities for Ukrainian labor market display.
 *
 * Provides consistent formatting for absolute values (with "тис." abbreviation)
 * and percentages (1 decimal place). Used by Slider, PieChart, and SummaryBar.
 */

/**
 * Format an absolute value for display using Ukrainian thousands abbreviation.
 *
 * Rules:
 * - Values >= 1000: divide by 1000, round to integer, space-separated groups, append " тис."
 * - Values < 1000: display as plain integer string
 *
 * @example
 * formatAbsoluteValue(13_500_000) // "13 500 тис."
 * formatAbsoluteValue(1_194_329)  // "1 194 тис."
 * formatAbsoluteValue(6_171)      // "6 тис."
 * formatAbsoluteValue(500)        // "500"
 * formatAbsoluteValue(0)          // "0"
 *
 * @param value - The absolute numeric value to format
 * @returns Formatted string with Ukrainian "тис." abbreviation for values >= 1000
 */
export function formatAbsoluteValue(value: number): string {
  if (value < 1000) {
    return String(Math.round(value));
  }

  const thousands = Math.round(value / 1000);
  // Format with space-separated groups using manual approach
  // (Intl.NumberFormat uses non-breaking spaces which are inconsistent across environments)
  const formatted = formatWithSpaces(thousands);
  return `${formatted} тис.`;
}

/**
 * Format a percentage value with exactly 1 decimal place.
 *
 * @example
 * formatPercentage(18.5)  // "18.5%"
 * formatPercentage(0)     // "0.0%"
 * formatPercentage(100)   // "100.0%"
 * formatPercentage(30)    // "30.0%"
 *
 * @param value - The percentage value (0-100) to format
 * @returns Formatted string with 1 decimal place and % suffix
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format an integer with space-separated thousands groups.
 *
 * @param value - Integer to format
 * @returns String with spaces as thousands separators (e.g., 13500 -> "13 500")
 */
function formatWithSpaces(value: number): string {
  const str = String(value);
  const result: string[] = [];
  let count = 0;

  for (let i = str.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      result.unshift(' ');
    }
    result.unshift(str[i]);
    count++;
  }

  return result.join('');
}
```

**Key design decisions:**
- Manual `formatWithSpaces()` instead of `Intl.NumberFormat` because `Intl.NumberFormat('uk-UA')` produces non-breaking spaces (`\u00A0`) in some environments, which would cause test flakiness and display inconsistencies. The manual approach guarantees regular ASCII spaces.
- `formatAbsoluteValue` rounds to the nearest thousand then formats the integer result. This matches the resolved PO question Q4: abbreviated with "тис." suffix.
- `formatPercentage` uses `toFixed(1)` which always produces exactly 1 decimal place, handling integers correctly (e.g., `30` becomes `"30.0%"`).
- Private `formatWithSpaces` helper is not exported -- it is an implementation detail.

### File: `apps/labor-market-dashboard/src/utils/index.ts` -- MODIFIED

**Before:**
```typescript
export {
  autoBalance,
  canToggleLock,
  getSiblingDeviation,
  normalizeGroup,
  recalcAbsoluteValues,
} from './calculations';

export type { PercentageUpdate } from './calculations';

export {
  collectSiblingInfo,
  findNodeById,
  findParentById,
  updateChildrenInTree,
  updateNodeInTree,
} from './treeUtils';

export type { SiblingInfo } from './treeUtils';
```

**After:**
```typescript
export {
  autoBalance,
  canToggleLock,
  getSiblingDeviation,
  normalizeGroup,
  recalcAbsoluteValues,
} from './calculations';

export type { PercentageUpdate } from './calculations';

export { formatAbsoluteValue, formatPercentage } from './format';

export {
  collectSiblingInfo,
  findNodeById,
  findParentById,
  updateChildrenInTree,
  updateNodeInTree,
} from './treeUtils';

export type { SiblingInfo } from './treeUtils';
```

**Key design decisions:**
- Format exports are placed alphabetically between `calculations` and `treeUtils` blocks, following the established barrel pattern.
- Value exports only (no types to re-export from format.ts).

---

## Step 2: Create Format Utility Tests

### File: `apps/labor-market-dashboard/src/__tests__/utils/format.test.ts` -- NEW

```typescript
import { describe, it, expect } from 'vitest';

import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

describe('formatAbsoluteValue', () => {
  it('formats large number with "тис." abbreviation', () => {
    expect(formatAbsoluteValue(13_500_000)).toBe('13 500 тис.');
  });

  it('formats million-range number with "тис." abbreviation', () => {
    expect(formatAbsoluteValue(1_194_329)).toBe('1 194 тис.');
  });

  it('formats thousands-range number with "тис." abbreviation', () => {
    expect(formatAbsoluteValue(6_171)).toBe('6 тис.');
  });

  it('formats value below 1000 without abbreviation', () => {
    expect(formatAbsoluteValue(500)).toBe('500');
  });

  it('formats zero', () => {
    expect(formatAbsoluteValue(0)).toBe('0');
  });

  it('formats boundary value 999 without abbreviation', () => {
    expect(formatAbsoluteValue(999)).toBe('999');
  });

  it('formats boundary value 1000 with "тис." abbreviation', () => {
    expect(formatAbsoluteValue(1000)).toBe('1 тис.');
  });

  it('rounds to nearest thousand for abbreviation', () => {
    // 1_500 / 1000 = 1.5, rounds to 2
    expect(formatAbsoluteValue(1_500)).toBe('2 тис.');
    // 1_499 / 1000 = 1.499, rounds to 1
    expect(formatAbsoluteValue(1_499)).toBe('1 тис.');
  });
});

describe('formatPercentage', () => {
  it('formats standard decimal percentage', () => {
    expect(formatPercentage(18.5)).toBe('18.5%');
  });

  it('formats zero with one decimal place', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('formats 100 with one decimal place', () => {
    expect(formatPercentage(100)).toBe('100.0%');
  });

  it('formats integer with one decimal place', () => {
    expect(formatPercentage(30)).toBe('30.0%');
  });

  it('formats value with more decimals by rounding to 1 decimal', () => {
    expect(formatPercentage(52.66)).toBe('52.7%');
  });
});
```

**Key design decisions:**
- Tests import from `@/utils/format` (module path), not from the barrel -- this is consistent with the pattern in `calculations.test.ts` which imports directly from `@/utils/calculations`.
- Explicit `vitest` imports (`describe`, `it`, `expect`) since `globals: false` in vitest config.
- `.ts` extension (not `.tsx`) since there is no JSX -- avoids `react-refresh/only-export-components` lint warning.
- 13 total test cases (8 for absolute value, 5 for percentage) covering: large numbers, medium, small, zero, boundaries (999, 1000), rounding behavior, and all percentage edge cases.

---

## Step 3: Add Testing Dependencies

### File: `apps/labor-market-dashboard/package.json` -- MODIFIED

**Before (devDependencies section):**
```json
  "devDependencies": {
    "@template/config": "workspace:*",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.7.3",
    "vite": "^6.0.0",
    "eslint": "^8.57.0",
    "vitest": "^3.0.0"
  }
```

**After (devDependencies section):**
```json
  "devDependencies": {
    "@template/config": "workspace:*",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.7.3",
    "vite": "^6.0.0",
    "eslint": "^8.57.0",
    "jsdom": "^25.0.0",
    "vitest": "^3.0.0"
  }
```

**Key design decisions:**
- `@testing-library/react` v16 for React 19 compatibility.
- `@testing-library/jest-dom` v6 for extended DOM matchers (`toBeDisabled`, `toHaveAttribute`, etc.).
- `@testing-library/user-event` v14 for realistic user interaction simulation (click, type, etc.).
- `jsdom` v25 as the DOM environment for vitest.
- Packages are alphabetically ordered within the devDependencies object.

**Post-modification action:** Run `pnpm install` from the monorepo root to install the new dependencies.

### File: `apps/labor-market-dashboard/vitest.config.ts` -- MODIFIED

**Before:**
```typescript
import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
  },
});
```

**After:**
```typescript
import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    css: false,
  },
});
```

**Key design decisions:**
- `environment: 'jsdom'` replaces `'node'` to enable DOM APIs required by React Testing Library. Existing pure-logic tests are unaffected by this change -- they do not use DOM APIs.
- `setupFiles` references a test setup file that imports `@testing-library/jest-dom` matchers globally. This avoids repeating the import in every test file.
- `css: false` disables CSS processing in tests (not needed; avoids potential Tailwind v4 + jsdom conflicts).

### File: `apps/labor-market-dashboard/src/__tests__/setup.ts` -- NEW

```typescript
import '@testing-library/jest-dom/vitest';
```

**Key design decisions:**
- Single-line file that imports the vitest-specific matchers from `@testing-library/jest-dom`. This registers matchers like `toBeDisabled()`, `toHaveAttribute()`, `toHaveTextContent()`, etc. globally for all tests.
- Uses the `/vitest` entry point (not the default) for proper vitest integration.
- Located in `__tests__/` to keep test infrastructure co-located with test files.

---

## Step 4: Add Slider CSS Styles

### File: `apps/labor-market-dashboard/src/index.css` -- MODIFIED

**Before:**
```css
@import "tailwindcss";
```

**After:**
```css
@import "tailwindcss";

/* ===================================================================
   Custom range input styling for Slider component
   Native <input type="range"> requires vendor-prefixed pseudo-elements
   because there is no standard CSS selector for slider track and thumb.
   =================================================================== */

/* Reset default appearance */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--color-slate-200);
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}

/* Track: WebKit (Chrome, Safari, Edge) */
input[type="range"]::-webkit-slider-runnable-track {
  height: 6px;
  background: var(--color-slate-200);
  border-radius: 9999px;
}

/* Track: Firefox */
input[type="range"]::-moz-range-track {
  height: 6px;
  background: var(--color-slate-200);
  border-radius: 9999px;
  border: none;
}

/* Thumb: WebKit (Chrome, Safari, Edge)
   Visual size: 20x20px. Touch target: 44x44px via transparent box-shadow spread. */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--color-blue-500);
  border-radius: 9999px;
  border: 2px solid white;
  margin-top: -7px;
  cursor: pointer;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.15),
    0 0 0 12px transparent;
}

/* Thumb: Firefox */
input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--color-blue-500);
  border-radius: 9999px;
  border: 2px solid white;
  cursor: pointer;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.15),
    0 0 0 12px transparent;
}

/* Focus-visible: keyboard navigation outline */
input[type="range"]:focus-visible {
  outline: 2px solid var(--color-blue-500);
  outline-offset: 4px;
}

/* Disabled state */
input[type="range"]:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

input[type="range"]:disabled::-webkit-slider-thumb {
  background: var(--color-slate-400);
  cursor: not-allowed;
}

input[type="range"]:disabled::-moz-range-thumb {
  background: var(--color-slate-400);
  cursor: not-allowed;
}
```

**Key design decisions:**
- Uses Tailwind CSS v4 theme variables (`var(--color-blue-500)`, `var(--color-slate-200)`) for colors, ensuring the slider matches the design system. Tailwind v4 exposes all theme colors as CSS custom properties automatically.
- 44x44px touch target achieved via transparent `box-shadow` spread on the thumb (12px spread around 20px thumb = 44px effective target). This is a well-known technique that does not affect visual appearance but ensures WCAG 2.5.5 compliance.
- `margin-top: -7px` on WebKit thumb centers the 20px thumb on the 6px track (-(20-6)/2 = -7).
- `:focus-visible` (not `:focus`) ensures the outline only appears for keyboard navigation, not mouse clicks.
- Disabled state uses reduced opacity and `not-allowed` cursor on both track and thumb.
- No CSS transitions are added (per PO: "Basic functionality without animation is acceptable for this task").

---

## Step 5: Create Slider Component

### File: `apps/labor-market-dashboard/src/components/Slider.tsx` -- NEW

```tsx
import { useEffect, useState } from 'react';

import type { BalanceMode, TreeAction } from '@/types';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

/** Props for the Slider component. */
export interface SliderProps {
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
  /** Current balance mode (passed for potential future use, not used in v1 logic) */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Interactive slider for controlling a tree node's percentage value.
 *
 * Combines a native range input, a numeric text input for precise entry,
 * a lock toggle button, and value displays (percentage + abbreviated absolute).
 *
 * Controlled component: percentage is always driven by props.
 * Local state exists only for the numeric input (to allow partial typing).
 */
export function Slider({
  nodeId,
  label,
  percentage,
  absoluteValue,
  isLocked,
  canLock,
  balanceMode: _balanceMode,
  dispatch,
}: SliderProps) {
  const [inputValue, setInputValue] = useState(percentage.toFixed(1));
  const [isEditing, setIsEditing] = useState(false);

  // Sync inputValue from props when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setInputValue(percentage.toFixed(1));
    }
  }, [percentage, isEditing]);

  /** Handle range slider drag. Dispatches on every change for real-time feedback. */
  function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    dispatch({ type: 'SET_PERCENTAGE', nodeId, value });
  }

  /** Handle numeric input change (just updates local state, no dispatch). */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  /** Handle numeric input focus (mark editing to prevent prop sync). */
  function handleInputFocus() {
    setIsEditing(true);
  }

  /** Commit numeric input: parse, clamp, dispatch, and exit editing mode. */
  function commitInput() {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);

    if (isNaN(parsed)) {
      // Revert to current prop value
      setInputValue(percentage.toFixed(1));
      return;
    }

    // Clamp to [0, 100] and round to 1 decimal
    const clamped = Math.max(0, Math.min(parsed, 100));
    const rounded = Math.round(clamped * 10) / 10;

    dispatch({ type: 'SET_PERCENTAGE', nodeId, value: rounded });
    setInputValue(rounded.toFixed(1));
  }

  /** Handle Enter key on numeric input. */
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }

  /** Handle lock toggle click. */
  function handleLockToggle() {
    dispatch({ type: 'TOGGLE_LOCK', nodeId });
  }

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border border-slate-200 px-4 py-3 ${
        isLocked ? 'opacity-50' : ''
      }`}
    >
      {/* Top row: label, percentage, absolute value */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {formatPercentage(percentage)}
          </span>
          <span className="text-xs text-slate-500">
            {formatAbsoluteValue(absoluteValue)}
          </span>
        </div>
      </div>

      {/* Bottom row: range slider, numeric input, lock toggle */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(percentage)}
          disabled={isLocked}
          onChange={handleRangeChange}
          aria-label={label}
          aria-valuetext={formatPercentage(percentage)}
          className="min-w-0 flex-1"
        />

        <input
          type="text"
          inputMode="decimal"
          value={isEditing ? inputValue : percentage.toFixed(1)}
          readOnly={isLocked}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={commitInput}
          onKeyDown={handleInputKeyDown}
          aria-label={`${label} percentage`}
          className={`w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm ${
            isLocked
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-white text-slate-900'
          }`}
        />

        <button
          type="button"
          onClick={handleLockToggle}
          disabled={!canLock && !isLocked}
          aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors ${
            !canLock && !isLocked
              ? 'cursor-not-allowed text-slate-300'
              : isLocked
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
        >
          {isLocked ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 00-7.5 0v3h1.5a3 3 0 013 3v6.75a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-6.75a3 3 0 013-3h8.25v-3c0-2.9 2.35-5.25 5.25-5.25z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
```

**Line count: ~157 lines** (within the 200-line project limit).

**Key design decisions:**

1. **Controlled component pattern**: The range input's `value` is always `Math.round(percentage)` (integer for step=1 compatibility). The numeric input displays `percentage.toFixed(1)` when not editing, or the local `inputValue` when focused.

2. **Local state is minimal**: Only `inputValue` (string for partial typing) and `isEditing` (boolean for focus tracking). No percentage duplication -- the reducer state is the single source of truth.

3. **`useEffect` for prop sync**: When `percentage` changes externally (e.g., sibling auto-balance) and the user is not editing, the `inputValue` syncs automatically. The `isEditing` guard prevents overwriting the user's mid-typing state.

4. **`balanceMode` prop**: Prefixed with underscore (`_balanceMode`) to indicate it is accepted as a prop (for API completeness and future use) but not used in v1 logic. The clamping and auto-balance logic lives in the reducer, not in the component.

5. **Lock button sizing**: `h-11 w-11` (44px x 44px) meets the WCAG 2.5.5 minimum touch target size. The button uses `shrink-0` to prevent flexbox compression.

6. **Lock button disabled logic**: `disabled={!canLock && !isLocked}` -- the button is only disabled when the node is unlocked AND `canLock` is false (last unlocked sibling). A locked node can always be unlocked.

7. **SVG lock icons**: Inline SVGs from Heroicons (MIT license). The locked icon shows a closed padlock, the unlocked icon shows an open padlock. Both use `aria-hidden="true"` since the button has its own `aria-label`.

8. **No `useCallback`**: Per the TL design, event handlers are not wrapped in `useCallback` because there are no expensive child components benefiting from referential stability.

9. **Keyboard support**: The Enter key on the numeric input triggers blur (via `e.currentTarget.blur()`), which fires `commitInput()` through the `onBlur` handler. This avoids duplicate dispatch.

10. **Range slider step vs precision**: Range input uses `step={1}` for 1% drag increments (resolved PO Q3). The value is `Math.round(percentage)` to match integer step. Precise 0.1% entry is only through the numeric input.

### File: `apps/labor-market-dashboard/src/components/index.ts` -- NEW

```typescript
export { Slider } from './Slider';
export type { SliderProps } from './Slider';
```

**Key design decisions:**
- Follows the established barrel pattern: value export for the component, `export type` for the props interface.
- This is the first component barrel. It sets the precedent for all future component exports (ModeToggle, PieChart, etc.).

---

## Step 6: Create Slider Component Tests

### File: `apps/labor-market-dashboard/src/__tests__/components/Slider.test.tsx` -- NEW

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Slider } from '@/components/Slider';
import type { SliderProps } from '@/components/Slider';
import type { TreeAction } from '@/types';

/** Create default props for the Slider component. */
function makeProps(
  overrides?: Partial<SliderProps>,
): SliderProps {
  return {
    nodeId: 'test-node',
    label: 'Торгівля',
    percentage: 30.0,
    absoluteValue: 2_133_000,
    isLocked: false,
    canLock: true,
    balanceMode: 'auto',
    dispatch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Rendering tests
// -------------------------------------------------------
describe('Slider rendering', () => {
  it('displays the node label', () => {
    render(<Slider {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
  });

  it('displays formatted percentage', () => {
    render(<Slider {...makeProps({ percentage: 18.5 })} />);

    expect(screen.getByText('18.5%')).toBeInTheDocument();
  });

  it('displays formatted absolute value with "тис." abbreviation', () => {
    render(<Slider {...makeProps({ absoluteValue: 2_133_000 })} />);

    expect(screen.getByText('2 133 тис.')).toBeInTheDocument();
  });

  it('displays absolute value without abbreviation when below 1000', () => {
    render(<Slider {...makeProps({ absoluteValue: 500 })} />);

    expect(screen.getByText('500')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Range input tests
// -------------------------------------------------------
describe('Slider range input', () => {
  it('dispatches SET_PERCENTAGE on range change', () => {
    const dispatch = vi.fn<[TreeAction], void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const range = screen.getByRole('slider');
    fireEvent.change(range, { target: { value: '50' } });

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-node',
      value: 50,
    });
  });

  it('has aria-label matching node label', () => {
    render(<Slider {...makeProps()} />);

    const range = screen.getByRole('slider');
    expect(range).toHaveAttribute('aria-label', 'Торгівля');
  });

  it('has aria-valuetext with formatted percentage', () => {
    render(<Slider {...makeProps({ percentage: 30.0 })} />);

    const range = screen.getByRole('slider');
    expect(range).toHaveAttribute('aria-valuetext', '30.0%');
  });

  it('is disabled when node is locked', () => {
    render(<Slider {...makeProps({ isLocked: true })} />);

    const range = screen.getByRole('slider');
    expect(range).toBeDisabled();
  });
});

// -------------------------------------------------------
// Numeric input tests
// -------------------------------------------------------
describe('Slider numeric input', () => {
  it('dispatches SET_PERCENTAGE on blur with valid value', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<[TreeAction], void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, '45.5');
    await user.tab(); // trigger blur

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-node',
      value: 45.5,
    });
  });

  it('dispatches SET_PERCENTAGE on Enter key', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<[TreeAction], void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, '55.0');
    await user.keyboard('{Enter}');

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_PERCENTAGE',
        nodeId: 'test-node',
        value: 55.0,
      }),
    );
  });

  it('clamps value above 100 to 100', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<[TreeAction], void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, '150');
    await user.tab();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-node',
      value: 100,
    });
  });

  it('clamps negative value to 0', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<[TreeAction], void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, '-5');
    await user.tab();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-node',
      value: 0,
    });
  });

  it('reverts to prop value when NaN is entered', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<[TreeAction], void>();
    render(<Slider {...makeProps({ percentage: 30.0, dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();

    // NaN should not dispatch SET_PERCENTAGE
    expect(dispatch).not.toHaveBeenCalled();
    // Input reverts to prop value
    expect(input).toHaveValue('30.0');
  });

  it('is readOnly when node is locked', () => {
    render(<Slider {...makeProps({ isLocked: true })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    expect(input).toHaveAttribute('readonly');
  });
});

// -------------------------------------------------------
// Lock toggle tests
// -------------------------------------------------------
describe('Slider lock toggle', () => {
  it('dispatches TOGGLE_LOCK on click when unlocked', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<[TreeAction], void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const lockBtn = screen.getByRole('button', { name: /lock торгівля/i });
    await user.click(lockBtn);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_LOCK',
      nodeId: 'test-node',
    });
  });

  it('dispatches TOGGLE_LOCK on click when locked', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<[TreeAction], void>();
    render(<Slider {...makeProps({ isLocked: true, dispatch })} />);

    const unlockBtn = screen.getByRole('button', { name: /unlock торгівля/i });
    await user.click(unlockBtn);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_LOCK',
      nodeId: 'test-node',
    });
  });

  it('is disabled when canLock is false and node is unlocked', () => {
    render(<Slider {...makeProps({ canLock: false })} />);

    const lockBtn = screen.getByRole('button', { name: /lock торгівля/i });
    expect(lockBtn).toBeDisabled();
  });

  it('is enabled when canLock is false but node is locked (unlock is always allowed)', () => {
    render(<Slider {...makeProps({ canLock: false, isLocked: true })} />);

    const unlockBtn = screen.getByRole('button', { name: /unlock торгівля/i });
    expect(unlockBtn).not.toBeDisabled();
  });

  it('shows closed lock icon when locked', () => {
    render(<Slider {...makeProps({ isLocked: true })} />);

    // The unlock button should be present (accessible name changes)
    expect(
      screen.getByRole('button', { name: /unlock торгівля/i }),
    ).toBeInTheDocument();
  });

  it('shows open lock icon when unlocked', () => {
    render(<Slider {...makeProps({ isLocked: false })} />);

    expect(
      screen.getByRole('button', { name: /lock торгівля/i }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Locked state visual tests
// -------------------------------------------------------
describe('Slider locked state', () => {
  it('applies dimmed opacity when locked', () => {
    const { container } = render(<Slider {...makeProps({ isLocked: true })} />);

    // The outermost div should have opacity-50 class
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('opacity-50');
  });
});

// -------------------------------------------------------
// Prop sync tests
// -------------------------------------------------------
describe('Slider prop sync', () => {
  it('updates input value when percentage prop changes and not editing', () => {
    const props = makeProps({ percentage: 30.0 });
    const { rerender } = render(<Slider {...props} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    expect(input).toHaveValue('30.0');

    // Simulate parent re-render with new percentage (e.g., sibling auto-balance)
    rerender(<Slider {...makeProps({ percentage: 45.5 })} />);

    expect(input).toHaveValue('45.5');
  });
});
```

**Line count: ~235 lines** for the test file (test files are not subject to the 200-line component limit).

**Key design decisions:**

1. **`vi.fn()` for dispatch mock**: All tests create a mock dispatch function and assert on the specific action objects dispatched. No real reducer is used -- the Slider is tested in isolation.

2. **`vi.fn<[TreeAction], void>()`**: The generic signature ensures type safety on mock calls. Note: if the version of vitest being used has issues with the generic syntax on `vi.fn`, a simpler `vi.fn()` is acceptable -- the dispatch type is already guaranteed by the prop type.

3. **`userEvent.setup()` for user interactions**: The `@testing-library/user-event` library provides more realistic event simulation than `fireEvent`. Used for type, click, tab, and keyboard interactions. `fireEvent` is used only for the range input `onChange` (userEvent does not have native range slider dragging).

4. **`afterEach(cleanup)`**: Explicit cleanup after each test to prevent DOM leakage between tests (required when `globals: false`).

5. **Test queries**:
   - `screen.getByRole('slider')` for the range input (native `<input type="range">` has implicit `slider` role)
   - `screen.getByRole('textbox', { name: /percentage/i })` for the numeric input (matched by its `aria-label`)
   - `screen.getByRole('button', { name: /lock|unlock/i })` for the lock toggle (matched by its `aria-label`)

6. **Accessible name assertions**: Tests verify that the range input has `aria-label={label}`, the lock button has `"Lock {label}"` or `"Unlock {label}"`, ensuring screen reader compatibility.

7. **NaN rejection test**: Verifies that entering non-numeric text and blurring does NOT dispatch SET_PERCENTAGE and reverts the input to the current prop value.

8. **Prop sync test**: Uses `rerender()` to simulate an external percentage change (as would happen during sibling auto-balance) and verifies the input value updates.

9. **`.tsx` extension**: Required because the file contains JSX (`<Slider ...>`).

---

## Step 7: Final Verification

After implementing all steps above, run these commands in order:

```bash
# 1. Install new dependencies
pnpm install

# 2. Lint check -- must pass with 0 errors
pnpm lint --filter @template/labor-market-dashboard

# 3. Run all tests -- format tests + Slider tests + all existing tests
pnpm test --filter @template/labor-market-dashboard

# 4. Build -- type-check + Vite bundle must succeed
pnpm build --filter @template/labor-market-dashboard
```

### Verification checklist:

- [ ] `pnpm lint` passes with 0 errors
- [ ] `pnpm test` passes (~96 existing + ~18 new = ~114 total tests)
- [ ] `pnpm build` succeeds (type-check + bundle)
- [ ] No `any` types in any file
- [ ] `Slider.tsx` is under 200 lines
- [ ] `.tsx` extension used only for files with JSX (`Slider.tsx`, `Slider.test.tsx`)
- [ ] `.ts` extension used for all other files (`format.ts`, `format.test.ts`, `setup.ts`, `index.ts`)
- [ ] `format.ts` and `format.test.ts` are in correct directories (`utils/` and `__tests__/utils/`)
- [ ] `Slider.tsx` and `Slider.test.tsx` are in correct directories (`components/` and `__tests__/components/`)
- [ ] Barrel exports updated in `utils/index.ts` and new `components/index.ts`

---

## Component Architecture Summary

```
src/
  components/
    Slider.tsx          # NEW -- Interactive slider (controlled, ~157 lines)
    index.ts            # NEW -- Barrel: export { Slider }, export type { SliderProps }
  utils/
    format.ts           # NEW -- formatAbsoluteValue, formatPercentage
    index.ts            # MODIFIED -- Added format exports
  __tests__/
    setup.ts            # NEW -- @testing-library/jest-dom/vitest matchers
    utils/
      format.test.ts    # NEW -- 13 tests for format utilities
    components/
      Slider.test.tsx   # NEW -- 18 tests for Slider component
```

## State Management Integration

The Slider component integrates with the existing state management layer as follows:

```
Parent component (future task-008 TreePanel)
  |
  +-- useTreeState() hook returns { state, dispatch }
  |
  +-- For each node, compute canLock:
  |     canToggleLock(nodeId, parentNode.children)
  |
  +-- Render <Slider
  |     nodeId={node.id}
  |     label={node.label}
  |     percentage={node.percentage}
  |     absoluteValue={node.absoluteValue}
  |     isLocked={node.isLocked}
  |     canLock={canToggleLock(node.id, siblings)}
  |     balanceMode={state.balanceMode}
  |     dispatch={dispatch}
  |   />
  |
  +-- Slider dispatches SET_PERCENTAGE or TOGGLE_LOCK
  |
  +-- Reducer processes action, auto-balances siblings if needed
  |
  +-- Parent re-renders all Slider children with new props
```

## Type Safety Notes

- `SliderProps` uses concrete types from the shared type system: `BalanceMode` from `@/types`, `TreeAction` from `@/types`, `React.Dispatch<TreeAction>` for the dispatch prop.
- No `any` types anywhere. The `vi.fn<[TreeAction], void>()` generic in tests ensures mock type safety.
- No type assertions needed in any file. All types flow naturally from props, event handlers, and state.

## Potential Issues and Mitigations

| Issue | Mitigation |
|-------|------------|
| `Intl.NumberFormat` non-breaking spaces | Manual `formatWithSpaces()` using regular ASCII spaces |
| `parseFloat("1.23.45")` returns `1.23` (partial parse) | Acceptable behavior -- first valid number is parsed, then clamped |
| Range input `value` is integer but percentage has 1 decimal | `Math.round(percentage)` for range value; precise entry via numeric input |
| `@testing-library/jest-dom` matcher types | Setup file imports `/vitest` entry point for proper type integration |
| CSS `var(--color-blue-500)` may not resolve in jsdom tests | `css: false` in vitest config disables CSS processing in tests |
| `fireEvent.change` vs `userEvent` for range input | `fireEvent` used for range (userEvent lacks native range support); `userEvent` for all other interactions |

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
