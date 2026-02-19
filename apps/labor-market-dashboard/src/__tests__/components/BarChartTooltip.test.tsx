import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BarChartTooltip } from '@/components/BarChartTooltip';
import type { BarChartTooltipProps } from '@/components/BarChartTooltip';
import { GENDER_COLORS } from '@/data/chartColors';

afterEach(cleanup);

/** Helper: create default props with overrides. */
function makeProps(overrides?: Partial<BarChartTooltipProps>): BarChartTooltipProps {
  return {
    active: true,
    payload: [
      {
        name: 'male',
        value: 1_194_329,
        color: GENDER_COLORS.male,
        payload: {
          industry: 'Торгівля',
          kvedCode: 'G',
          male: 1_194_329,
          female: 1_038_624,
          malePercentage: 16.8,
          femalePercentage: 16.3,
        },
      },
    ],
    label: 'Торгівля',
    ...overrides,
  };
}

describe('BarChartTooltip', () => {
  it('returns null when not active', () => {
    const { container } = render(<BarChartTooltip {...makeProps({ active: false })} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null with empty payload', () => {
    const { container } = render(<BarChartTooltip {...makeProps({ payload: [] })} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders industry name with both gender rows', () => {
    render(<BarChartTooltip {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeDefined();
    expect(screen.getByText('Чоловіки:')).toBeDefined();
    expect(screen.getByText('Жінки:')).toBeDefined();
    // Formatted values
    expect(screen.getByText('1 194 тис.')).toBeDefined();
    expect(screen.getByText('1 039 тис.')).toBeDefined();
    expect(screen.getByText('16.8%')).toBeDefined();
    expect(screen.getByText('16.3%')).toBeDefined();
  });

  it('shows correct color swatches', () => {
    const { container } = render(<BarChartTooltip {...makeProps()} />);

    const swatches = container.querySelectorAll('[aria-hidden="true"]');
    // Two color swatches (male + female)
    expect(swatches).toHaveLength(2);
    expect((swatches[0] as HTMLElement).style.backgroundColor).toContain('rgb(59, 130, 246)');
    expect((swatches[1] as HTMLElement).style.backgroundColor).toContain('rgb(236, 72, 153)');
  });
});
