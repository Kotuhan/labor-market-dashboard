import { cleanup, render, screen, within } from '@testing-library/react';
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

/** Create a female sibling for gender ratio slider. */
function makeFemaleSibling(): TreeNode {
  return {
    id: 'gender-female',
    label: 'Жінки',
    percentage: 40,
    defaultPercentage: 40,
    absoluteValue: 4_000_000,
    genderSplit: { male: 0, female: 100 },
    isLocked: false,
    children: [],
  };
}

/** Create default props for TreePanel. */
function makeProps(overrides?: Partial<TreePanelProps>): TreePanelProps {
  const genderNode = overrides?.genderNode ?? makeTestGenderNode();
  return {
    genderNode,
    genderSiblings: [genderNode, makeFemaleSibling()],
    balanceMode: 'auto',
    dispatch: vi.fn(),
    mirrored: false,
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

  it('renders industry list toggle on gender heading', () => {
    render(<TreePanel {...makeProps()} />);

    expect(
      screen.getByRole('button', { name: /expand чоловіки/i }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Industry list collapse/expand tests
// -------------------------------------------------------
describe('TreePanel industry list toggle', () => {
  it('hides industry nodes by default (collapsed)', () => {
    render(<TreePanel {...makeProps()} />);

    expect(screen.queryByText('Торгівля')).not.toBeInTheDocument();
    expect(screen.queryByText('IT та телеком')).not.toBeInTheDocument();
  });

  it('shows industry nodes when expanded', async () => {
    const user = userEvent.setup();
    render(<TreePanel {...makeProps()} />);

    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
    expect(screen.getByText('IT та телеком')).toBeInTheDocument();
  });

  it('hides industry nodes again when collapsed', async () => {
    const user = userEvent.setup();
    render(<TreePanel {...makeProps()} />);

    // Expand
    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));
    expect(screen.getByText('Торгівля')).toBeInTheDocument();

    // Collapse
    await user.click(screen.getByRole('button', { name: /collapse чоловіки/i }));
    expect(screen.queryByText('Торгівля')).not.toBeInTheDocument();
  });

  it('has aria-expanded="false" when collapsed', () => {
    render(<TreePanel {...makeProps()} />);

    expect(
      screen.getByRole('button', { name: /expand чоловіки/i }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('has aria-expanded="true" when expanded', async () => {
    const user = userEvent.setup();
    render(<TreePanel {...makeProps()} />);

    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    expect(
      screen.getByRole('button', { name: /collapse чоловіки/i }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps gender ratio slider always visible when collapsed', () => {
    render(<TreePanel {...makeProps()} />);

    // Gender slider should be present even when industries are hidden
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// IT subcategory expand/collapse tests
// -------------------------------------------------------
describe('TreePanel IT subcategory expand/collapse', () => {
  it('auto-expands IT subcategories when industries are shown (auto-expand effect)', async () => {
    const user = userEvent.setup();
    render(<TreePanel {...makeProps()} />);

    // First expand industries
    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    // IT subcategories should be visible (auto-expand adds male-j to expandedIds on mount)
    expect(screen.getByText('Розробка ПЗ')).toBeInTheDocument();
    expect(screen.getByText('QA / Тестування')).toBeInTheDocument();
  });

  it('hides IT subcategories when IT is collapsed by user', async () => {
    const user = userEvent.setup();
    render(<TreePanel {...makeProps()} />);

    // Expand industries (IT is auto-expanded), then collapse IT
    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));
    await user.click(screen.getByRole('button', { name: /collapse it та телеком/i }));

    expect(screen.queryByText('Розробка ПЗ')).not.toBeInTheDocument();
    expect(screen.queryByText('QA / Тестування')).not.toBeInTheDocument();
  });

  it('shows IT subcategories again when re-expanded after collapse', async () => {
    const user = userEvent.setup();
    render(<TreePanel {...makeProps()} />);

    // Expand industries (IT is auto-expanded), collapse IT, then re-expand IT
    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));
    await user.click(screen.getByRole('button', { name: /collapse it та телеком/i }));
    await user.click(screen.getByRole('button', { name: /expand it та телеком/i }));

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
  it('shows deviation warning in free mode when industries do not sum to 100%', async () => {
    const user = userEvent.setup();
    const genderNode = makeTestGenderNode();
    // Set industries to sum to 90% (50 + 40 = 90, deviation = -10)
    genderNode.children[1] = {
      ...genderNode.children[1],
      percentage: 40,
    };

    render(<TreePanel {...makeProps({ genderNode, balanceMode: 'free' })} />);

    // Expand industries to see deviation warning
    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Сума: 90.0% (-10.0%)',
    );
  });

  it('shows positive deviation warning when industries sum over 100%', async () => {
    const user = userEvent.setup();
    const genderNode = makeTestGenderNode();
    // Set industries to sum to 110% (50 + 60 = 110, deviation = +10)
    genderNode.children[1] = {
      ...genderNode.children[1],
      percentage: 60,
    };

    render(<TreePanel {...makeProps({ genderNode, balanceMode: 'free' })} />);

    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Сума: 110.0% (+10.0%)',
    );
  });

  it('does not show deviation warning in auto mode', async () => {
    const user = userEvent.setup();
    const genderNode = makeTestGenderNode();
    // Set deviation but in auto mode
    genderNode.children[1] = {
      ...genderNode.children[1],
      percentage: 40,
    };

    render(<TreePanel {...makeProps({ genderNode, balanceMode: 'auto' })} />);

    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not show deviation warning in free mode when sum is exactly 100%', async () => {
    const user = userEvent.setup();
    // Default test node: 50 + 50 = 100% -- no deviation
    render(<TreePanel {...makeProps({ balanceMode: 'free' })} />);

    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Mirrored layout tests
// -------------------------------------------------------
describe('TreePanel mirrored layout', () => {
  it('renders heading toggle with flex-row-reverse when mirrored', () => {
    render(<TreePanel {...makeProps({ mirrored: true })} />);

    const toggle = screen.getByRole('button', { name: /expand чоловіки/i });
    expect(toggle.className).toContain('flex-row-reverse');
  });

  it('renders heading toggle without flex-row-reverse when not mirrored', () => {
    render(<TreePanel {...makeProps({ mirrored: false })} />);

    const toggle = screen.getByRole('button', { name: /expand чоловіки/i });
    expect(toggle.className).not.toContain('flex-row-reverse');
  });
});

// -------------------------------------------------------
// Auto-expand tests
// -------------------------------------------------------
describe('TreePanel auto-expand', () => {
  it('auto-expands an industry that gains children (re-render with children added)', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    const { rerender } = render(<TreePanel {...props} />);

    // Expand the industry list
    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    // Торгівля is a leaf -- no expand chevron, no subcategory visible
    expect(
      screen.queryByRole('button', { name: /expand торгівля/i }),
    ).not.toBeInTheDocument();

    // Re-render with Торгівля now having a child subcategory
    const withSubcategory = makeTestGenderNode({
      children: [
        {
          ...makeTestGenderNode().children[0], // male-g (Торгівля)
          children: [
            {
              id: 'male-g-test',
              label: 'Тестова підкатегорія',
              percentage: 100,
              defaultPercentage: 0,
              absoluteValue: 3_000_000,
              genderSplit: { male: 100, female: 0 },
              isLocked: false,
              children: [],
            },
          ],
        },
        makeTestGenderNode().children[1], // male-j (IT) unchanged
      ],
    });

    rerender(<TreePanel {...makeProps({ genderNode: withSubcategory })} />);

    // The subcategory should be automatically visible because auto-expand
    // added male-g to expandedIds
    expect(screen.getByText('Тестова підкатегорія')).toBeInTheDocument();
  });

  it('does not re-expand a node that was manually collapsed by the user', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    const { rerender } = render(<TreePanel {...props} />);

    // Expand the industry list
    await user.click(screen.getByRole('button', { name: /expand чоловіки/i }));

    // The auto-expand effect should have expanded IT (male-j) since it has children.
    // Verify subcategories are visible.
    expect(screen.getByText('Розробка ПЗ')).toBeInTheDocument();

    // User manually collapses IT
    await user.click(screen.getByRole('button', { name: /collapse it та телеком/i }));
    expect(screen.queryByText('Розробка ПЗ')).not.toBeInTheDocument();

    // Re-render with the same props (no structural change)
    rerender(<TreePanel {...props} />);

    // IT should remain collapsed -- auto-expand does not fight user's explicit collapse
    expect(screen.queryByText('Розробка ПЗ')).not.toBeInTheDocument();
  });
});
