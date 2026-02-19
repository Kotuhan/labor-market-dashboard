import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from '@/components/DashboardPage';
import type { DashboardPageProps } from '@/components/DashboardPage';
import type { DashboardState, TreeAction } from '@/types';

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

/** Create a minimal test tree for DashboardPage. */
function makeTestState(): DashboardState {
  return {
    totalPopulation: 10_000_000,
    balanceMode: 'auto',
    tree: {
      id: 'root',
      label: 'Total',
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
              percentage: 100,
              defaultPercentage: 100,
              absoluteValue: 6_000_000,
              genderSplit: { male: 100, female: 0 },
              isLocked: false,
              children: [],
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
              label: 'Торгівля',
              kvedCode: 'G',
              percentage: 100,
              defaultPercentage: 100,
              absoluteValue: 4_000_000,
              genderSplit: { male: 0, female: 100 },
              isLocked: false,
              children: [],
            },
          ],
        },
      ],
    },
  };
}

/** Create default props with optional overrides. */
function makeProps(
  overrides?: Partial<DashboardPageProps>,
): DashboardPageProps {
  return {
    state: makeTestState(),
    dispatch: vi.fn<(action: TreeAction) => void>(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Rendering
// -------------------------------------------------------
describe('DashboardPage rendering', () => {
  it('renders the dashboard header with h1 title', () => {
    render(<DashboardPage {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Зайняте населення', level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the population input', () => {
    render(<DashboardPage {...makeProps()} />);

    expect(
      screen.getByLabelText('Загальна кількість зайнятих'),
    ).toBeInTheDocument();
  });

  it('renders male gender section', () => {
    render(<DashboardPage {...makeProps()} />);

    expect(
      screen.getByRole('region', { name: 'Чоловіки' }),
    ).toBeInTheDocument();
  });

  it('renders female gender section', () => {
    render(<DashboardPage {...makeProps()} />);

    expect(
      screen.getByRole('region', { name: 'Жінки' }),
    ).toBeInTheDocument();
  });

  it('renders both gender headings at h2 level', () => {
    render(<DashboardPage {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Чоловіки', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Жінки', level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders pie charts for both genders', () => {
    render(<DashboardPage {...makeProps()} />);

    expect(
      screen.getByRole('img', { name: /Розподіл галузей -- Чоловіки/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Розподіл галузей -- Жінки/ }),
    ).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(<DashboardPage {...makeProps()} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
