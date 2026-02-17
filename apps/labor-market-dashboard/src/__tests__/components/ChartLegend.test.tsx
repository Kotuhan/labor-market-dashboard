import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChartLegend } from '@/components/ChartLegend';
import type { ChartLegendProps } from '@/components/ChartLegend';

/** Sample legend items for testing. */
const sampleItems = [
  { label: 'Торгівля', color: '#3B82F6' },
  { label: 'Сільське господарство', color: '#22C55E' },
  { label: 'Промисловість', color: '#EF4444' },
];

/** Create default props for ChartLegend. */
function makeProps(overrides?: Partial<ChartLegendProps>): ChartLegendProps {
  return {
    items: sampleItems,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('ChartLegend', () => {
  it('renders correct number of list items', () => {
    render(<ChartLegend {...makeProps()} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('displays each item label', () => {
    render(<ChartLegend {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
    expect(screen.getByText('Сільське господарство')).toBeInTheDocument();
    expect(screen.getByText('Промисловість')).toBeInTheDocument();
  });

  it('uses semantic list markup (ul/li)', () => {
    render(<ChartLegend {...makeProps()} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('applies maxHeight style to scrollable container', () => {
    const { container } = render(
      <ChartLegend {...makeProps({ maxHeight: 200 })} />,
    );

    const scrollContainer = container.firstElementChild;
    expect(scrollContainer).toHaveStyle({ maxHeight: '200px' });
  });

  it('applies default maxHeight of 300px when not specified', () => {
    const { container } = render(<ChartLegend {...makeProps()} />);

    const scrollContainer = container.firstElementChild;
    expect(scrollContainer).toHaveStyle({ maxHeight: '300px' });
  });
});
