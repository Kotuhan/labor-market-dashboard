import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TreePanel } from '@/components/TreePanel';
import type { TreePanelProps } from '@/components/TreePanel';
import type { TreeNode } from '@/types';

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
 *     - female-g: Торгівля (Ж) (leaf, 60%)
 *     - female-p: Освіта (Ж) (leaf, 40%)
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

  it('renders gender percentages in section headers', () => {
    render(<TreePanel {...makeProps()} />);

    // Scope queries within gender section headers to avoid ambiguity
    // with industry sliders that may have the same percentage values
    const maleSection = screen.getByRole('region', { name: 'Чоловіки' });
    const maleHeader = maleSection.querySelector('.mb-2') as HTMLElement;
    expect(within(maleHeader).getByText('60.0%')).toBeInTheDocument();

    const femaleSection = screen.getByRole('region', { name: 'Жінки' });
    const femaleHeader = femaleSection.querySelector('.mb-2') as HTMLElement;
    expect(within(femaleHeader).getByText('40.0%')).toBeInTheDocument();
  });

  it('renders gender absolute values in section headers', () => {
    render(<TreePanel {...makeProps()} />);

    const maleSection = screen.getByRole('region', { name: 'Чоловіки' });
    const maleHeader = maleSection.querySelector('.mb-2') as HTMLElement;
    expect(within(maleHeader).getByText('6 000 тис.')).toBeInTheDocument();

    const femaleSection = screen.getByRole('region', { name: 'Жінки' });
    const femaleHeader = femaleSection.querySelector('.mb-2') as HTMLElement;
    expect(within(femaleHeader).getByText('4 000 тис.')).toBeInTheDocument();
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
