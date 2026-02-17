import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardHeader } from '@/components/DashboardHeader';
import type { DashboardHeaderProps } from '@/components/DashboardHeader';
import type { TreeAction } from '@/types';

/** Create default props for the DashboardHeader component. */
function makeProps(
  overrides?: Partial<DashboardHeaderProps>,
): DashboardHeaderProps {
  return {
    totalPopulation: 13_500_000,
    balanceMode: 'auto',
    dispatch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Rendering tests
// -------------------------------------------------------
describe('DashboardHeader rendering', () => {
  it('renders application title as h1', () => {
    render(<DashboardHeader {...makeProps()} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Зайняте населення');
  });

  it('renders population input with formatted default value', () => {
    render(<DashboardHeader {...makeProps()} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    expect(input).toHaveValue('13 500 000');
  });

  it('renders ModeToggle', () => {
    render(<DashboardHeader {...makeProps()} />);

    expect(screen.getByRole('switch', { name: 'Balance mode' })).toBeInTheDocument();
  });

  it('renders ResetButton', () => {
    render(<DashboardHeader {...makeProps()} />);

    expect(
      screen.getByRole('button', { name: /скинути до початкових значень/i }),
    ).toBeInTheDocument();
  });

  it('renders as a header element', () => {
    render(<DashboardHeader {...makeProps()} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Population input -- valid input tests
// -------------------------------------------------------
describe('DashboardHeader population input -- valid input', () => {
  it('dispatches SET_TOTAL_POPULATION on valid input blur', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<DashboardHeader {...makeProps({ dispatch })} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '10000000');
    await user.tab(); // triggers blur

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_TOTAL_POPULATION',
      value: 10_000_000,
    });
  });

  it('dispatches SET_TOTAL_POPULATION on Enter key', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<DashboardHeader {...makeProps({ dispatch })} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '5000000');
    await user.keyboard('{Enter}');

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_TOTAL_POPULATION',
      value: 5_000_000,
    });
  });

  it('accepts space-separated input (strips spaces before parsing)', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<DashboardHeader {...makeProps({ dispatch })} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '10 000 000');
    await user.tab();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_TOTAL_POPULATION',
      value: 10_000_000,
    });
  });

  it('dispatches exactly once per commit', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<DashboardHeader {...makeProps({ dispatch })} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '5000000');
    await user.keyboard('{Enter}');

    // Filter SET_TOTAL_POPULATION actions only (Enter triggers blur,
    // commitInput runs once via onBlur)
    const populationActions = dispatch.mock.calls.filter(
      (call) => call[0].type === 'SET_TOTAL_POPULATION',
    );
    expect(populationActions).toHaveLength(1);
  });
});

// -------------------------------------------------------
// Population input -- invalid input tests
// -------------------------------------------------------
describe('DashboardHeader population input -- invalid input', () => {
  it('reverts on non-numeric input', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(
      <DashboardHeader {...makeProps({ totalPopulation: 13_500_000, dispatch })} />,
    );

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();

    // Should NOT dispatch SET_TOTAL_POPULATION
    const populationActions = dispatch.mock.calls.filter(
      (call) => call[0].type === 'SET_TOTAL_POPULATION',
    );
    expect(populationActions).toHaveLength(0);

    // Input should revert to formatted prop value
    expect(input).toHaveValue('13 500 000');
  });

  it('reverts on negative input', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(
      <DashboardHeader {...makeProps({ totalPopulation: 13_500_000, dispatch })} />,
    );

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.type(input, '-100');
    await user.tab();

    const populationActions = dispatch.mock.calls.filter(
      (call) => call[0].type === 'SET_TOTAL_POPULATION',
    );
    expect(populationActions).toHaveLength(0);

    expect(input).toHaveValue('13 500 000');
  });

  it('reverts on empty input', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(
      <DashboardHeader {...makeProps({ totalPopulation: 13_500_000, dispatch })} />,
    );

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    await user.clear(input);
    await user.tab();

    const populationActions = dispatch.mock.calls.filter(
      (call) => call[0].type === 'SET_TOTAL_POPULATION',
    );
    expect(populationActions).toHaveLength(0);

    expect(input).toHaveValue('13 500 000');
  });
});

// -------------------------------------------------------
// Population input -- prop sync tests
// -------------------------------------------------------
describe('DashboardHeader population input -- prop sync', () => {
  it('updates displayed value when totalPopulation prop changes', () => {
    const { rerender } = render(
      <DashboardHeader {...makeProps({ totalPopulation: 13_500_000 })} />,
    );

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    expect(input).toHaveValue('13 500 000');

    rerender(
      <DashboardHeader {...makeProps({ totalPopulation: 10_000_000 })} />,
    );

    expect(input).toHaveValue('10 000 000');
  });
});

// -------------------------------------------------------
// Accessibility tests
// -------------------------------------------------------
describe('DashboardHeader accessibility', () => {
  it('population input has aria-label', () => {
    render(<DashboardHeader {...makeProps()} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    expect(input).toBeInTheDocument();
  });

  it('population input has h-11 class for 44px touch target', () => {
    render(<DashboardHeader {...makeProps()} />);

    const input = screen.getByLabelText('Загальна кількість зайнятих');
    expect(input.className).toContain('h-11');
  });

  it('title is the first heading on the page', () => {
    render(<DashboardHeader {...makeProps()} />);

    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveTextContent('Зайняте населення');
    expect(headings[0].tagName).toBe('H1');
  });
});
