# Implementation Plan: Subtask 8.1 -- ModeToggle + ResetButton

Generated: 2026-02-17

## Overview

Create two new leaf components: **ModeToggle** (auto/free balance mode toggle switch) and **ResetButton** (reset with browser `confirm()` dialog). Both are independent building blocks with no dependencies on other new components. Covers TL design Steps 1 and 2.

## Files to Create

| File | Description |
|------|-------------|
| `apps/labor-market-dashboard/src/components/ModeToggle.tsx` | Toggle switch for auto/free balance mode |
| `apps/labor-market-dashboard/src/components/ResetButton.tsx` | Reset button with confirm() guard |
| `apps/labor-market-dashboard/src/__tests__/components/ModeToggle.test.tsx` | Unit tests for ModeToggle |
| `apps/labor-market-dashboard/src/__tests__/components/ResetButton.test.tsx` | Unit tests for ResetButton |

## Files to Modify

| File | Change |
|------|--------|
| `apps/labor-market-dashboard/src/components/index.ts` | Add value + type barrel exports for ModeToggle and ResetButton |

## Patterns to Follow

All code patterns are derived from existing components in the codebase:

- **Controlled component pattern**: From `Slider.tsx` -- receive state as props, dispatch actions upward, no internal business state
- **Import ordering**: External packages first, then `@/` aliases (with blank line separator), then relative imports (from `Slider.tsx`, `TreeRow.tsx`)
- **Props interface**: Named export with JSDoc, `export interface XxxProps` (from `Slider.tsx` lines 7-24)
- **Named function export**: `export function Xxx(...)` (from `Slider.tsx` line 35)
- **Barrel exports**: Value + `export type` for props interface (from `components/index.ts`)
- **Test pattern**: `makeProps()` factory, `vi.fn()` dispatch mock, `afterEach(cleanup)`, `userEvent.setup()` (from `Slider.test.tsx`)
- **Vitest v3 mock syntax**: `vi.fn<(action: TreeAction) => void>()` (NOT the v2 tuple style)
- **Touch targets**: 44x44px minimum via `h-11 w-11` classes (from `Slider.tsx` lock button, `TreeRow.tsx` chevron button)
- **Type imports**: `import type { BalanceMode, TreeAction } from '@/types'` (from `Slider.tsx` line 3)

---

## Step 1: Create ModeToggle Component

### File: `apps/labor-market-dashboard/src/components/ModeToggle.tsx`

```tsx
import type { BalanceMode, TreeAction } from '@/types';

/** Props for the ModeToggle component. */
export interface ModeToggleProps {
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Toggle switch for auto/free balance mode.
 *
 * Controlled component: receives balanceMode and dispatches SET_BALANCE_MODE.
 * Uses role="switch" with aria-checked for screen reader accessibility.
 * Meets WCAG 2.5.5 44x44px minimum touch target.
 */
export function ModeToggle({ balanceMode, dispatch }: ModeToggleProps) {
  const isAuto = balanceMode === 'auto';

  function handleToggle() {
    dispatch({
      type: 'SET_BALANCE_MODE',
      mode: isAuto ? 'free' : 'auto',
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isAuto}
      aria-label="Balance mode"
      onClick={handleToggle}
      className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm transition-colors hover:bg-slate-50"
    >
      <span
        className={`font-medium ${isAuto ? 'text-blue-600' : 'text-slate-400'}`}
      >
        Авто
      </span>
      <div
        className="relative h-5 w-9 rounded-full bg-slate-200"
        aria-hidden="true"
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            isAuto ? 'translate-x-0.5' : 'translate-x-[1.125rem]'
          }`}
        />
      </div>
      <span
        className={`font-medium ${!isAuto ? 'text-blue-600' : 'text-slate-400'}`}
      >
        Вільний
      </span>
    </button>
  );
}
```

**Key design decisions:**

1. **`role="switch"` with `aria-checked`**: Semantically correct for a binary toggle. `aria-checked={isAuto}` means "checked = auto mode is active". This is preferable to `aria-pressed` (which is for toggle buttons, not switches).
2. **Visual toggle track**: The inner `<div>` with `aria-hidden="true"` is a decorative track element. It uses `translate-x` to slide the knob between positions.
3. **Labels "Авто" / "Вільний"**: Ukrainian labels per TL design. Active mode gets `text-blue-600`, inactive gets `text-slate-400`.
4. **Touch target**: `h-11` ensures the button is at least 44px tall. Horizontal padding (`px-3`) plus content width ensures >= 44px wide.
5. **No `useCallback`**: Not needed -- this component is not wrapped in `React.memo` and has no memoized children.

---

## Step 2: Create ResetButton Component

### File: `apps/labor-market-dashboard/src/components/ResetButton.tsx`

```tsx
import type { TreeAction } from '@/types';

/** Props for the ResetButton component. */
export interface ResetButtonProps {
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Reset button with browser confirm() dialog guard.
 *
 * On click, prompts the user with a confirmation dialog.
 * If confirmed, dispatches RESET action. If cancelled, no-op.
 * Meets WCAG 2.5.5 44x44px minimum touch target.
 */
export function ResetButton({ dispatch }: ResetButtonProps) {
  function handleReset() {
    const confirmed = window.confirm(
      'Скинути всі значення до початкових? Ця дія не може бути скасована.',
    );

    if (confirmed) {
      dispatch({ type: 'RESET' });
    }
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      aria-label="Скинути до початкових значень"
      className="flex h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm-10.624-2.85a5.5 5.5 0 0 1 9.201-2.465l.312.311H11.77a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V3.53a.75.75 0 0 0-1.5 0v2.033l-.312-.311A7 7 0 0 0 2.63 8.39a.75.75 0 0 0 1.449.39Z"
          clipRule="evenodd"
        />
      </svg>
      Скинути
    </button>
  );
}
```

**Key design decisions:**

1. **`window.confirm()`**: Uses browser native confirmation dialog per TL design. No custom modal component needed.
2. **Ukrainian text**: Button label "Скинути" and confirmation message in Ukrainian per data conventions.
3. **`aria-label`**: Descriptive label "Скинути до початкових значень" ("Reset to initial values") provides fuller context than the visible text.
4. **Inline SVG icon**: Uses Heroicons `ArrowPathIcon` (MIT) with `aria-hidden="true"` since the button has its own aria-label. Pattern matches the lock/unlock icons in `Slider.tsx`.
5. **Touch target**: `h-11` ensures 44px height. Content width (icon + text + padding) ensures >= 44px wide.

---

## Step 3: Update Barrel Exports

### File: `apps/labor-market-dashboard/src/components/index.ts`

Add the following lines in alphabetical order within the existing exports:

```diff
 export { ChartLegend } from './ChartLegend';
 export type { ChartLegendProps, LegendItem } from './ChartLegend';

 export { ChartTooltip } from './ChartTooltip';
 export type { ChartTooltipProps } from './ChartTooltip';

+export { ModeToggle } from './ModeToggle';
+export type { ModeToggleProps } from './ModeToggle';
+
 export { PieChartPanel } from './PieChartPanel';
 export type { PieChartPanelProps } from './PieChartPanel';

+export { ResetButton } from './ResetButton';
+export type { ResetButtonProps } from './ResetButton';
+
 export { Slider } from './Slider';
 export type { SliderProps } from './Slider';

 export { TreePanel } from './TreePanel';
 export type { TreePanelProps } from './TreePanel';

 export { TreeRow } from './TreeRow';
 export type { TreeRowProps } from './TreeRow';
```

**Result file content:**

```typescript
export { ChartLegend } from './ChartLegend';
export type { ChartLegendProps, LegendItem } from './ChartLegend';

export { ChartTooltip } from './ChartTooltip';
export type { ChartTooltipProps } from './ChartTooltip';

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

This satisfies the arch-review condition: "Each new component MUST be added to the barrel with both value and type exports."

---

## Step 4: Create ModeToggle Tests

### File: `apps/labor-market-dashboard/src/__tests__/components/ModeToggle.test.tsx`

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ModeToggle } from '@/components/ModeToggle';
import type { ModeToggleProps } from '@/components/ModeToggle';
import type { TreeAction } from '@/types';

/** Create default props for the ModeToggle component. */
function makeProps(overrides?: Partial<ModeToggleProps>): ModeToggleProps {
  return {
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
describe('ModeToggle rendering', () => {
  it('renders both mode labels', () => {
    render(<ModeToggle {...makeProps()} />);

    expect(screen.getByText('Авто')).toBeInTheDocument();
    expect(screen.getByText('Вільний')).toBeInTheDocument();
  });

  it('highlights "Авто" label when in auto mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'auto' })} />);

    const autoLabel = screen.getByText('Авто');
    expect(autoLabel.className).toContain('text-blue-600');
  });

  it('highlights "Вільний" label when in free mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'free' })} />);

    const freeLabel = screen.getByText('Вільний');
    expect(freeLabel.className).toContain('text-blue-600');
  });

  it('dims inactive label in auto mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'auto' })} />);

    const freeLabel = screen.getByText('Вільний');
    expect(freeLabel.className).toContain('text-slate-400');
  });

  it('dims inactive label in free mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'free' })} />);

    const autoLabel = screen.getByText('Авто');
    expect(autoLabel.className).toContain('text-slate-400');
  });
});

// -------------------------------------------------------
// Interaction tests
// -------------------------------------------------------
describe('ModeToggle interaction', () => {
  it('dispatches SET_BALANCE_MODE with "free" when in auto mode', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ModeToggle {...makeProps({ balanceMode: 'auto', dispatch })} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_BALANCE_MODE',
      mode: 'free',
    });
  });

  it('dispatches SET_BALANCE_MODE with "auto" when in free mode', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ModeToggle {...makeProps({ balanceMode: 'free', dispatch })} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_BALANCE_MODE',
      mode: 'auto',
    });
  });

  it('dispatches exactly once per click', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ModeToggle {...makeProps({ dispatch })} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

// -------------------------------------------------------
// Accessibility tests
// -------------------------------------------------------
describe('ModeToggle accessibility', () => {
  it('has role="switch"', () => {
    render(<ModeToggle {...makeProps()} />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('has aria-checked="true" when in auto mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'auto' })} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('has aria-checked="false" when in free mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'free' })} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('has accessible name "Balance mode"', () => {
    render(<ModeToggle {...makeProps()} />);

    expect(
      screen.getByRole('switch', { name: 'Balance mode' }),
    ).toBeInTheDocument();
  });

  it('has h-11 class for 44px minimum touch target height', () => {
    render(<ModeToggle {...makeProps()} />);

    const toggle = screen.getByRole('switch');
    expect(toggle.className).toContain('h-11');
  });
});
```

**Test count: 12 tests across 3 describe blocks.**

---

## Step 5: Create ResetButton Tests

### File: `apps/labor-market-dashboard/src/__tests__/components/ResetButton.test.tsx`

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResetButton } from '@/components/ResetButton';
import type { ResetButtonProps } from '@/components/ResetButton';
import type { TreeAction } from '@/types';

/** Create default props for the ResetButton component. */
function makeProps(overrides?: Partial<ResetButtonProps>): ResetButtonProps {
  return {
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
describe('ResetButton rendering', () => {
  it('renders the button with "Скинути" text', () => {
    render(<ResetButton {...makeProps()} />);

    expect(screen.getByText('Скинути')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<ResetButton {...makeProps()} />);

    expect(
      screen.getByRole('button', { name: /скинути до початкових значень/i }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Confirm dialog tests
// -------------------------------------------------------
describe('ResetButton confirm dialog', () => {
  it('calls window.confirm on click', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ResetButton {...makeProps()} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.click(button);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('dispatches RESET when user confirms', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ResetButton {...makeProps({ dispatch })} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.click(button);

    expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' });
    expect(dispatch).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('does NOT dispatch when user cancels', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ResetButton {...makeProps({ dispatch })} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.click(button);

    expect(dispatch).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

// -------------------------------------------------------
// Accessibility tests
// -------------------------------------------------------
describe('ResetButton accessibility', () => {
  it('has aria-label "Скинути до початкових значень"', () => {
    render(<ResetButton {...makeProps()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Скинути до початкових значень',
    );
  });

  it('is focusable via keyboard', async () => {
    const user = userEvent.setup();
    render(<ResetButton {...makeProps()} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.tab();

    expect(button).toHaveFocus();
  });

  it('is activatable via keyboard Enter', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ResetButton {...makeProps({ dispatch })} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.tab();
    await user.keyboard('{Enter}');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' });
    confirmSpy.mockRestore();
  });

  it('has h-11 class for 44px minimum touch target height', () => {
    render(<ResetButton {...makeProps()} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    expect(button.className).toContain('h-11');
  });
});
```

**Test count: 9 tests across 3 describe blocks.**

---

## Implementation Order

1. Create `ModeToggle.tsx`
2. Create `ResetButton.tsx`
3. Update `components/index.ts` with barrel exports
4. Create `ModeToggle.test.tsx`
5. Create `ResetButton.test.tsx`
6. Run verification

Steps 1-3 can be done in sequence (component files must exist before barrel exports compile). Steps 4-5 can be done in parallel after step 3.

---

## Acceptance Criteria Traceability

| Acceptance Criterion | Implementation | Test Coverage |
|---|---|---|
| ModeToggle: auto -> dispatches SET_BALANCE_MODE free | `handleToggle` dispatches opposite mode | `ModeToggle interaction` test 1 |
| ModeToggle: free -> dispatches SET_BALANCE_MODE auto | `handleToggle` dispatches opposite mode | `ModeToggle interaction` test 2 |
| ModeToggle: screen reader aria attributes | `role="switch"`, `aria-checked`, `aria-label` | `ModeToggle accessibility` tests 1-4 |
| ModeToggle: 44x44px touch target | `h-11` class on button | `ModeToggle accessibility` test 5 |
| ResetButton: confirm dialog appears | `window.confirm()` call in handler | `ResetButton confirm dialog` test 1 |
| ResetButton: confirmed -> RESET dispatched | Conditional dispatch after confirm returns true | `ResetButton confirm dialog` test 2 |
| ResetButton: cancelled -> no dispatch | No dispatch when confirm returns false | `ResetButton confirm dialog` test 3 |
| ResetButton: 44x44px touch target | `h-11` class on button | `ResetButton accessibility` test 4 |

## Arch-Review Conditions Compliance

| Condition | Status | Implementation |
|---|---|---|
| Both components added to `components/index.ts` with value + type exports | Addressed in Step 3 | `export { ModeToggle }` + `export type { ModeToggleProps }` and `export { ResetButton }` + `export type { ResetButtonProps }` |

---

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass (existing 162 + 21 new = 183 total)
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
