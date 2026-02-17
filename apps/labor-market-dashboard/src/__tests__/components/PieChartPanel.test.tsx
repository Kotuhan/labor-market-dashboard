import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PieChartPanel } from '@/components/PieChartPanel';
import type { PieChartPanelProps } from '@/components/PieChartPanel';
import { INDUSTRY_COLORS } from '@/data/chartColors';
import type { TreeNode } from '@/types';

/**
 * Mock ResizeObserver for jsdom (Recharts ResponsiveContainer requires it).
 * This mock triggers the callback immediately with zero-dimension entries,
 * which is sufficient for our DOM-structure-focused tests.
 */
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      // Trigger callback with minimal entry so ResponsiveContainer renders
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

/** Helper: create sample industry nodes for testing. */
function makeSampleNodes(count: number): TreeNode[] {
  const kvedCodes = ['G', 'A', 'B-E', 'O', 'P', 'Q', 'H', 'F', 'M', 'J', 'S', 'N', 'I', 'L', 'K', 'R'];
  const labels = [
    'Торгівля', 'Сільське господарство', 'Промисловість', 'Держуправління та оборона',
    'Освіта', "Охорона здоров'я", 'Транспорт', 'Будівництво',
    'Професійна діяльність', 'IT та телеком', 'Інші послуги', 'Адмін. обслуговування',
    'Готелі, харчування', 'Нерухомість', 'Фінанси / страхування', 'Мистецтво, спорт',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    label: labels[i % labels.length],
    kvedCode: kvedCodes[i % kvedCodes.length],
    percentage: Math.round((100 / count) * 10) / 10,
    defaultPercentage: Math.round((100 / count) * 10) / 10,
    absoluteValue: Math.round(7_109_100 / count),
    genderSplit: { male: 100, female: 0 },
    isLocked: false,
    children: [],
  }));
}

/** Create default props for PieChartPanel. */
function makeProps(overrides?: Partial<PieChartPanelProps>): PieChartPanelProps {
  return {
    nodes: makeSampleNodes(4),
    colorMap: INDUSTRY_COLORS,
    ariaLabel: 'Male industry distribution',
    balanceMode: 'auto',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Accessibility / structure tests
// -------------------------------------------------------
describe('PieChartPanel accessibility', () => {
  it('renders a figure with role="img" and aria-label', () => {
    render(<PieChartPanel {...makeProps()} />);

    const figure = screen.getByRole('img', {
      name: 'Male industry distribution',
    });
    expect(figure).toBeInTheDocument();
  });

  it('renders screen-reader data table with correct row count', () => {
    const nodes = makeSampleNodes(4);
    render(<PieChartPanel {...makeProps({ nodes })} />);

    // The table should have 4 data rows (one per node)
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // +1 for header row
    expect(rows).toHaveLength(5);
  });

  it('data table contains formatted values', () => {
    const nodes = [
      {
        id: 'test-g',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 16.8,
        defaultPercentage: 16.8,
        absoluteValue: 1_194_329,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
    ];
    render(<PieChartPanel {...makeProps({ nodes })} />);

    const table = screen.getByRole('table');
    expect(within(table).getByText('Торгівля')).toBeInTheDocument();
    expect(within(table).getByText('16.8%')).toBeInTheDocument();
    expect(within(table).getByText('1 194 тис.')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Legend tests
// -------------------------------------------------------
describe('PieChartPanel legend', () => {
  it('renders legend when showLegend is true (default)', () => {
    render(<PieChartPanel {...makeProps()} />);

    // Legend renders list items
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('hides legend when showLegend is false', () => {
    render(<PieChartPanel {...makeProps({ showLegend: false })} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('legend excludes ghost slices', () => {
    const nodes = [
      {
        id: 'node-1',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 60,
        defaultPercentage: 60,
        absoluteValue: 4_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
      {
        id: 'node-2',
        label: 'Освіта',
        kvedCode: 'P',
        percentage: 30,
        defaultPercentage: 30,
        absoluteValue: 2_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
    ];

    render(
      <PieChartPanel {...makeProps({ nodes, balanceMode: 'free' })} />,
    );

    const listItems = screen.getAllByRole('listitem');
    // Should show 2 items (Торгівля + Освіта), NOT the ghost "Нерозподілено"
    expect(listItems).toHaveLength(2);
  });
});

// -------------------------------------------------------
// Free mode / ghost slice tests
// -------------------------------------------------------
describe('PieChartPanel free mode', () => {
  it('data table excludes ghost slice entries', () => {
    const nodes = [
      {
        id: 'node-1',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 80,
        defaultPercentage: 80,
        absoluteValue: 5_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
    ];

    render(
      <PieChartPanel {...makeProps({ nodes, balanceMode: 'free' })} />,
    );

    const table = screen.getByRole('table');
    const dataRows = within(table).getAllByRole('row');
    // 1 header + 1 data row (ghost excluded from table)
    expect(dataRows).toHaveLength(2);
  });

  it('shows overflow indicator when sum > 100% in free mode', () => {
    const nodes = [
      {
        id: 'node-1',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 60,
        defaultPercentage: 60,
        absoluteValue: 4_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
      {
        id: 'node-2',
        label: 'Освіта',
        kvedCode: 'P',
        percentage: 55,
        defaultPercentage: 55,
        absoluteValue: 3_500_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
    ];

    render(
      <PieChartPanel {...makeProps({ nodes, balanceMode: 'free' })} />,
    );

    // Should show overflow badge with total percentage
    expect(screen.getByText('115.0%')).toBeInTheDocument();
  });

  it('does not show overflow indicator in auto mode', () => {
    render(<PieChartPanel {...makeProps({ balanceMode: 'auto' })} />);

    // No overflow badge
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('115.0%');
  });
});

// -------------------------------------------------------
// Size variant tests
// -------------------------------------------------------
describe('PieChartPanel size variants', () => {
  it('renders with standard size by default', () => {
    const { container } = render(<PieChartPanel {...makeProps()} />);

    // Check that the chart container has the standard height
    const chartContainer = container.querySelector('[style*="min-height"]');
    expect(chartContainer).toHaveStyle({ minHeight: '300px' });
  });

  it('renders with mini size when specified', () => {
    const { container } = render(
      <PieChartPanel {...makeProps({ size: 'mini' })} />,
    );

    const chartContainer = container.querySelector('[style*="min-height"]');
    expect(chartContainer).toHaveStyle({ minHeight: '200px' });
  });
});
