# Implementation Plan: Subtask 8.4 -- GenderSection + Mini Subcategory Pie Charts

Generated: 2026-02-17

## Overview

This subtask covers TL design Steps 5 and 6:
1. **GenderSection component** (Step 5): A container that pairs a single gender's TreePanel with its industry PieChartPanel side-by-side.
2. **Mini IT subcategory pie charts in TreeRow** (Step 6): When an industry node with children is expanded, render a mini PieChartPanel showing subcategory distribution.

## Prerequisites

- Subtask 8.3 is complete: TreePanel has been refactored to accept `genderNode: TreeNode` (confirmed -- see current `TreePanel.tsx`).
- ModeToggle and ResetButton exist from subtask 8.1 (confirmed in `components/index.ts` barrel).
- PieChartPanel, chartColors, and chartDataUtils are all in place from prior tasks.

## Architecture Review Conditions

Two conditions from `arch-review.md` apply to this subtask:

1. **Heading hierarchy** (Condition #1): Not directly applicable to 8.4 -- DashboardHeader will handle `<h1>` in subtask 8.2/8.5. GenderSection delegates to TreePanel which already renders `<h2>`.
2. **Barrel exports with `export type`** (Condition #2): GenderSection MUST be added to `components/index.ts` with both value export and type export for its props interface.

---

## File Changes Summary

| Action | File |
|--------|------|
| CREATE | `apps/labor-market-dashboard/src/components/GenderSection.tsx` |
| CREATE | `apps/labor-market-dashboard/src/__tests__/components/GenderSection.test.tsx` |
| MODIFY | `apps/labor-market-dashboard/src/components/TreeRow.tsx` |
| MODIFY | `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx` |
| MODIFY | `apps/labor-market-dashboard/src/components/index.ts` |

---

## Step 1: Create GenderSection Component

### File: `apps/labor-market-dashboard/src/components/GenderSection.tsx`

**Purpose**: Container component pairing a gender's TreePanel (left) with its industry PieChartPanel (right) in a side-by-side layout.

**Props**:
- `genderNode: TreeNode` -- single gender node (male or female)
- `balanceMode: BalanceMode` -- current balance mode
- `dispatch: React.Dispatch<TreeAction>` -- reducer dispatch

**Key decisions**:
- Uses `INDUSTRY_COLORS` directly as the `colorMap` for PieChartPanel (industries are keyed by kvedCode).
- Passes `genderNode.children` (industry nodes) as the `nodes` prop to PieChartPanel.
- `ariaLabel` follows the pattern `"Розподіл галузей -- {genderNode.label}"`.
- Layout: flex column with TreePanel above, PieChartPanel below. The two GenderSections themselves will be placed side-by-side in App.tsx (subtask 8.5) via `grid grid-cols-1 lg:grid-cols-2`.
- PieChartPanel receives `showLegend={false}` since the legend would duplicate labels already visible in the TreePanel. This keeps the layout compact.

```typescript
import { INDUSTRY_COLORS } from '@/data/chartColors';
import type { BalanceMode, TreeAction, TreeNode } from '@/types';

import { PieChartPanel } from './PieChartPanel';
import { TreePanel } from './TreePanel';

/** Props for the GenderSection component. */
export interface GenderSectionProps {
  /** Single gender node (male or female) */
  genderNode: TreeNode;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Container component pairing a gender's TreePanel with its industry PieChartPanel.
 *
 * Layout: vertical flex -- TreePanel on top (scrollable industry tree with sliders),
 * PieChartPanel below (industry distribution pie chart).
 * Each gender section (male/female) gets its own GenderSection in the dashboard.
 */
export function GenderSection({
  genderNode,
  balanceMode,
  dispatch,
}: GenderSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <TreePanel
        genderNode={genderNode}
        balanceMode={balanceMode}
        dispatch={dispatch}
      />
      <PieChartPanel
        nodes={genderNode.children}
        colorMap={INDUSTRY_COLORS}
        ariaLabel={`Розподіл галузей -- ${genderNode.label}`}
        balanceMode={balanceMode}
      />
    </div>
  );
}
```

**Import ordering** (per ESLint convention -- external first, then `@/` aliases grouped, then relative):
1. `import { INDUSTRY_COLORS } from '@/data/chartColors';` (@/ alias, data)
2. `import type { BalanceMode, TreeAction, TreeNode } from '@/types';` (@/ alias, types)
3. Blank line
4. `import { PieChartPanel } from './PieChartPanel';` (relative)
5. `import { TreePanel } from './TreePanel';` (relative)

---

## Step 2: Create GenderSection Tests

### File: `apps/labor-market-dashboard/src/__tests__/components/GenderSection.test.tsx`

**Test strategy**: Verify that GenderSection correctly composes TreePanel and PieChartPanel. Since both child components have their own comprehensive tests, GenderSection tests focus on integration concerns: correct props passing, presence of both sub-components, and correct aria labeling.

**ResizeObserver mock**: Required because PieChartPanel uses `ResponsiveContainer` from Recharts.

```typescript
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { GenderSection } from '@/components/GenderSection';
import type { GenderSectionProps } from '@/components/GenderSection';
import type { TreeNode } from '@/types';

/**
 * Mock ResizeObserver for jsdom (Recharts ResponsiveContainer requires it).
 */
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: {
              width: 400,
              height: 300,
              top: 0,
              left: 0,
              bottom: 300,
              right: 400,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        this,
      );
    }

    unobserve() {}
    disconnect() {}
  };
});

/** Create a minimal test gender node. */
function makeTestGenderNode(overrides?: Partial<TreeNode>): TreeNode {
  return {
    id: 'gender-male',
    label: 'Чоловіки',
    percentage: 60,
    defaultPercentage: 60,
    absoluteValue: 6_000_000,
    genderSplit: { male: 100, female: 0 },
    isLocked: false,
    children: [
      {
        id: 'male-g',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 50,
        defaultPercentage: 50,
        absoluteValue: 3_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [],
      },
      {
        id: 'male-j',
        label: 'IT та телеком',
        kvedCode: 'J',
        percentage: 50,
        defaultPercentage: 50,
        absoluteValue: 3_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [
          {
            id: 'male-j-sw',
            label: 'Розробка ПЗ',
            percentage: 60,
            defaultPercentage: 60,
            absoluteValue: 1_800_000,
            genderSplit: { male: 100, female: 0 },
            isLocked: false,
            children: [],
          },
          {
            id: 'male-j-qa',
            label: 'QA / Тестування',
            percentage: 40,
            defaultPercentage: 40,
            absoluteValue: 1_200_000,
            genderSplit: { male: 100, female: 0 },
            isLocked: false,
            children: [],
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** Create default props for GenderSection. */
function makeProps(
  overrides?: Partial<GenderSectionProps>,
): GenderSectionProps {
  return {
    genderNode: makeTestGenderNode(),
    balanceMode: 'auto',
    dispatch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Composition tests
// -------------------------------------------------------
describe('GenderSection composition', () => {
  it('renders TreePanel with gender heading', () => {
    render(<GenderSection {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Чоловіки', level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders TreePanel section with aria-label', () => {
    render(<GenderSection {...makeProps()} />);

    expect(
      screen.getByRole('region', { name: 'Чоловіки' }),
    ).toBeInTheDocument();
  });

  it('renders PieChartPanel with correct aria-label', () => {
    render(<GenderSection {...makeProps()} />);

    expect(
      screen.getByRole('img', { name: 'Розподіл галузей -- Чоловіки' }),
    ).toBeInTheDocument();
  });

  it('renders industry nodes in TreePanel', () => {
    render(<GenderSection {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
    expect(screen.getByText('IT та телеком')).toBeInTheDocument();
  });

  it('pie chart data table has correct row count matching industries', () => {
    render(<GenderSection {...makeProps()} />);

    const table = screen.getByRole('table');
    // 1 header row + 2 data rows (Торгівля + IT та телеком)
    const rows = table.querySelectorAll('tr');
    expect(rows).toHaveLength(3);
  });
});

// -------------------------------------------------------
// Female gender variant test
// -------------------------------------------------------
describe('GenderSection female variant', () => {
  it('renders correct aria-label for female gender', () => {
    const femaleNode = makeTestGenderNode({
      id: 'gender-female',
      label: 'Жінки',
    });
    render(<GenderSection {...makeProps({ genderNode: femaleNode })} />);

    expect(
      screen.getByRole('img', { name: 'Розподіл галузей -- Жінки' }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Balance mode passthrough
// -------------------------------------------------------
describe('GenderSection balance mode', () => {
  it('passes balanceMode to TreePanel (deviation visible in free mode)', () => {
    const genderNode = makeTestGenderNode();
    // Set industries to sum to 90% (50 + 40 = 90)
    genderNode.children[1] = {
      ...genderNode.children[1],
      percentage: 40,
    };

    render(
      <GenderSection
        {...makeProps({ genderNode, balanceMode: 'free' })}
      />,
    );

    // TreePanel's deviation warning should be visible
    expect(screen.getByRole('status')).toHaveTextContent(
      'Сума: 90.0% (-10.0%)',
    );
  });
});
```

**Test count**: 7 tests covering:
1. TreePanel renders with gender heading
2. TreePanel has correct aria-label region
3. PieChartPanel has correct gender-specific aria-label
4. Industry nodes visible in tree
5. Pie chart data table has correct industry count
6. Female variant uses correct aria-label
7. Balance mode correctly passes through to child components

---

## Step 3: Add Mini Subcategory Pie Charts to TreeRow

### File: `apps/labor-market-dashboard/src/components/TreeRow.tsx`

**What changes**: When a node is expanded and has children, render a mini PieChartPanel below the children showing subcategory distribution.

**Color generation**: Uses `generateSubcategoryColors()` with the base color from `INDUSTRY_COLORS[node.kvedCode]` (fallback to `DEFAULT_NODE_COLOR`). Maps each child node's ID to a generated color shade.

**Imports to add** (3 new imports):
```typescript
import { DEFAULT_NODE_COLOR, INDUSTRY_COLORS } from '@/data/chartColors';
import { generateSubcategoryColors } from '@/utils/chartDataUtils';

import { PieChartPanel } from './PieChartPanel';
```

**New helper function** (inside TreeRow.tsx, before the component, after the TreeRowProps interface):

```typescript
/**
 * Build a color map for subcategory nodes based on parent's industry color.
 * Uses generateSubcategoryColors to create opacity-based shades.
 */
function buildSubcategoryColorMap(
  node: TreeNode,
): Record<string, string> {
  const baseColor =
    node.kvedCode && node.kvedCode in INDUSTRY_COLORS
      ? INDUSTRY_COLORS[node.kvedCode]
      : DEFAULT_NODE_COLOR;

  const colors = generateSubcategoryColors(baseColor, node.children.length);
  const colorMap: Record<string, string> = {};

  node.children.forEach((child, index) => {
    colorMap[child.id] = colors[index];
  });

  return colorMap;
}
```

**New JSX block** -- inserted at the end of the outer `<div>`, after the deviation warning block:

```tsx
{/* Mini subcategory pie chart (expanded nodes with children) */}
{isExpanded && hasChildren && (
  <div style={{ paddingLeft: `${(depth + 1) * 24}px` }}>
    <PieChartPanel
      nodes={node.children}
      colorMap={buildSubcategoryColorMap(node)}
      ariaLabel={`Розподіл підкатегорій -- ${node.label}`}
      size="mini"
      balanceMode={balanceMode}
      showLegend={false}
    />
  </div>
)}
```

**Complete modified TreeRow.tsx**:

```typescript
import { memo } from 'react';

import { DEFAULT_NODE_COLOR, INDUSTRY_COLORS } from '@/data/chartColors';
import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { canToggleLock, getSiblingDeviation } from '@/utils/calculations';
import { generateSubcategoryColors } from '@/utils/chartDataUtils';
import { formatPercentage } from '@/utils/format';

import { PieChartPanel } from './PieChartPanel';
import { Slider } from './Slider';

/** Props for the TreeRow component. */
export interface TreeRowProps {
  /** The tree node to render */
  node: TreeNode;
  /** Sibling nodes (children of the same parent) for canToggleLock computation */
  siblings: readonly TreeNode[];
  /** Nesting depth (0 = top-level industry under gender) */
  depth: number;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
  /** Set of currently expanded node IDs */
  expandedIds: ReadonlySet<string>;
  /** Callback to toggle expand/collapse state of a node */
  onToggleExpand: (id: string) => void;
}

/**
 * Build a color map for subcategory nodes based on parent's industry color.
 * Uses generateSubcategoryColors to create opacity-based shades.
 */
function buildSubcategoryColorMap(
  node: TreeNode,
): Record<string, string> {
  const baseColor =
    node.kvedCode && node.kvedCode in INDUSTRY_COLORS
      ? INDUSTRY_COLORS[node.kvedCode]
      : DEFAULT_NODE_COLOR;

  const colors = generateSubcategoryColors(baseColor, node.children.length);
  const colorMap: Record<string, string> = {};

  node.children.forEach((child, index) => {
    colorMap[child.id] = colors[index];
  });

  return colorMap;
}

/**
 * Recursive tree row component.
 *
 * Renders a single node with optional expand/collapse chevron, indentation,
 * and an embedded Slider. When expanded, recursively renders child nodes,
 * a mini subcategory pie chart, and (in free mode) a deviation warning.
 *
 * Wrapped in React.memo to prevent re-renders during sibling slider interactions.
 */
export const TreeRow = memo(function TreeRow({
  node,
  siblings,
  depth,
  balanceMode,
  dispatch,
  expandedIds,
  onToggleExpand,
}: TreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const canLock = canToggleLock(node.id, siblings);

  // Compute subcategory deviation for expanded nodes in free mode
  const showDeviation =
    isExpanded && hasChildren && balanceMode === 'free';
  const deviation = showDeviation ? getSiblingDeviation(node) : 0;

  return (
    <div>
      <div
        className="flex items-center gap-1"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        {/* Chevron toggle button -- only for nodes with children */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ) : (
          /* Spacer to maintain alignment when no chevron */
          <div className="h-11 w-11 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <Slider
            nodeId={node.id}
            label={node.label}
            percentage={node.percentage}
            absoluteValue={node.absoluteValue}
            isLocked={node.isLocked}
            canLock={canLock}
            balanceMode={balanceMode}
            dispatch={dispatch}
          />
        </div>
      </div>

      {/* Recursively render children when expanded */}
      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            siblings={node.children}
            depth={depth + 1}
            balanceMode={balanceMode}
            dispatch={dispatch}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}

      {/* Subcategory deviation warning (free mode, expanded nodes with children) */}
      {showDeviation && deviation !== 0 && (
        <p
          className="text-sm font-medium text-amber-600"
          style={{ paddingLeft: `${(depth + 1) * 24}px` }}
          role="status"
        >
          Сума: {formatPercentage(100 + deviation)} ({deviation > 0 ? '+' : ''}{formatPercentage(deviation)})
        </p>
      )}

      {/* Mini subcategory pie chart (expanded nodes with children) */}
      {isExpanded && hasChildren && (
        <div style={{ paddingLeft: `${(depth + 1) * 24}px` }}>
          <PieChartPanel
            nodes={node.children}
            colorMap={buildSubcategoryColorMap(node)}
            ariaLabel={`Розподіл підкатегорій -- ${node.label}`}
            size="mini"
            balanceMode={balanceMode}
            showLegend={false}
          />
        </div>
      )}
    </div>
  );
});
```

**Line count**: ~173 lines. Under the 200-line limit.

---

## Step 4: Add Mini Pie Chart Tests to TreeRow Test File

### File: `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx`

**Changes required**:

1. Add `beforeAll` to vitest imports
2. Add `ResizeObserver` mock at top level (required because TreeRow now conditionally renders PieChartPanel)
3. Add new test section for mini subcategory pie charts

**Change 1 -- Update vitest import** (line 3):

From:
```typescript
import { afterEach, describe, expect, it, vi } from 'vitest';
```
To:
```typescript
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
```

**Change 2 -- Add ResizeObserver mock** (insert after imports, before `makeNode` function):

```typescript
/**
 * Mock ResizeObserver for jsdom (required because TreeRow now renders
 * PieChartPanel which uses Recharts ResponsiveContainer).
 */
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: {
              width: 400,
              height: 300,
              top: 0,
              left: 0,
              bottom: 300,
              right: 400,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        this,
      );
    }

    unobserve() {}
    disconnect() {}
  };
});
```

**Change 3 -- Add new test section** (append at end of file):

```typescript
// -------------------------------------------------------
// Mini subcategory pie chart tests
// -------------------------------------------------------
describe('TreeRow mini subcategory pie chart', () => {
  it('renders mini PieChartPanel when node is expanded and has children', () => {
    const node = makeNodeWithChildren();
    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          expandedIds: new Set(['test-j']),
        })}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: 'Розподіл підкатегорій -- IT та телеком',
      }),
    ).toBeInTheDocument();
  });

  it('does not render mini chart when node is collapsed', () => {
    const node = makeNodeWithChildren();
    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          expandedIds: new Set(), // collapsed
        })}
      />,
    );

    expect(
      screen.queryByRole('img', {
        name: /розподіл підкатегорій/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('does not render mini chart on leaf nodes', () => {
    render(<TreeRow {...makeProps()} />);

    expect(
      screen.queryByRole('img', {
        name: /розподіл підкатегорій/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('mini chart has correct aria-label including node label', () => {
    const node = makeNodeWithChildren();
    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          expandedIds: new Set(['test-j']),
        })}
      />,
    );

    const miniChart = screen.getByRole('img', {
      name: 'Розподіл підкатегорій -- IT та телеком',
    });
    expect(miniChart).toBeInTheDocument();
  });

  it('mini chart renders with mini size (200px height)', () => {
    const node = makeNodeWithChildren();
    const { container } = render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          expandedIds: new Set(['test-j']),
        })}
      />,
    );

    // PieChartPanel with size="mini" renders a div with minHeight: 200px
    const miniContainer = container.querySelector(
      '[style*="min-height: 200px"]',
    );
    expect(miniContainer).toBeInTheDocument();
  });

  it('mini chart sr-only table has rows matching subcategory count', () => {
    const node = makeNodeWithChildren(); // 2 subcategories
    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          expandedIds: new Set(['test-j']),
        })}
      />,
    );

    // The mini chart's sr-only table should have 2 data rows + 1 header = 3
    const figure = screen.getByRole('img', {
      name: 'Розподіл підкатегорій -- IT та телеком',
    });
    const table = figure.querySelector('table');
    expect(table).toBeInTheDocument();
    const rows = table?.querySelectorAll('tr');
    // 1 header + 2 data rows
    expect(rows).toHaveLength(3);
  });
});
```

**New test count**: 6 new tests. Total TreeRow tests: ~27 (21 existing + 6 new).

---

## Step 5: Update Barrel Exports

### File: `apps/labor-market-dashboard/src/components/index.ts`

**Add GenderSection exports** in alphabetical position (after ChartTooltip, before ModeToggle):

```typescript
export { GenderSection } from './GenderSection';
export type { GenderSectionProps } from './GenderSection';
```

**Complete updated file**:

```typescript
export { ChartLegend } from './ChartLegend';
export type { ChartLegendProps, LegendItem } from './ChartLegend';

export { ChartTooltip } from './ChartTooltip';
export type { ChartTooltipProps } from './ChartTooltip';

export { GenderSection } from './GenderSection';
export type { GenderSectionProps } from './GenderSection';

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

This satisfies arch-review condition #2: both value export and `export type` for the props interface.

---

## Patterns to Follow

### Import Convention
- External packages first (`react`, `recharts`)
- Blank line
- `@/` aliased imports grouped together (data, types, utils)
- Blank line
- Relative imports (`./PieChartPanel`, `./Slider`)

### Test Convention
- `makeProps()` factory with `Partial<Props>` overrides
- `vi.fn()` for dispatch mock (vitest v3 syntax: `vi.fn<(action: TreeAction) => void>()`)
- `afterEach(cleanup)` explicit cleanup
- `beforeAll` for `ResizeObserver` mock when test renders Recharts components
- `screen.getByRole('img', { name: ... })` for PieChartPanel aria queries
- `screen.getByRole('region', { name: ... })` for `<section aria-label>` queries
- Minimal test tree fixtures (not full 55-node `defaultTree`)

### Component Convention
- Named exports (not default)
- JSDoc on component and props interface
- Props interface exported with `export interface`
- No `any` types
- Tailwind classes only (no CSS-in-JS)
- Dynamic values via inline `style` attribute (e.g., `paddingLeft`)

---

## Verification Steps

After implementing all changes, run these commands and verify they pass:

```bash
# Run tests for the dashboard app only (faster feedback)
pnpm test --filter @template/labor-market-dashboard

# Run full monorepo lint
pnpm lint

# Run full monorepo test suite
pnpm test

# Build to verify no type errors
pnpm build
```

### Manual Verification

After `pnpm dev`:
1. Open http://localhost:5173
2. Verify each gender section shows a TreePanel with industry sliders
3. Verify each gender section shows an industry PieChartPanel
4. Expand the IT industry node -- verify a mini pie chart appears below the IT subcategories
5. Collapse the IT node -- verify the mini pie chart disappears
6. Verify leaf industry nodes (no children) do NOT show a mini pie chart
7. Adjust an IT subcategory slider in auto mode -- verify the mini pie chart updates
8. Switch to free mode -- adjust sliders -- verify deviation warnings and pie chart ghost slices work

### Expected Test Results

- GenderSection tests: 7 new tests, all passing
- TreeRow tests: 6 new tests added (total ~27), all passing
- TreePanel tests: no changes (14 existing tests, all passing)
- PieChartPanel tests: no changes (11 existing tests, all passing)

---

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.

---

## Potential Issues

1. **TreeRow line count**: After adding the mini pie chart, TreeRow grows from ~150 to ~173 lines. Still under the 200-line limit. If future additions push it over, extract `buildSubcategoryColorMap` and the mini chart rendering into a `MiniSubcategoryChart` helper component.

2. **ResizeObserver mock in TreeRow tests**: All existing TreeRow tests were written without `ResizeObserver` mock. Adding the mock to the file level (`beforeAll`) is safe -- it does not affect tests that do not render PieChartPanel, since the mock only activates when `ResponsiveContainer` calls `observe()`. However, verify that no existing tests break after adding this mock.

3. **Circular import risk**: TreeRow imports PieChartPanel, and both are in the same `components/` directory. This is a standard sibling import -- no circular dependency since PieChartPanel does not import TreeRow.

4. **`showLegend={false}` for mini charts**: The mini pie chart intentionally hides the legend since the subcategory labels are already visible in the tree rows above. If this is not desired, change to `showLegend={true}`. This is a design decision that should be confirmed during visual review.

5. **Color map recomputation**: `buildSubcategoryColorMap` is called on every render of an expanded TreeRow with children. Since `generateSubcategoryColors` involves simple math on 2-10 items, this is negligible. If profiling shows issues, the result can be memoized with `useMemo`, but this is premature optimization for now.

6. **GenderSection test may have table query ambiguity**: When GenderSection renders both TreePanel and PieChartPanel, and if TreePanel also contains tables, the `screen.getByRole('table')` query might find multiple tables. The current TreePanel does NOT render tables, so this is safe. But if future changes add tables to TreePanel, the test should use `within(figure)` scoping.
