# Implementation Plan: Subtask 8.3 -- TreePanel Refactor + Deviation Warnings

Generated: 2026-02-17

## Overview

This subtask refactors `TreePanel` from rendering the full tree (root + all genders) to rendering industries for a **single gender node**. The root header (`<h1>`) is removed (moves to DashboardHeader in subtask 8.2). Additionally, inline free-mode deviation warnings are added to both TreePanel (gender-level) and TreeRow (subcategory-level).

### Key Changes

1. **TreePanel API change**: `tree: TreeNode` (root) becomes `genderNode: TreeNode` (single gender node)
2. **Root header removed**: No more `<h1>` in TreePanel -- DashboardHeader owns the `<h1>` (subtask 8.2, arch-review condition 1)
3. **Single gender rendering**: TreePanel renders one gender's `<h2>` heading + industry rows (no loop over `tree.children`)
4. **Deviation warning in TreePanel**: When `balanceMode === 'free'` and `getSiblingDeviation(genderNode) !== 0`, show inline warning below the gender header
5. **Deviation warning in TreeRow**: When expanded, `balanceMode === 'free'`, and `getSiblingDeviation(node) !== 0`, show inline warning below children
6. **Test updates**: All 14 existing TreePanel tests adapted for new API + 4 new deviation tests. TreeRow gets 5 new deviation tests.

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/labor-market-dashboard/src/components/TreePanel.tsx` | **Major refactor** | New props API, remove root header, single gender rendering, add deviation warning |
| `apps/labor-market-dashboard/src/components/TreeRow.tsx` | **Modify** | Add deviation warning for expanded nodes with children in free mode |
| `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx` | **Rewrite** | Update all tests for new API, add deviation warning tests |
| `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx` | **Extend** | Add deviation warning tests |
| `apps/labor-market-dashboard/src/App.tsx` | **Temporary update** | Adapt to new TreePanel API for build compatibility |

No new files are created. No barrel export changes needed (TreePanel and TreeRow are already exported).

---

## Step 1: Refactor TreePanel.tsx

### Changes Summary

- **Props**: `tree: TreeNode` becomes `genderNode: TreeNode`
- **Remove**: Root header (`<h1>`, root absolute value display)
- **Remove**: `tree.children.map()` loop -- render single gender directly
- **Simplify**: `collectExpandableIds` walks `genderNode.children` (not the full tree from root)
- **Add**: Deviation warning when `balanceMode === 'free'` and deviation !== 0
- **Keep**: `<section aria-label>` wrapper, `<h2>` heading, percentage/absolute display, expand/collapse state, `useCallback` for toggle handler

### Complete Refactored Code

```tsx
// apps/labor-market-dashboard/src/components/TreePanel.tsx

import { useCallback, useState } from 'react';

import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { getSiblingDeviation } from '@/utils/calculations';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

import { TreeRow } from './TreeRow';

/** Props for the TreePanel component. */
export interface TreePanelProps {
  /** Single gender node to render (male or female) */
  genderNode: TreeNode;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Collect all node IDs that have children (for initial expand state).
 * Walks a single gender node's children depth-first.
 * Only tracks nodes with children (industries with subcategories).
 */
function collectExpandableIds(genderNode: TreeNode): string[] {
  const ids: string[] = [];

  function walk(n: TreeNode): void {
    if (n.children.length > 0) {
      ids.push(n.id);
    }
    for (const child of n.children) {
      walk(child);
    }
  }

  // Walk industry-level children of the gender node
  for (const industry of genderNode.children) {
    walk(industry);
  }

  return ids;
}

/**
 * Format a deviation value for display.
 * Returns a string like "Сума: 95.0% (-5.0%)" or "Сума: 108.3% (+8.3%)".
 *
 * @param deviation - Deviation from 100% (positive = over, negative = under)
 */
function formatDeviation(deviation: number): string {
  const sum = 100 + deviation;
  const sign = deviation > 0 ? '+' : '';
  return `Сума: ${formatPercentage(sum)} (${sign}${formatPercentage(deviation)})`;
}

/**
 * Container component for a single gender's industry tree.
 *
 * Manages expand/collapse state locally (UI-only, not in reducer).
 * Renders gender heading (<h2>), percentage + absolute value,
 * optional deviation warning (free mode), and TreeRow instances
 * for each industry node.
 */
export function TreePanel({ genderNode, balanceMode, dispatch }: TreePanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(collectExpandableIds(genderNode)),
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

  const deviation = balanceMode === 'free' ? getSiblingDeviation(genderNode) : 0;

  return (
    <section aria-label={genderNode.label}>
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

      {/* Deviation warning (free mode only) */}
      {deviation !== 0 && (
        <p className="mb-2 text-sm font-medium text-amber-600" role="status">
          {formatDeviation(deviation)}
        </p>
      )}

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
  );
}
```

### Key Decisions

1. **`formatDeviation` is a module-level helper** (not exported) -- it is only used by TreePanel. TreeRow uses inline formatting since the pattern is short.
2. **Deviation warning uses `role="status"`** -- this is a live region that screen readers will announce when it changes. `role="status"` has `aria-live="polite"` semantics.
3. **Warning color is `text-amber-600`** -- warm amber for warning without being alarming red.
4. **`collectExpandableIds` simplified** -- no longer needs `depth` tracking since we start from gender node's children (all are industry-level, depth 0 in the relative sense).
5. **Outer `<div>` replaced with `<section>`** -- the component now renders a single gender section, so the `<section aria-label>` wrapper is the root element. This was previously inside the `.map()` loop.

---

## Step 2: Modify TreeRow.tsx -- Add Deviation Warnings

### Changes Summary

- **Add `balanceMode` awareness for deviation**: After rendering expanded children, if `balanceMode === 'free'` and `getSiblingDeviation(node) !== 0`, render inline warning
- **Import `getSiblingDeviation`** from `@/utils/calculations`
- **Import `formatPercentage`** from `@/utils/format`
- **No props changes** -- `balanceMode` is already a prop

### Complete Updated Code

```tsx
// apps/labor-market-dashboard/src/components/TreeRow.tsx

import { memo } from 'react';

import type { BalanceMode, TreeAction, TreeNode } from '@/types';
import { canToggleLock, getSiblingDeviation } from '@/utils/calculations';
import { formatPercentage } from '@/utils/format';

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
 * In free mode, shows deviation warning for expanded nodes whose children
 * don't sum to 100%.
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
    </div>
  );
});
```

### Key Decisions

1. **Deviation warning placement**: Rendered AFTER the children block, at child indentation depth (`depth + 1`). This visually places it below the subcategory list.
2. **`showDeviation` guard**: Only compute `getSiblingDeviation` when the node is expanded, has children, and balance mode is free. This avoids unnecessary computation for leaf nodes and collapsed nodes.
3. **Inline formatting**: The deviation text uses inline `formatPercentage` calls rather than a separate helper function, keeping TreeRow self-contained. The format matches TreePanel's pattern: `Сума: 95.0% (-5.0%)`.
4. **No props change**: `balanceMode` is already in `TreeRowProps`. No API change needed.
5. **Line count**: The updated TreeRow is approximately 143 lines -- well under the 200-line limit.

---

## Step 3: Rewrite TreePanel.test.tsx

### Changes Summary

- **Test tree fixture**: Changes from a full root tree to a single gender node (`makeTestGenderNode`)
- **`makeProps`**: Uses `genderNode` instead of `tree`
- **Root display tests**: REMOVED (root header is now in DashboardHeader, tested in subtask 8.2)
- **Gender section tests**: Adapted to test single gender node rendering
- **Deviation warning tests**: NEW -- 4 tests for free-mode deviation behavior
- **All other tests**: Adapted for new API (same assertions, different fixture shape)

### Complete Updated Test File

```tsx
// apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TreePanel } from '@/components/TreePanel';
import type { TreePanelProps } from '@/components/TreePanel';
import type { TreeNode } from '@/types';

/**
 * Create a minimal test gender node for TreePanel tests.
 *
 * Structure:
 * - gender-male (60%, 6,000,000)
 *   - male-g: Торгівля (leaf, 50%)
 *   - male-j: IT та телеком (has 2 children, 50%)
 *     - male-j-sw: Розробка ПЗ (60%)
 *     - male-j-qa: QA / Тестування (40%)
 */
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

/** Create default props for TreePanel. */
function makeProps(overrides?: Partial<TreePanelProps>): TreePanelProps {
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
// Gender heading tests
// -------------------------------------------------------
describe('TreePanel gender heading', () => {
  it('renders the gender label as h2', () => {
    render(<TreePanel {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Чоловіки', level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders gender percentage in section header', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.getByText('60.0%')).toBeInTheDocument();
  });

  it('renders gender absolute value in section header', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.getByText('6 000 тис.')).toBeInTheDocument();
  });

  it('does not render collapse control on gender node', () => {
    render(<TreePanel {...makeProps()} />);

    expect(
      screen.queryByRole('button', { name: /collapse чоловіки/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /expand чоловіки/i }),
    ).not.toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Industry visibility tests
// -------------------------------------------------------
describe('TreePanel industry nodes', () => {
  it('shows all industry nodes on initial render', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
    expect(screen.getByText('IT та телеком')).toBeInTheDocument();
  });

  it('does not show chevron on leaf industry nodes', () => {
    render(<TreePanel {...makeProps()} />);

    expect(
      screen.queryByRole('button', { name: /expand торгівля$/i }),
    ).not.toBeInTheDocument();
  });

  it('shows chevron on industry nodes with children', () => {
    render(<TreePanel {...makeProps()} />);

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
  it('wraps gender section in <section> with aria-label', () => {
    render(<TreePanel {...makeProps()} />);

    const maleSection = screen.getByRole('region', { name: 'Чоловіки' });
    expect(maleSection).toBeInTheDocument();
  });

  it('has h2 heading for gender', () => {
    render(<TreePanel {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Чоловіки', level: 2 }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Deviation warning tests (free mode)
// -------------------------------------------------------
describe('TreePanel deviation warnings', () => {
  it('shows deviation warning in free mode when industries do not sum to 100%', () => {
    const genderNode = makeTestGenderNode();
    // Set industries to sum to 90% (50 + 40 = 90, deviation = -10)
    genderNode.children[1] = {
      ...genderNode.children[1],
      percentage: 40,
    };

    render(<TreePanel {...makeProps({ genderNode, balanceMode: 'free' })} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Сума: 90.0% (-10.0%)',
    );
  });

  it('shows positive deviation warning when industries sum over 100%', () => {
    const genderNode = makeTestGenderNode();
    // Set industries to sum to 110% (50 + 60 = 110, deviation = +10)
    genderNode.children[1] = {
      ...genderNode.children[1],
      percentage: 60,
    };

    render(<TreePanel {...makeProps({ genderNode, balanceMode: 'free' })} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Сума: 110.0% (+10.0%)',
    );
  });

  it('does not show deviation warning in auto mode', () => {
    const genderNode = makeTestGenderNode();
    // Set deviation but in auto mode
    genderNode.children[1] = {
      ...genderNode.children[1],
      percentage: 40,
    };

    render(<TreePanel {...makeProps({ genderNode, balanceMode: 'auto' })} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not show deviation warning in free mode when sum is exactly 100%', () => {
    // Default test node: 50 + 50 = 100% -- no deviation
    render(<TreePanel {...makeProps({ balanceMode: 'free' })} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
```

### Test Changes Explanation

| Original Test Section | Change | Reason |
|----------------------|--------|--------|
| Root display (2 tests) | **Removed** | Root header moves to DashboardHeader (subtask 8.2) |
| Gender sections (4 tests) | **Adapted** (now "Gender heading", 4 tests) | Test single gender instead of both. Removed `within()` scoped header queries since only one gender is rendered. |
| Industry nodes (3 tests) | **Unchanged** (same assertions) | Industry nodes render the same way under single gender |
| Expand/collapse (3 tests) | **Unchanged** (same assertions) | Expand/collapse behavior identical |
| Accessibility (2 tests) | **Adapted** (2 tests) | Removed `<h1>` assertion, removed female section assertion (single gender), kept `<section aria-label>` and `<h2>` |
| Deviation warnings | **NEW** (4 tests) | Free mode deviation display, positive/negative, auto mode hidden, exact 100% no warning |

**Total**: 16 tests (was 14: minus 2 root tests, plus 4 deviation tests)

---

## Step 4: Extend TreeRow.test.tsx -- Deviation Warning Tests

### New Test Section

Append a new `describe('TreeRow deviation warnings')` section at the end of the existing test file.

### Code to Append

Add this after the existing `describe('TreeRow locked state')` block (after line 371):

```tsx
// -------------------------------------------------------
// Deviation warning tests (free mode, subcategory level)
// -------------------------------------------------------
describe('TreeRow deviation warnings', () => {
  it('shows deviation warning when expanded in free mode with deviation', () => {
    const node = makeNodeWithChildren();
    // Subcategories sum to 74.3% (59.6 + 14.7 = 74.3, deviation = -25.7)
    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          balanceMode: 'free',
          expandedIds: new Set(['test-j']),
        })}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Сума: 74.3% (-25.7%)',
    );
  });

  it('does not show deviation warning in auto mode', () => {
    const node = makeNodeWithChildren();
    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          balanceMode: 'auto',
          expandedIds: new Set(['test-j']),
        })}
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not show deviation warning when collapsed', () => {
    const node = makeNodeWithChildren();
    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          balanceMode: 'free',
          expandedIds: new Set(), // collapsed
        })}
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not show deviation warning on leaf nodes', () => {
    render(
      <TreeRow
        {...makeProps({
          balanceMode: 'free',
        })}
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not show deviation warning when subcategories sum to exactly 100%', () => {
    const node = makeNodeWithChildren();
    // Override children to sum to exactly 100%
    node.children = [
      makeNode({
        id: 'test-j-software',
        label: 'Розробка ПЗ',
        percentage: 60,
        absoluteValue: 131_348,
      }),
      makeNode({
        id: 'test-j-qa',
        label: 'QA / Тестування',
        percentage: 40,
        absoluteValue: 32_396,
      }),
    ];

    render(
      <TreeRow
        {...makeProps({
          node,
          siblings: [node],
          balanceMode: 'free',
          expandedIds: new Set(['test-j']),
        })}
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
```

### Test Note on Existing `makeNodeWithChildren`

The existing `makeNodeWithChildren()` creates children with percentages 59.6 + 14.7 = 74.3%. This intentionally does NOT sum to 100%, which is perfect for testing deviation warnings -- the deviation is -25.7%.

For the "no deviation" test, we override children to sum to exactly 100% (60 + 40 = 100).

**Total TreeRow tests after change**: 26 (was 21, plus 5 new deviation tests)

---

## Step 5: Temporary App.tsx Update

After refactoring TreePanel, `App.tsx` will have a compile error because it passes `tree={state.tree}` to TreePanel, which now expects `genderNode`. A temporary update is needed for the build to pass.

### Temporary Code

```tsx
// apps/labor-market-dashboard/src/App.tsx
// Temporary update for build compatibility -- will be fully rewritten in subtask 8.5

import { TreePanel } from '@/components';
import { useTreeState } from '@/hooks';

export function App() {
  const { state, dispatch } = useTreeState();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        {state.tree.children.map((genderNode) => (
          <TreePanel
            key={genderNode.id}
            genderNode={genderNode}
            balanceMode={state.balanceMode}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}
```

This renders both genders using the new API. The root header (`<h1>`) will be missing until subtask 8.2 adds DashboardHeader, but the functionality is preserved.

---

## Implementation Order

1. **TreePanel.tsx** -- Refactor to new API with deviation warnings
2. **TreeRow.tsx** -- Add deviation warning rendering
3. **TreePanel.test.tsx** -- Rewrite tests for new API + deviation tests
4. **TreeRow.test.tsx** -- Append deviation warning tests
5. **App.tsx** -- Temporary update for build compatibility
6. **Verify** -- Run lint, test, build

---

## Verification Steps

```bash
# 1. Run tests for this app only (fast feedback)
pnpm test --filter @template/labor-market-dashboard

# 2. Run linter
pnpm lint

# 3. Run full build (type-check + bundle)
pnpm build

# 4. Run all tests across monorepo
pnpm test
```

### Expected Results

- **Tests**: All existing tests pass (adapted), 4 new TreePanel deviation tests pass, 5 new TreeRow deviation tests pass
- **Lint**: No new warnings or errors
- **Build**: Successful compilation (with temporary App.tsx update)
- **Total test count change**: TreePanel 14 -> 16, TreeRow 21 -> 26

---

## Risk Notes

1. **Breaking API change**: `TreePanelProps.tree` becomes `TreePanelProps.genderNode`. This is intentional and contained. The only consumer (App.tsx) is updated in this subtask temporarily and fully in subtask 8.5.
2. **`collectExpandableIds` simplification**: The function no longer needs depth tracking. This is safe because gender nodes are never tracked in `expandedIds` (they are section headers, not collapsible), and the new TreePanel only sees industry-level children.
3. **Deviation `formatPercentage` edge case**: `getSiblingDeviation` rounds to 1 decimal place. `formatPercentage` also uses 1 decimal place. No double-rounding concern since `getSiblingDeviation` already returns a clean 1-decimal value.
4. **`role="status"` for deviation warnings**: This ARIA live region ensures screen readers announce deviation changes. It does not interrupt the user -- `role="status"` has `aria-live="polite"` semantics.
5. **Temporary App.tsx**: The root `<h1>` heading is missing between this subtask and subtask 8.2 (DashboardHeader). This is an acceptable transient state per arch-review condition 1 which requires the heading to be in DashboardHeader (not yet created).
