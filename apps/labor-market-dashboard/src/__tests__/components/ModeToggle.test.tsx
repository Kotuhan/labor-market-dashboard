import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ModeToggle } from '@/components/ModeToggle';
import type { ModeToggleProps } from '@/components/ModeToggle';
import type { TreeAction } from '@/types';

/** Create default props for the ModeToggle component. */
function makeProps(overrides?: Partial<ModeToggleProps>): ModeToggleProps {
  return {
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
describe('ModeToggle rendering', () => {
  it('renders both mode labels', () => {
    render(<ModeToggle {...makeProps()} />);

    expect(screen.getByText('Авто')).toBeInTheDocument();
    expect(screen.getByText('Вільний')).toBeInTheDocument();
  });

  it('highlights "Авто" label when in auto mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'auto' })} />);

    const autoLabel = screen.getByText('Авто');
    expect(autoLabel.className).toContain('text-blue-600');
  });

  it('highlights "Вільний" label when in free mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'free' })} />);

    const freeLabel = screen.getByText('Вільний');
    expect(freeLabel.className).toContain('text-blue-600');
  });

  it('dims inactive label in auto mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'auto' })} />);

    const freeLabel = screen.getByText('Вільний');
    expect(freeLabel.className).toContain('text-slate-400');
  });

  it('dims inactive label in free mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'free' })} />);

    const autoLabel = screen.getByText('Авто');
    expect(autoLabel.className).toContain('text-slate-400');
  });
});

// -------------------------------------------------------
// Interaction tests
// -------------------------------------------------------
describe('ModeToggle interaction', () => {
  it('dispatches SET_BALANCE_MODE with "free" when in auto mode', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ModeToggle {...makeProps({ balanceMode: 'auto', dispatch })} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_BALANCE_MODE',
      mode: 'free',
    });
  });

  it('dispatches SET_BALANCE_MODE with "auto" when in free mode', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ModeToggle {...makeProps({ balanceMode: 'free', dispatch })} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_BALANCE_MODE',
      mode: 'auto',
    });
  });

  it('dispatches exactly once per click', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ModeToggle {...makeProps({ dispatch })} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

// -------------------------------------------------------
// Accessibility tests
// -------------------------------------------------------
describe('ModeToggle accessibility', () => {
  it('has role="switch"', () => {
    render(<ModeToggle {...makeProps()} />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('has aria-checked="true" when in auto mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'auto' })} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('has aria-checked="false" when in free mode', () => {
    render(<ModeToggle {...makeProps({ balanceMode: 'free' })} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('has accessible name "Balance mode"', () => {
    render(<ModeToggle {...makeProps()} />);

    expect(
      screen.getByRole('switch', { name: 'Balance mode' }),
    ).toBeInTheDocument();
  });

  it('has h-11 class for 44px minimum touch target height', () => {
    render(<ModeToggle {...makeProps()} />);

    const toggle = screen.getByRole('switch');
    expect(toggle.className).toContain('h-11');
  });
});
