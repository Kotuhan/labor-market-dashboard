import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResetButton } from '@/components/ResetButton';
import type { ResetButtonProps } from '@/components/ResetButton';
import type { TreeAction } from '@/types';

/** Create default props for the ResetButton component. */
function makeProps(overrides?: Partial<ResetButtonProps>): ResetButtonProps {
  return {
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
describe('ResetButton rendering', () => {
  it('renders the button with "Скинути" text', () => {
    render(<ResetButton {...makeProps()} />);

    expect(screen.getByText('Скинути')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<ResetButton {...makeProps()} />);

    expect(
      screen.getByRole('button', { name: /скинути до початкових значень/i }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Confirm dialog tests
// -------------------------------------------------------
describe('ResetButton confirm dialog', () => {
  it('calls window.confirm on click', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ResetButton {...makeProps()} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.click(button);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('dispatches RESET when user confirms', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ResetButton {...makeProps({ dispatch })} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.click(button);

    expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' });
    expect(dispatch).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('does NOT dispatch when user cancels', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ResetButton {...makeProps({ dispatch })} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.click(button);

    expect(dispatch).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

// -------------------------------------------------------
// Accessibility tests
// -------------------------------------------------------
describe('ResetButton accessibility', () => {
  it('has aria-label "Скинути до початкових значень"', () => {
    render(<ResetButton {...makeProps()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Скинути до початкових значень',
    );
  });

  it('is focusable via keyboard', async () => {
    const user = userEvent.setup();
    render(<ResetButton {...makeProps()} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.tab();

    expect(button).toHaveFocus();
  });

  it('is activatable via keyboard Enter', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ResetButton {...makeProps({ dispatch })} />);

    screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    await user.tab();
    await user.keyboard('{Enter}');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' });
    confirmSpy.mockRestore();
  });

  it('has h-11 class for 44px minimum touch target height', () => {
    render(<ResetButton {...makeProps()} />);

    const button = screen.getByRole('button', {
      name: /скинути до початкових значень/i,
    });
    expect(button.className).toContain('h-11');
  });
});
