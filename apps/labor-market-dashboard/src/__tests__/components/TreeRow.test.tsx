import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    mirrored: false,
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
// Mirrored layout tests
// -------------------------------------------------------
describe('TreeRow mirrored layout', () => {
  it('applies paddingRight instead of paddingLeft when mirrored', () => {
    const { container } = render(
      <TreeRow {...makeProps({ depth: 1, mirrored: true })} />,
    );

    const rowDiv = container.firstElementChild?.firstElementChild;
    expect(rowDiv).toHaveStyle({ paddingRight: '24px' });
  });

  it('applies flex-row-reverse when mirrored', () => {
    const { container } = render(
      <TreeRow {...makeProps({ mirrored: true })} />,
    );

    const rowDiv = container.firstElementChild?.firstElementChild;
    expect(rowDiv?.className).toContain('flex-row-reverse');
  });

  it('does not apply flex-row-reverse when not mirrored', () => {
    const { container } = render(
      <TreeRow {...makeProps({ mirrored: false })} />,
    );

    const rowDiv = container.firstElementChild?.firstElementChild;
    expect(rowDiv?.className).not.toContain('flex-row-reverse');
  });

  it('uses paddingRight for mirrored depth 2', () => {
    const { container } = render(
      <TreeRow {...makeProps({ depth: 2, mirrored: true })} />,
    );

    const rowDiv = container.firstElementChild?.firstElementChild;
    expect(rowDiv).toHaveStyle({ paddingRight: '48px' });
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

  it('passes dispatch to Slider (range change dispatches SET_PERCENTAGE)', async () => {
    const dispatch = vi.fn<(action: TreeAction) => void>();
    const node = makeNode({ id: 'test-dispatch' });
    const siblings = [node, makeNode({ id: 's2' })];
    render(
      <TreeRow {...makeProps({ node, siblings, dispatch })} />,
    );

    const range = screen.getByRole('slider');
    fireEvent.change(range, { target: { value: '50' } });

    // Dispatch is throttled via requestAnimationFrame
    await vi.waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SET_PERCENTAGE',
        nodeId: 'test-dispatch',
        value: 50,
      });
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
