import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { TreePanel } from '@/components/TreePanel';
import type { TreePanelProps } from '@/components/TreePanel';
import type { TreeNode } from '@/types';

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

    const section = screen.getByRole('region', { name: 'Чоловіки' });
    const header = section.querySelector('.mb-2') as HTMLElement;
    expect(within(header).getByText('60.0%')).toBeInTheDocument();
  });

  it('renders gender absolute value in section header', () => {
    render(<TreePanel {...makeProps()} />);

    const section = screen.getByRole('region', { name: 'Чоловіки' });
    const header = section.querySelector('.mb-2') as HTMLElement;
    expect(within(header).getByText('6 000 тис.')).toBeInTheDocument();
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

    // Use getAllByText because mini pie chart sr-only tables duplicate labels
    expect(screen.getAllByText('Торгівля').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('IT та телеком').length).toBeGreaterThanOrEqual(1);
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

    // Use getAllByText because mini pie chart sr-only tables duplicate labels
    expect(screen.getAllByText('Розробка ПЗ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('QA / Тестування').length).toBeGreaterThanOrEqual(1);
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

    // Use getAllByText because mini pie chart sr-only tables duplicate labels
    expect(screen.getAllByText('Розробка ПЗ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('QA / Тестування').length).toBeGreaterThanOrEqual(1);
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
