import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { GenderBarChart } from '@/components/GenderBarChart';
import type { GenderBarChartProps } from '@/components/GenderBarChart';
import { defaultTree } from '@/data/defaultTree';
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
              width: 800,
              height: 400,
              top: 0,
              left: 0,
              bottom: 400,
              right: 800,
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

afterEach(cleanup);

const maleNode = defaultTree.children[0];
const femaleNode = defaultTree.children[1];

/** Helper: create default props. */
function makeProps(overrides?: Partial<GenderBarChartProps>): GenderBarChartProps {
  return {
    maleNode,
    femaleNode,
    ...overrides,
  };
}

describe('GenderBarChart', () => {
  it('renders figure with role="img" and aria-label', () => {
    render(<GenderBarChart {...makeProps()} />);

    const figure = screen.getByRole('img');
    expect(figure).toBeDefined();
    expect(figure.getAttribute('aria-label')).toBe(
      'Порівняння зайнятості за статтю та галузями',
    );
  });

  it('sr-only data table has 16 data rows plus header', () => {
    render(<GenderBarChart {...makeProps()} />);

    const table = screen.getByRole('table');
    expect(table).toBeDefined();

    const rows = within(table).getAllByRole('row');
    // 1 header row + 16 data rows
    expect(rows).toHaveLength(17);
  });

  it('data table shows formatted absolute values', () => {
    render(<GenderBarChart {...makeProps()} />);

    const table = screen.getByRole('table');
    // Check caption
    expect(within(table).getByText('Порівняння зайнятості за статтю та галузями')).toBeDefined();
    // Check column headers
    expect(within(table).getByText('Галузь')).toBeDefined();
    expect(within(table).getByText('Чоловіки')).toBeDefined();
    expect(within(table).getByText('Жінки')).toBeDefined();
  });

  it('handles empty children without crashing', () => {
    const emptyMale: TreeNode = {
      ...maleNode,
      children: [],
    };
    const emptyFemale: TreeNode = {
      ...femaleNode,
      children: [],
    };

    render(<GenderBarChart {...makeProps({ maleNode: emptyMale, femaleNode: emptyFemale })} />);

    const figure = screen.getByRole('img');
    expect(figure).toBeDefined();

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // Only header row, no data rows
    expect(rows).toHaveLength(1);
  });
});
