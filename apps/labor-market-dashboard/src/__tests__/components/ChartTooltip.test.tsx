import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChartTooltip } from '@/components/ChartTooltip';
import type { ChartTooltipProps } from '@/components/ChartTooltip';

/** Create default props for ChartTooltip. */
function makeProps(overrides?: Partial<ChartTooltipProps>): ChartTooltipProps {
  return {
    active: true,
    payload: [
      {
        name: 'Торгівля',
        value: 16.8,
        payload: {
          name: 'Торгівля',
          value: 16.8,
          absoluteValue: 1_194_329,
          color: '#3B82F6',
        },
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('ChartTooltip', () => {
  it('renders label, percentage, and absolute value when active', () => {
    render(<ChartTooltip {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
    expect(screen.getByText('16.8%')).toBeInTheDocument();
    expect(screen.getByText('1 194 тис.')).toBeInTheDocument();
  });

  it('returns null when not active', () => {
    const { container } = render(
      <ChartTooltip {...makeProps({ active: false })} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when payload is empty', () => {
    const { container } = render(
      <ChartTooltip {...makeProps({ payload: [] })} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when payload is undefined', () => {
    const { container } = render(
      <ChartTooltip {...makeProps({ payload: undefined })} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('hides absolute value for ghost slice entries', () => {
    const ghostProps = makeProps({
      payload: [
        {
          name: 'Нерозподілено',
          value: 10.0,
          payload: {
            name: 'Нерозподілено',
            value: 10.0,
            absoluteValue: 0,
            color: '#E2E8F0',
            isGhost: true,
          },
        },
      ],
    });
    render(<ChartTooltip {...ghostProps} />);

    expect(screen.getByText('Нерозподілено')).toBeInTheDocument();
    expect(screen.getByText('10.0%')).toBeInTheDocument();
    // Absolute value should not be rendered for ghost slices
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
