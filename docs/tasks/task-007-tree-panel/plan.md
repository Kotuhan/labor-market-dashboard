# FE Implementation Plan: task-007 -- Create Expandable Tree Panel UI

Generated: 2026-02-17

## Overview

Build two new components (`TreePanel` and `TreeRow`) that render the 55-node labor market tree with expand/collapse behavior, integrated Slider components, and visual indentation. Wire them into `App.tsx` via the existing `useTreeState` hook. Also update `main.tsx` to handle the `App` named export change (per arch-review condition).

**Files to create (4):**
- `apps/labor-market-dashboard/src/components/TreeRow.tsx`
- `apps/labor-market-dashboard/src/components/TreePanel.tsx`
- `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx`
- `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx`

**Files to modify (3):**
- `apps/labor-market-dashboard/src/components/index.ts`
- `apps/labor-market-dashboard/src/App.tsx`
- `apps/labor-market-dashboard/src/main.tsx`

## Key Design Decisions (from PO + TL + Arch Review)

- Gender nodes are always expanded (non-collapsible section headers)
- Industries start expanded on initial load
- Single tree component (not per-gender)
- Chevron icons (> / v) as inline SVG for expand/collapse
- `useState<Set<string>>` for expand/collapse (UI-only state, NOT in reducer)
- `React.memo` on TreeRow with named function pattern (like PieChartPanel)
- `useCallback` on handleToggleExpand (for memo effectiveness)
- TreeRow receives `siblings` prop for `canToggleLock` computation
- 24px indentation per depth level via inline `paddingLeft`
- 44px touch targets (`h-11 w-11`) for chevron buttons
- `aria-expanded` on toggle buttons
- When converting App.tsx to named export, also update main.tsx import (arch-review condition)

---

## Step 1: Create TreeRow Component

**File:** `apps/labor-market-dashboard/src/components/TreeRow.tsx` (NEW)

**Patterns to follow:**
- `React.memo` with named function pattern from `PieChartPanel.tsx` line 54: `export const PieChartPanel = memo(function PieChartPanel(...))`
- Props interface with JSDoc from `Slider.tsx` lines 7-24
- Inline SVG with `aria-hidden="true"` from `Slider.tsx` lines 167-189
- `h-11 w-11` touch target from `Slider.tsx` line 158
- Import ordering: external packages, then `@/` aliases, then relative

**Code:**

```tsx
import { memo } from 'react';

import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { canToggleLock } from '@/utils/calculations';

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
 * Recursive tree row component.
 *
 * Renders a single node with optional expand/collapse chevron, indentation,
 * and an embedded Slider. When expanded, recursively renders child nodes.
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
    </div>
  );
});
```

**Line count:** ~115 lines (under 200 limit)

**Key implementation notes:**
- Chevron SVGs use Heroicons Mini 20x20 viewBox (chevron-down and chevron-right), consistent with Slider's Heroicons lock SVGs
- Spacer `div` with same `h-11 w-11` dimensions maintains alignment for leaf nodes without chevrons
- `ReadonlySet<string>` for expandedIds and `readonly TreeNode[]` for siblings to signal immutability
- `canToggleLock` is imported from `@/utils/calculations` (same as `useTreeState.ts` line 8)
- No `useCallback` on handlers -- TreeRow is a leaf that has no memoized children that would benefit

---

## Step 2: Create TreePanel Component

**File:** `apps/labor-market-dashboard/src/components/TreePanel.tsx` (NEW)

**Patterns to follow:**
- Named export function (NOT memo -- TreePanel is a container that manages state, will re-render with state changes)
- Props interface with JSDoc from `Slider.tsx` pattern
- Import ordering: external packages, `@/` aliases, relative imports

**Code:**

```tsx
import { useCallback, useState } from 'react';

import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

import { TreeRow } from './TreeRow';

/** Props for the TreePanel component. */
export interface TreePanelProps {
  /** Root node of the labor market tree */
  tree: TreeNode;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Collect all node IDs that have children (for initial expand state).
 * Walks the tree depth-first, skipping the root and gender nodes
 * (gender nodes are always expanded, not tracked in expandedIds).
 */
function collectExpandableIds(node: TreeNode): string[] {
  const ids: string[] = [];

  function walk(n: TreeNode, depth: number): void {
    // Skip root (depth 0) and gender (depth 1) -- they are not in expandedIds
    // Only track depth 2+ nodes with children (industries with subcategories)
    if (depth >= 2 && n.children.length > 0) {
      ids.push(n.id);
    }
    for (const child of n.children) {
      walk(child, depth + 1);
    }
  }

  walk(node, 0);
  return ids;
}

/**
 * Container component for the labor market tree panel.
 *
 * Manages expand/collapse state locally (UI-only, not in reducer).
 * Renders root header, gender section headers (always expanded),
 * and TreeRow instances for each industry node.
 */
export function TreePanel({ tree, balanceMode, dispatch }: TreePanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(collectExpandableIds(tree)),
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Root header */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold text-slate-900">{tree.label}</h1>
        <p className="text-sm text-slate-500">
          {formatAbsoluteValue(tree.absoluteValue)}
        </p>
      </div>

      {/* Gender sections (always expanded, non-collapsible) */}
      {tree.children.map((genderNode) => (
        <section key={genderNode.id} aria-label={genderNode.label}>
          {/* Gender section header */}
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {genderNode.label}
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-700">
                {formatPercentage(genderNode.percentage)}
              </span>
              <span className="text-xs text-slate-500">
                {formatAbsoluteValue(genderNode.absoluteValue)}
              </span>
            </div>
          </div>

          {/* Industry nodes */}
          <div className="flex flex-col gap-1">
            {genderNode.children.map((industry) => (
              <TreeRow
                key={industry.id}
                node={industry}
                siblings={genderNode.children}
                depth={0}
                balanceMode={balanceMode}
                dispatch={dispatch}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

**Line count:** ~105 lines (under 200 limit)

**Key implementation notes:**
- Lazy initializer for `useState` (`() => new Set(...)`) ensures tree is only walked once on mount
- `collectExpandableIds` skips root (depth 0) and gender (depth 1) nodes -- only industry nodes with children (e.g., `male-j`, `female-j`) get tracked in expandedIds
- `useCallback` on `handleToggleExpand` is required because TreeRow uses `React.memo` -- without it, every TreePanel render creates a new function reference, defeating memo
- Gender section uses `<section aria-label={genderNode.label}>` for screen reader landmark navigation
- Industry depth starts at 0 (TreeRow adds 24px per depth level, so industries have no indentation, subcategories get 24px)
- Root header uses `<h1>` and gender uses `<h2>` for proper heading hierarchy

---

## Step 3: Update Barrel Exports

**File:** `apps/labor-market-dashboard/src/components/index.ts` (MODIFY)

**Current content (lines 1-12):**
```typescript
export { ChartLegend } from './ChartLegend';
export type { ChartLegendProps, LegendItem } from './ChartLegend';

export { ChartTooltip } from './ChartTooltip';
export type { ChartTooltipProps } from './ChartTooltip';

export { PieChartPanel } from './PieChartPanel';
export type { PieChartPanelProps } from './PieChartPanel';

export { Slider } from './Slider';
export type { SliderProps } from './Slider';
```

**New content (adds TreePanel and TreeRow in alphabetical order):**
```typescript
export { ChartLegend } from './ChartLegend';
export type { ChartLegendProps, LegendItem } from './ChartLegend';

export { ChartTooltip } from './ChartTooltip';
export type { ChartTooltipProps } from './ChartTooltip';

export { PieChartPanel } from './PieChartPanel';
export type { PieChartPanelProps } from './PieChartPanel';

export { Slider } from './Slider';
export type { SliderProps } from './Slider';

export { TreePanel } from './TreePanel';
export type { TreePanelProps } from './TreePanel';

export { TreeRow } from './TreeRow';
export type { TreeRowProps } from './TreeRow';
```

**Changes:** Add 4 new export lines (2 value + 2 type) after existing Slider exports, maintaining alphabetical order.

---

## Step 4: Integrate TreePanel into App.tsx + Update main.tsx

### 4a: App.tsx

**File:** `apps/labor-market-dashboard/src/App.tsx` (MODIFY)

**Current content:**
```tsx
function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-500">
          Labor Market Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Interactive labor market calculator for Ukraine
        </p>
      </div>
    </div>
  );
}

export default App;
```

**New content:**
```tsx
import { TreePanel } from '@/components';
import { useTreeState } from '@/hooks';

export function App() {
  const { state, dispatch } = useTreeState();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        <TreePanel
          tree={state.tree}
          balanceMode={state.balanceMode}
          dispatch={dispatch}
        />
      </div>
    </div>
  );
}
```

**Key changes:**
- Import `TreePanel` from `@/components` and `useTreeState` from `@/hooks`
- Call `useTreeState()` hook to get state + dispatch
- Render `<TreePanel>` with tree data and dispatch
- Convert from `export default App` to `export function App` (named export per project convention)
- Layout uses `max-w-3xl` centered container with padding

### 4b: main.tsx (arch-review condition)

**File:** `apps/labor-market-dashboard/src/main.tsx` (MODIFY)

**Current content:**
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**New content:**
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Single change:** Line 5: `import App from './App'` becomes `import { App } from './App'` (default import to named import).

---

## Step 5: Write TreeRow Unit Tests

**File:** `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx` (NEW)

**Patterns to follow:**
- `makeProps()` factory from `Slider.test.tsx` lines 10-24
- `afterEach(cleanup)` from `Slider.test.tsx` lines 26-28
- `vi.fn<(action: TreeAction) => void>()` vitest v3 syntax from `Slider.test.tsx` line 64
- `userEvent.setup()` for click interactions from `Slider.test.tsx` line 104
- Import from `@/components/TreeRow` (direct file, not barrel) following `Slider.test.tsx` line 5 pattern

**Code:**

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TreeRow } from '@/components/TreeRow';
import type { TreeRowProps } from '@/components/TreeRow';
import type { TreeAction, TreeNode } from '@/types';

/** Create a minimal TreeNode for testing. */
function makeNode(overrides?: Partial<TreeNode>): TreeNode {
  return {
    id: 'test-node',
    label: 'Торгівля',
    percentage: 16.8,
    defaultPercentage: 16.8,
    absoluteValue: 1_194_329,
    genderSplit: { male: 100, female: 0 },
    isLocked: false,
    kvedCode: 'G',
    children: [],
    ...overrides,
  };
}

/** Create a node with children (like IT/KVED J). */
function makeNodeWithChildren(): TreeNode {
  return makeNode({
    id: 'test-j',
    label: 'IT та телеком',
    kvedCode: 'J',
    percentage: 3.1,
    absoluteValue: 220_382,
    children: [
      makeNode({
        id: 'test-j-software',
        label: 'Розробка ПЗ',
        percentage: 59.6,
        absoluteValue: 131_348,
      }),
      makeNode({
        id: 'test-j-qa',
        label: 'QA / Тестування',
        percentage: 14.7,
        absoluteValue: 32_396,
      }),
    ],
  });
}

/** Create a set of siblings for testing. */
function makeSiblings(): TreeNode[] {
  return [
    makeNode({ id: 'sibling-1', label: 'Торгівля', percentage: 50 }),
    makeNode({ id: 'sibling-2', label: 'Освіта', percentage: 30 }),
    makeNode({ id: 'sibling-3', label: 'Промисловість', percentage: 20 }),
  ];
}

/** Create default props for TreeRow. */
function makeProps(overrides?: Partial<TreeRowProps>): TreeRowProps {
  const siblings = makeSiblings();
  return {
    node: siblings[0],
    siblings,
    depth: 0,
    balanceMode: 'auto',
    dispatch: vi.fn(),
    expandedIds: new Set<string>(),
    onToggleExpand: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Rendering tests
// -------------------------------------------------------
describe('TreeRow rendering', () => {
  it('renders the node label via embedded Slider', () => {
    render(<TreeRow {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
  });

  it('renders formatted percentage via embedded Slider', () => {
    const node = makeNode({ percentage: 16.8 });
    const siblings = [node, makeNode({ id: 's2', percentage: 83.2 })];
    render(<TreeRow {...makeProps({ node, siblings })} />);

    expect(screen.getByText('16.8%')).toBeInTheDocument();
  });

  it('renders formatted absolute value via embedded Slider', () => {
    const node = makeNode({ absoluteValue: 1_194_329 });
    const siblings = [node, makeNode({ id: 's2' })];
    render(<TreeRow {...makeProps({ node, siblings })} />);

    expect(screen.getByText('1 194 тис.')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Chevron tests
// -------------------------------------------------------
describe('TreeRow chevron', () => {
  it('shows chevron button for nodes with children', () => {
    const node = makeNodeWithChildren();
    render(
      <TreeRow {...makeProps({ node, siblings: [node] })} />,
    );

    expect(
      screen.getByRole('button', { name: /expand it та телеком/i }),
    ).toBeInTheDocument();
  });

  it('does not show chevron button for leaf nodes', () => {
    render(<TreeRow {...makeProps()} />);

    expect(
      screen.queryByRole('button', { name: /expand/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /collapse/i }),
    ).not.toBeInTheDocument();
  });

  it('shows collapse label when expanded', () => {
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
      screen.getByRole('button', { name: /collapse it та телеком/i }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Expand/collapse behavior
// -------------------------------------------------------
describe('TreeRow expand/collapse', () => {
  it('calls onToggleExpand with node ID when chevron is clicked', async () => {
    const user = userEvent.setup();
    const onToggleExpand = vi.fn();
    const node = makeNodeWithChildren();
    render(
      <TreeRow
        {...makeProps({ node, siblings: [node], onToggleExpand })}
      />,
    );

    const chevronBtn = screen.getByRole('button', {
      name: /expand it та телеком/i,
    });
    await user.click(chevronBtn);

    expect(onToggleExpand).toHaveBeenCalledWith('test-j');
  });

  it('renders children when expanded', () => {
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

    expect(screen.getByText('Розробка ПЗ')).toBeInTheDocument();
    expect(screen.getByText('QA / Тестування')).toBeInTheDocument();
  });

  it('does not render children when collapsed', () => {
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

    expect(screen.queryByText('Розробка ПЗ')).not.toBeInTheDocument();
    expect(screen.queryByText('QA / Тестування')).not.toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Indentation tests
// -------------------------------------------------------
describe('TreeRow indentation', () => {
  it('applies paddingLeft based on depth (0 = 0px)', () => {
    const { container } = render(<TreeRow {...makeProps({ depth: 0 })} />);

    const rowDiv = container.firstElementChild?.firstElementChild;
    expect(rowDiv).toHaveStyle({ paddingLeft: '0px' });
  });

  it('applies paddingLeft based on depth (1 = 24px)', () => {
    const { container } = render(<TreeRow {...makeProps({ depth: 1 })} />);

    const rowDiv = container.firstElementChild?.firstElementChild;
    expect(rowDiv).toHaveStyle({ paddingLeft: '24px' });
  });

  it('applies paddingLeft based on depth (2 = 48px)', () => {
    const { container } = render(<TreeRow {...makeProps({ depth: 2 })} />);

    const rowDiv = container.firstElementChild?.firstElementChild;
    expect(rowDiv).toHaveStyle({ paddingLeft: '48px' });
  });
});

// -------------------------------------------------------
// Slider integration tests
// -------------------------------------------------------
describe('TreeRow Slider integration', () => {
  it('passes correct nodeId to Slider', () => {
    const dispatch = vi.fn<(action: TreeAction) => void>();
    const node = makeNode({ id: 'my-node' });
    render(
      <TreeRow
        {...makeProps({ node, siblings: [node, makeNode({ id: 's2' })], dispatch })}
      />,
    );

    // Verify via Slider's range input aria-label (matches node label)
    const range = screen.getByRole('slider');
    expect(range).toHaveAttribute('aria-label', 'Торгівля');
  });

  it('passes isLocked to Slider', () => {
    const node = makeNode({ isLocked: true });
    render(
      <TreeRow {...makeProps({ node, siblings: [node, makeNode({ id: 's2' })] })} />,
    );

    const range = screen.getByRole('slider');
    expect(range).toBeDisabled();
  });

  it('passes dispatch to Slider (range change dispatches SET_PERCENTAGE)', () => {
    const dispatch = vi.fn<(action: TreeAction) => void>();
    const node = makeNode({ id: 'test-dispatch' });
    const siblings = [node, makeNode({ id: 's2' })];
    render(
      <TreeRow {...makeProps({ node, siblings, dispatch })} />,
    );

    const range = screen.getByRole('slider');
    // fireEvent for range inputs (userEvent lacks native range support)
    const { fireEvent } = require('@testing-library/react');
    fireEvent.change(range, { target: { value: '50' } });

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-dispatch',
      value: 50,
    });
  });
});

// -------------------------------------------------------
// Accessibility tests
// -------------------------------------------------------
describe('TreeRow accessibility', () => {
  it('has aria-expanded="false" on chevron when collapsed', () => {
    const node = makeNodeWithChildren();
    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          expandedIds: new Set(),
        })}
      />,
    );

    const btn = screen.getByRole('button', { name: /expand/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('has aria-expanded="true" on chevron when expanded', () => {
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

    const btn = screen.getByRole('button', { name: /collapse/i });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('chevron button has h-11 w-11 for 44px touch target', () => {
    const node = makeNodeWithChildren();
    render(
      <TreeRow {...makeProps({ node, siblings: [node] })} />,
    );

    const btn = screen.getByRole('button', { name: /expand/i });
    expect(btn.className).toContain('h-11');
    expect(btn.className).toContain('w-11');
  });
});

// -------------------------------------------------------
// canLock computation tests
// -------------------------------------------------------
describe('TreeRow canLock computation', () => {
  it('passes canLock=true when multiple unlocked siblings exist', () => {
    const siblings = makeSiblings(); // 3 unlocked siblings
    render(
      <TreeRow {...makeProps({ node: siblings[0], siblings })} />,
    );

    // Lock button should be enabled (canLock = true, isLocked = false)
    const lockBtn = screen.getByRole('button', { name: /lock торгівля/i });
    expect(lockBtn).not.toBeDisabled();
  });

  it('passes canLock=false when only 1 unlocked sibling remains', () => {
    const siblings = [
      makeNode({ id: 's1', label: 'Торгівля', isLocked: false }),
      makeNode({ id: 's2', label: 'Освіта', isLocked: true }),
    ];
    render(
      <TreeRow {...makeProps({ node: siblings[0], siblings })} />,
    );

    // Lock button should be disabled (canLock = false, isLocked = false)
    const lockBtn = screen.getByRole('button', { name: /lock торгівля/i });
    expect(lockBtn).toBeDisabled();
  });
});

// -------------------------------------------------------
// Locked state tests
// -------------------------------------------------------
describe('TreeRow locked state', () => {
  it('renders locked node with Slider in locked state', () => {
    const node = makeNode({ isLocked: true, label: 'Locked Node' });
    const siblings = [node, makeNode({ id: 's2' })];
    render(
      <TreeRow {...makeProps({ node, siblings })} />,
    );

    // Slider shows unlock button when locked
    expect(
      screen.getByRole('button', { name: /unlock locked node/i }),
    ).toBeInTheDocument();
  });
});
```

**Test count:** ~18 tests across 7 describe blocks

**IMPORTANT NOTE on `fireEvent` import:** The Slider integration test that tests range change uses `fireEvent.change` directly. Since `fireEvent` is already imported at the top of the file from `@testing-library/react`, the `require` call in the example above should be replaced with the top-level import. The actual code should use the already-imported `fireEvent`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
```

Then use `fireEvent.change(range, ...)` directly (same pattern as `Slider.test.tsx` line 68).

---

## Step 6: Write TreePanel Unit Tests

**File:** `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx` (NEW)

**Patterns to follow:**
- `makeProps()` factory from `PieChartPanel.test.tsx` lines 77-85
- `afterEach(cleanup)` from `PieChartPanel.test.tsx` lines 87-89
- Minimal test tree (NOT full 55-node defaultTree) per TL design

**Code:**

```tsx
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TreePanel } from '@/components/TreePanel';
import type { TreePanelProps } from '@/components/TreePanel';
import type { TreeAction, TreeNode } from '@/types';

/**
 * Create a minimal test tree for TreePanel tests.
 *
 * Structure:
 * - root (100%, 10,000,000)
 *   - gender-male (60%, 6,000,000)
 *     - male-g: Торгівля (leaf, 50%)
 *     - male-j: IT та телеком (has 2 children, 50%)
 *       - male-j-sw: Розробка ПЗ (60%)
 *       - male-j-qa: QA / Тестування (40%)
 *   - gender-female (40%, 4,000,000)
 *     - female-g: Торгівля (leaf, 60%)
 *     - female-p: Освіта (leaf, 40%)
 */
function makeTestTree(): TreeNode {
  return {
    id: 'root',
    label: 'Зайняте населення',
    percentage: 100,
    defaultPercentage: 100,
    absoluteValue: 10_000_000,
    genderSplit: { male: 60, female: 40 },
    isLocked: false,
    children: [
      {
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
      },
      {
        id: 'gender-female',
        label: 'Жінки',
        percentage: 40,
        defaultPercentage: 40,
        absoluteValue: 4_000_000,
        genderSplit: { male: 0, female: 100 },
        isLocked: false,
        children: [
          {
            id: 'female-g',
            label: 'Торгівля (Ж)',
            kvedCode: 'G',
            percentage: 60,
            defaultPercentage: 60,
            absoluteValue: 2_400_000,
            genderSplit: { male: 0, female: 100 },
            isLocked: false,
            children: [],
          },
          {
            id: 'female-p',
            label: 'Освіта (Ж)',
            kvedCode: 'P',
            percentage: 40,
            defaultPercentage: 40,
            absoluteValue: 1_600_000,
            genderSplit: { male: 0, female: 100 },
            isLocked: false,
            children: [],
          },
        ],
      },
    ],
  };
}

/** Create default props for TreePanel. */
function makeProps(overrides?: Partial<TreePanelProps>): TreePanelProps {
  return {
    tree: makeTestTree(),
    balanceMode: 'auto',
    dispatch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Root display tests
// -------------------------------------------------------
describe('TreePanel root display', () => {
  it('renders the root label', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.getByText('Зайняте населення')).toBeInTheDocument();
  });

  it('renders the root absolute value formatted', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.getByText('10 000 тис.')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Gender section tests
// -------------------------------------------------------
describe('TreePanel gender sections', () => {
  it('renders both gender section headers', () => {
    render(<TreePanel {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Чоловіки', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Жінки', level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders gender percentages', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });

  it('renders gender absolute values', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.getByText('6 000 тис.')).toBeInTheDocument();
    expect(screen.getByText('4 000 тис.')).toBeInTheDocument();
  });

  it('does not render collapse control on gender nodes', () => {
    render(<TreePanel {...makeProps()} />);

    // Gender nodes should not have expand/collapse buttons
    expect(
      screen.queryByRole('button', { name: /collapse чоловіки/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /expand чоловіки/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /collapse жінки/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /expand жінки/i }),
    ).not.toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Industry visibility tests
// -------------------------------------------------------
describe('TreePanel industry nodes', () => {
  it('shows all industry nodes on initial render', () => {
    render(<TreePanel {...makeProps()} />);

    // Male industries
    expect(screen.getByText('Торгівля')).toBeInTheDocument();
    expect(screen.getByText('IT та телеком')).toBeInTheDocument();
    // Female industries
    expect(screen.getByText('Торгівля (Ж)')).toBeInTheDocument();
    expect(screen.getByText('Освіта (Ж)')).toBeInTheDocument();
  });

  it('does not show chevron on leaf industry nodes', () => {
    render(<TreePanel {...makeProps()} />);

    // Leaf nodes (Торгівля, Освіта) should not have expand buttons
    expect(
      screen.queryByRole('button', { name: /expand торгівля$/i }),
    ).not.toBeInTheDocument();
  });

  it('shows chevron on industry nodes with children', () => {
    render(<TreePanel {...makeProps()} />);

    // IT has children, so it should have a collapse button (starts expanded)
    expect(
      screen.getByRole('button', { name: /collapse it та телеком/i }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Expand/collapse integration tests
// -------------------------------------------------------
describe('TreePanel expand/collapse', () => {
  it('shows subcategories on initial render (IT starts expanded)', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.getByText('Розробка ПЗ')).toBeInTheDocument();
    expect(screen.getByText('QA / Тестування')).toBeInTheDocument();
  });

  it('hides subcategories when IT is collapsed', async () => {
    const user = userEvent.setup();
    render(<TreePanel {...makeProps()} />);

    const collapseBtn = screen.getByRole('button', {
      name: /collapse it та телеком/i,
    });
    await user.click(collapseBtn);

    expect(screen.queryByText('Розробка ПЗ')).not.toBeInTheDocument();
    expect(screen.queryByText('QA / Тестування')).not.toBeInTheDocument();
  });

  it('shows subcategories again when IT is re-expanded', async () => {
    const user = userEvent.setup();
    render(<TreePanel {...makeProps()} />);

    // Collapse
    const collapseBtn = screen.getByRole('button', {
      name: /collapse it та телеком/i,
    });
    await user.click(collapseBtn);

    // Re-expand
    const expandBtn = screen.getByRole('button', {
      name: /expand it та телеком/i,
    });
    await user.click(expandBtn);

    expect(screen.getByText('Розробка ПЗ')).toBeInTheDocument();
    expect(screen.getByText('QA / Тестування')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Accessibility tests
// -------------------------------------------------------
describe('TreePanel accessibility', () => {
  it('wraps gender sections in <section> with aria-label', () => {
    render(<TreePanel {...makeProps()} />);

    const maleSection = screen.getByRole('region', { name: 'Чоловіки' });
    expect(maleSection).toBeInTheDocument();

    const femaleSection = screen.getByRole('region', { name: 'Жінки' });
    expect(femaleSection).toBeInTheDocument();
  });

  it('has proper heading hierarchy (h1 root, h2 gender)', () => {
    render(<TreePanel {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Зайняте населення', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Чоловіки', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Жінки', level: 2 }),
    ).toBeInTheDocument();
  });
});
```

**Test count:** ~12 tests across 5 describe blocks

---

## Step 7: Verification

Run the full verification suite after all implementation steps.

```bash
pnpm lint     # All files pass ESLint (including new TreeRow.tsx, TreePanel.tsx, tests)
pnpm test     # All tests pass (existing 170+ tests + new ~30 tests)
pnpm build    # Type-check + bundle succeeds with no errors
```

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

## Summary of Changes

| Step | File | Action | Lines |
|------|------|--------|-------|
| 1 | `src/components/TreeRow.tsx` | CREATE | ~115 |
| 2 | `src/components/TreePanel.tsx` | CREATE | ~105 |
| 3 | `src/components/index.ts` | MODIFY | +4 lines |
| 4a | `src/App.tsx` | MODIFY | Replace content |
| 4b | `src/main.tsx` | MODIFY | 1 line change |
| 5 | `src/__tests__/components/TreeRow.test.tsx` | CREATE | ~275 |
| 6 | `src/__tests__/components/TreePanel.test.tsx` | CREATE | ~240 |

All file paths are relative to `apps/labor-market-dashboard/`.

## Potential Issues to Watch For

1. **fireEvent vs userEvent for range**: TreeRow tests that verify Slider dispatch via range input must use `fireEvent.change()` (not userEvent) for range inputs -- same pattern as `Slider.test.tsx`
2. **aria-expanded string vs boolean**: `toHaveAttribute('aria-expanded', 'true')` uses string `'true'` not boolean `true` -- HTML attributes are always strings
3. **Import path consistency**: Test files import from `@/components/TreeRow` (direct file) not `@/components` (barrel) -- follows existing test pattern
4. **`section` element role**: `<section aria-label="...">` maps to `role="region"` in accessibility tree -- tests should query with `getByRole('region', { name: '...' })`
5. **Heading level assertions**: `getByRole('heading', { level: 2 })` only works if the element is an actual `<h2>`, not a `<div>` with role="heading"
6. **Set referential stability**: `useCallback` for `handleToggleExpand` must use the functional form of `setExpandedIds` (receives `prev`) to avoid stale closure over `expandedIds`
