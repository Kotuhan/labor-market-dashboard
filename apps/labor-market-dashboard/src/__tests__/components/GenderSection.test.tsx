import { cleanup, render, screen, within } from '@testing-library/react';
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

    // Use getAllByText because PieChartPanel sr-only table duplicates labels
    expect(screen.getAllByText('Торгівля').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('IT та телеком').length).toBeGreaterThanOrEqual(1);
  });

  it('pie chart data table has correct row count matching industries', () => {
    render(<GenderSection {...makeProps()} />);

    // Scope to the industry-level PieChartPanel figure (not the mini subcategory chart)
    const industryFigure = screen.getByRole('img', {
      name: 'Розподіл галузей -- Чоловіки',
    });
    const table = within(industryFigure).getByRole('table');
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
