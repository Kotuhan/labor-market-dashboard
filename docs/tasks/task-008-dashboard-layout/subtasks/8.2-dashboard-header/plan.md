# Implementation Plan: Subtask 8.2 -- DashboardHeader Component

Generated: 2026-02-17

## Overview

Create the DashboardHeader component: a sticky horizontal header bar composing the application title (as `<h1>` per arch-review condition 1), a total population numeric input, ModeToggle, and ResetButton. Follows the controlled input pattern established by Slider (local string state, useEffect sync, commit on blur/Enter).

## Files Summary

| Action | File |
|--------|------|
| Modify | `apps/labor-market-dashboard/src/utils/format.ts` |
| Modify | `apps/labor-market-dashboard/src/utils/index.ts` |
| Modify | `apps/labor-market-dashboard/src/__tests__/utils/format.test.ts` |
| Create | `apps/labor-market-dashboard/src/components/DashboardHeader.tsx` |
| Create | `apps/labor-market-dashboard/src/__tests__/components/DashboardHeader.test.tsx` |
| Modify | `apps/labor-market-dashboard/src/components/index.ts` |

## Prerequisite: Export `formatPopulation` from format.ts

The population input needs to display space-separated thousands (e.g., "13 500 000") -- NOT the abbreviated "13 500 тис." format from `formatAbsoluteValue`. The internal `formatWithSpaces` function in `format.ts` is private. We need a new public function `formatPopulation` that formats a raw integer with space-separated thousands groups (no abbreviation).

---

## File 1: `apps/labor-market-dashboard/src/utils/format.ts` (MODIFY)

**What changes**: Add a new exported `formatPopulation` function that formats an integer with space-separated thousands groups. This reuses the existing private `formatWithSpaces` helper.

**Code to add** (insert after the `formatPercentage` function, before the private `formatWithSpaces`):

```typescript
/**
 * Format a population value with space-separated thousands groups.
 *
 * Unlike formatAbsoluteValue, this does NOT abbreviate with "тис." --
 * it returns the full number with spaces. Used by the population input field.
 *
 * @example
 * formatPopulation(13_500_000) // "13 500 000"
 * formatPopulation(1_194_329)  // "1 194 329"
 * formatPopulation(500)        // "500"
 * formatPopulation(0)          // "0"
 *
 * @param value - The population value to format
 * @returns Formatted string with space-separated thousands
 */
export function formatPopulation(value: number): string {
  return formatWithSpaces(Math.round(value));
}
```

No other changes to format.ts. The private `formatWithSpaces` already handles the logic.

---

## File 2: `apps/labor-market-dashboard/src/utils/index.ts` (MODIFY)

**What changes**: Add `formatPopulation` to the existing value exports from `format.ts`.

**Current line** (find the format.ts export line):
```typescript
export { formatAbsoluteValue, formatPercentage } from './format';
```

**Replace with**:
```typescript
export { formatAbsoluteValue, formatPercentage, formatPopulation } from './format';
```

---

## File 3: `apps/labor-market-dashboard/src/__tests__/utils/format.test.ts` (MODIFY)

**What changes**: Add tests for `formatPopulation` following the existing test structure.

**Import update** -- current import:
```typescript
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';
```

**Replace with**:
```typescript
import { formatAbsoluteValue, formatPercentage, formatPopulation } from '@/utils/format';
```

**Code to add** (append after the existing `formatPercentage` describe block):

```typescript
// -------------------------------------------------------
// formatPopulation tests
// -------------------------------------------------------
describe('formatPopulation', () => {
  it('formats millions with space-separated groups', () => {
    expect(formatPopulation(13_500_000)).toBe('13 500 000');
  });

  it('formats values over one million', () => {
    expect(formatPopulation(1_194_329)).toBe('1 194 329');
  });

  it('formats thousands', () => {
    expect(formatPopulation(50_000)).toBe('50 000');
  });

  it('formats values under 1000 without separators', () => {
    expect(formatPopulation(500)).toBe('500');
  });

  it('formats zero', () => {
    expect(formatPopulation(0)).toBe('0');
  });

  it('rounds to nearest integer', () => {
    expect(formatPopulation(13_500_000.7)).toBe('13 500 001');
  });
});
```

---

## File 4: `apps/labor-market-dashboard/src/components/DashboardHeader.tsx` (CREATE)

**What changes**: New component file. ~90 lines.

### Props Interface

```typescript
/** Props for the DashboardHeader component. */
export interface DashboardHeaderProps {
  /** Total employed population (e.g., 13_500_000) */
  totalPopulation: number;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}
```

### Complete File

```typescript
import { useEffect, useState } from 'react';

import type { BalanceMode, TreeAction } from '@/types';
import { formatPopulation } from '@/utils/format';

import { ModeToggle } from './ModeToggle';
import { ResetButton } from './ResetButton';

/** Props for the DashboardHeader component. */
export interface DashboardHeaderProps {
  /** Total employed population (e.g., 13_500_000) */
  totalPopulation: number;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Dashboard header bar composing application title, total population input,
 * ModeToggle, and ResetButton.
 *
 * The application title is rendered as <h1> to maintain WCAG 1.3.1 heading
 * hierarchy (arch-review condition 1).
 *
 * Population input follows the Slider controlled input pattern:
 * local string state, useEffect sync from props, commit on blur/Enter.
 *
 * All interactive elements meet WCAG 2.5.5 44x44px minimum touch target.
 */
export function DashboardHeader({
  totalPopulation,
  balanceMode,
  dispatch,
}: DashboardHeaderProps) {
  const [inputValue, setInputValue] = useState(
    formatPopulation(totalPopulation),
  );
  const [isEditing, setIsEditing] = useState(false);

  // Sync inputValue from props when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatPopulation(totalPopulation));
    }
  }, [totalPopulation, isEditing]);

  /** Handle input change (just updates local state, no dispatch). */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  /** Handle input focus (mark editing to prevent prop sync). */
  function handleInputFocus() {
    setIsEditing(true);
  }

  /** Commit population input: parse, validate, dispatch or revert. */
  function commitInput() {
    setIsEditing(false);

    // Strip spaces and parse as integer
    const stripped = inputValue.replace(/\s/g, '');
    const parsed = parseInt(stripped, 10);

    if (isNaN(parsed) || parsed < 0) {
      // Revert to current prop value
      setInputValue(formatPopulation(totalPopulation));
      return;
    }

    dispatch({ type: 'SET_TOTAL_POPULATION', value: parsed });
    setInputValue(formatPopulation(parsed));
  }

  /** Handle Enter key on input. */
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900">
            Зайняте населення
          </h1>
          <input
            type="text"
            inputMode="numeric"
            value={isEditing ? inputValue : formatPopulation(totalPopulation)}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={commitInput}
            onKeyDown={handleInputKeyDown}
            aria-label="Загальна кількість зайнятих"
            className="h-11 w-40 rounded-lg border border-slate-300 px-3 text-center text-sm font-medium text-slate-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle balanceMode={balanceMode} dispatch={dispatch} />
          <ResetButton dispatch={dispatch} />
        </div>
      </div>
    </header>
  );
}
```

### Key Design Decisions

1. **`<h1>` for title**: Arch-review condition 1 mandates `<h1>` for "Зайняте населення" since the root header is being removed from TreePanel in subtask 8.3.

2. **Local string state pattern**: Identical to Slider. `inputValue` is a string (allows partial typing like "13 5"). `isEditing` flag prevents external prop sync from overwriting mid-typing state.

3. **Input parsing**: Strips all whitespace before parsing (`inputValue.replace(/\s/g, '')`), since the display format includes spaces as thousands separators.

4. **Negative value rejection**: `parsed < 0` check ensures only non-negative integers are accepted.

5. **`commitInput` on blur**: Enter key triggers blur via `e.currentTarget.blur()`, which calls `commitInput` through the `onBlur` handler. This prevents double-dispatch (same pattern as Slider).

6. **`inputMode="numeric"`**: Triggers numeric keyboard on mobile. Uses `"numeric"` (not `"decimal"`) since population is always an integer.

7. **Sticky header**: `sticky top-0 z-10` keeps the header visible during scroll.

8. **Touch target**: The input uses `h-11` (44px). ModeToggle and ResetButton already have 44px touch targets.

9. **No `useCallback`**: No memoized children that would benefit from referential stability (ModeToggle and ResetButton are not wrapped in `React.memo`).

---

## File 5: `apps/labor-market-dashboard/src/__tests__/components/DashboardHeader.test.tsx` (CREATE)

**What changes**: New test file. ~200 lines. Follows ModeToggle.test.tsx and ResetButton.test.tsx patterns.

### Complete File

```typescript
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardHeader } from '@/components/DashboardHeader';
import type { DashboardHeaderProps } from '@/components/DashboardHeader';
import type { TreeAction } from '@/types';

/** Create default props for the DashboardHeader component. */
function makeProps(
  overrides?: Partial<DashboardHeaderProps>,
): DashboardHeaderProps {
  return {
    totalPopulation: 13_500_000,
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
describe('DashboardHeader rendering', () => {
  it('renders application title as h1', () => {
    render(<DashboardHeader {...makeProps()} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Зайняте населення');
  });

  it('renders population input with formatted default value', () => {
    render(<DashboardHeader {...makeProps()} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    expect(input).toHaveValue('13 500 000');
  });

  it('renders ModeToggle', () => {
    render(<DashboardHeader {...makeProps()} />);

    expect(screen.getByRole('switch', { name: 'Balance mode' })).toBeInTheDocument();
  });

  it('renders ResetButton', () => {
    render(<DashboardHeader {...makeProps()} />);

    expect(
      screen.getByRole('button', { name: /скинути до початкових значень/i }),
    ).toBeInTheDocument();
  });

  it('renders as a header element', () => {
    render(<DashboardHeader {...makeProps()} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Population input -- valid input tests
// -------------------------------------------------------
describe('DashboardHeader population input -- valid input', () => {
  it('dispatches SET_TOTAL_POPULATION on valid input blur', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<DashboardHeader {...makeProps({ dispatch })} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '10000000');
    await user.tab(); // triggers blur

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_TOTAL_POPULATION',
      value: 10_000_000,
    });
  });

  it('dispatches SET_TOTAL_POPULATION on Enter key', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<DashboardHeader {...makeProps({ dispatch })} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '5000000');
    await user.keyboard('{Enter}');

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_TOTAL_POPULATION',
      value: 5_000_000,
    });
  });

  it('accepts space-separated input (strips spaces before parsing)', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<DashboardHeader {...makeProps({ dispatch })} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '10 000 000');
    await user.tab();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_TOTAL_POPULATION',
      value: 10_000_000,
    });
  });

  it('dispatches exactly once per commit', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<DashboardHeader {...makeProps({ dispatch })} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '5000000');
    await user.keyboard('{Enter}');

    // Filter SET_TOTAL_POPULATION actions only (Enter triggers blur,
    // commitInput runs once via onBlur)
    const populationActions = dispatch.mock.calls.filter(
      (call) => call[0].type === 'SET_TOTAL_POPULATION',
    );
    expect(populationActions).toHaveLength(1);
  });
});

// -------------------------------------------------------
// Population input -- invalid input tests
// -------------------------------------------------------
describe('DashboardHeader population input -- invalid input', () => {
  it('reverts on non-numeric input', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(
      <DashboardHeader {...makeProps({ totalPopulation: 13_500_000, dispatch })} />,
    );

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();

    // Should NOT dispatch SET_TOTAL_POPULATION
    const populationActions = dispatch.mock.calls.filter(
      (call) => call[0].type === 'SET_TOTAL_POPULATION',
    );
    expect(populationActions).toHaveLength(0);

    // Input should revert to formatted prop value
    expect(input).toHaveValue('13 500 000');
  });

  it('reverts on negative input', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(
      <DashboardHeader {...makeProps({ totalPopulation: 13_500_000, dispatch })} />,
    );

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '-100');
    await user.tab();

    const populationActions = dispatch.mock.calls.filter(
      (call) => call[0].type === 'SET_TOTAL_POPULATION',
    );
    expect(populationActions).toHaveLength(0);

    expect(input).toHaveValue('13 500 000');
  });

  it('reverts on empty input', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(
      <DashboardHeader {...makeProps({ totalPopulation: 13_500_000, dispatch })} />,
    );

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.tab();

    const populationActions = dispatch.mock.calls.filter(
      (call) => call[0].type === 'SET_TOTAL_POPULATION',
    );
    expect(populationActions).toHaveLength(0);

    expect(input).toHaveValue('13 500 000');
  });
});

// -------------------------------------------------------
// Population input -- prop sync tests
// -------------------------------------------------------
describe('DashboardHeader population input -- prop sync', () => {
  it('updates displayed value when totalPopulation prop changes', () => {
    const { rerender } = render(
      <DashboardHeader {...makeProps({ totalPopulation: 13_500_000 })} />,
    );

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    expect(input).toHaveValue('13 500 000');

    rerender(
      <DashboardHeader {...makeProps({ totalPopulation: 10_000_000 })} />,
    );

    expect(input).toHaveValue('10 000 000');
  });
});

// -------------------------------------------------------
// Accessibility tests
// -------------------------------------------------------
describe('DashboardHeader accessibility', () => {
  it('population input has aria-label', () => {
    render(<DashboardHeader {...makeProps()} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    expect(input).toBeInTheDocument();
  });

  it('population input has h-11 class for 44px touch target', () => {
    render(<DashboardHeader {...makeProps()} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    expect(input.className).toContain('h-11');
  });

  it('title is the first heading on the page', () => {
    render(<DashboardHeader {...makeProps()} />);

    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveTextContent('Зайняте населення');
    expect(headings[0].tagName).toBe('H1');
  });
});
```

### Test Count: ~16 tests

| Category | Count |
|----------|-------|
| Rendering | 5 |
| Valid input | 4 |
| Invalid input | 3 |
| Prop sync | 1 |
| Accessibility | 3 |
| **Total** | **16** |

### Test Design Notes

1. **No ResizeObserver mock needed**: DashboardHeader does not render PieChartPanel or any Recharts component.

2. **`dispatch.mock.calls.filter`**: When testing that SET_TOTAL_POPULATION is dispatched exactly once, we filter by action type because ModeToggle and ResetButton also receive the same dispatch reference.

3. **Enter-then-blur dispatch flow**: Enter calls `e.currentTarget.blur()` which triggers `onBlur` -> `commitInput`. The function runs exactly once because `handleInputKeyDown` only calls `blur()`, it does not call `commitInput` directly. The `onBlur` handler is `commitInput`, so the dispatch happens once via the blur event.

4. **`screen.getByRole('banner')`**: The `<header>` HTML element maps to the `banner` ARIA role. If this assertion fails in the test environment (because `<header>` is not a direct child of `<body>`), replace with `container.querySelector('header')` assertion instead.

---

## File 6: `apps/labor-market-dashboard/src/components/index.ts` (MODIFY)

**What changes**: Add DashboardHeader barrel exports (value + type) per arch-review condition 2.

**Code to add** (insert alphabetically, after ChartTooltip exports):

```typescript
export { DashboardHeader } from './DashboardHeader';
export type { DashboardHeaderProps } from './DashboardHeader';
```

**Full file after modification**:

```typescript
export { ChartLegend } from './ChartLegend';
export type { ChartLegendProps, LegendItem } from './ChartLegend';

export { ChartTooltip } from './ChartTooltip';
export type { ChartTooltipProps } from './ChartTooltip';

export { DashboardHeader } from './DashboardHeader';
export type { DashboardHeaderProps } from './DashboardHeader';

export { ModeToggle } from './ModeToggle';
export type { ModeToggleProps } from './ModeToggle';

export { PieChartPanel } from './PieChartPanel';
export type { PieChartPanelProps } from './PieChartPanel';

export { ResetButton } from './ResetButton';
export type { ResetButtonProps } from './ResetButton';

export { Slider } from './Slider';
export type { SliderProps } from './Slider';

export { TreePanel } from './TreePanel';
export type { TreePanelProps } from './TreePanel';

export { TreeRow } from './TreeRow';
export type { TreeRowProps } from './TreeRow';
```

---

## Implementation Order

1. **format.ts** -- Add `formatPopulation` export
2. **utils/index.ts** -- Add `formatPopulation` to barrel
3. **format.test.ts** -- Add `formatPopulation` tests, run tests to verify
4. **DashboardHeader.tsx** -- Create the component
5. **components/index.ts** -- Add barrel exports
6. **DashboardHeader.test.tsx** -- Create the test file, run tests to verify

## Patterns to Follow

| Pattern | Reference File | What to Match |
|---------|---------------|---------------|
| Controlled input with local string state | `Slider.tsx` lines 45-53 | `useState(string)`, `isEditing` flag, `useEffect` sync |
| Commit on blur/Enter | `Slider.tsx` lines 72-95 | Enter calls `blur()`, `onBlur` calls `commitInput` |
| Props interface with JSDoc | `ModeToggle.tsx` lines 4-9 | JSDoc on interface and each field |
| Component JSDoc | `ResetButton.tsx` lines 9-15 | Multi-line JSDoc describing behavior |
| Import ordering | `Slider.tsx` lines 1-4 | React first, `@/` aliases second (blank line), relative third |
| `makeProps()` test factory | `ModeToggle.test.tsx` lines 10-16 | `Partial<Props>` overrides pattern |
| `vi.fn` dispatch mock | `ModeToggle.test.tsx` line 68 | `vi.fn<(action: TreeAction) => void>()` |
| Test section separators | `ResetButton.test.tsx` | `// -------` comment blocks between describe groups |
| Touch target assertion | `ModeToggle.test.tsx` line 141 | `className.toContain('h-11')` |
| `afterEach(cleanup)` | All test files | Explicit cleanup (globals: false) |

## Arch-Review Conditions Compliance

| Condition | How Addressed |
|-----------|--------------|
| 1. Title MUST be `<h1>` | Component renders `<h1 className="text-lg font-bold text-slate-900">Зайняте населення</h1>`. Test asserts `getByRole('heading', { level: 1 })`. |
| 2. Barrel exports with value + type | `components/index.ts` includes `export { DashboardHeader }` and `export type { DashboardHeaderProps }`. |

## Potential Issues

1. **`<header>` role in RTL**: The `<header>` element has `banner` role only when it is a direct child of `<body>`. In RTL, components render inside a `<div>` container. If `getByRole('banner')` fails in tests, replace with `container.querySelector('header')` assertion instead.

2. **Zero population**: A user could type "0" which parses as a valid non-negative integer. The reducer will set `totalPopulation: 0` and all absolute values become 0. This is mathematically correct but may be unexpected. No guard is added per the acceptance criteria (only "valid number" is required).

3. **Very large numbers**: No upper bound is enforced. The reducer handles any positive integer. If desired, a max cap (e.g., 100_000_000) could be added later.

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
