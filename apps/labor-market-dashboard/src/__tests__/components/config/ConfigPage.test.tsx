import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ConfigPage } from '@/components/config/ConfigPage';
import type { ConfigPageProps } from '@/components/config/ConfigPage';
import type { DashboardState, TreeAction } from '@/types';

/**
 * Mock native <dialog> methods -- jsdom does not implement them.
 * ConfigGenderSection renders ConfirmDialog which uses <dialog>.
 */
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.removeAttribute('open');
  });
});

/** Create a minimal test state for ConfigPage. */
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
function makeProps(overrides?: Partial<ConfigPageProps>): ConfigPageProps {
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
describe('ConfigPage rendering', () => {
  it('renders page title as h1', () => {
    render(<ConfigPage {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Налаштування', level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders male gender section', () => {
    render(<ConfigPage {...makeProps()} />);

    expect(
      screen.getByRole('region', { name: 'Чоловіки' }),
    ).toBeInTheDocument();
  });

  it('renders female gender section', () => {
    render(<ConfigPage {...makeProps()} />);

    expect(
      screen.getByRole('region', { name: 'Жінки' }),
    ).toBeInTheDocument();
  });

  it('renders both gender headings at h2 level', () => {
    render(<ConfigPage {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Чоловіки', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Жінки', level: 2 }),
    ).toBeInTheDocument();
  });
});
