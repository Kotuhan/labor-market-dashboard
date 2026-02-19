import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/config/ConfirmDialog';
import type { ConfirmDialogProps } from '@/components/config/ConfirmDialog';

/**
 * Mock native <dialog> methods -- jsdom does not implement them.
 * showModal() sets the `open` attribute; close() removes it.
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

/** Create default props with optional overrides. */
function makeProps(
  overrides?: Partial<ConfirmDialogProps>,
): ConfirmDialogProps {
  return {
    isOpen: false,
    title: 'Видалити?',
    message: 'Елемент буде видалено.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Rendering
// -------------------------------------------------------
describe('ConfirmDialog rendering', () => {
  it('does not show content when isOpen is false', () => {
    render(<ConfirmDialog {...makeProps()} />);

    const dialog = document.querySelector('dialog');
    expect(dialog).not.toHaveAttribute('open');
  });

  it('shows title and message when isOpen is true', () => {
    render(<ConfirmDialog {...makeProps({ isOpen: true })} />);

    expect(
      screen.getByRole('heading', { name: 'Видалити?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Елемент буде видалено.')).toBeInTheDocument();
  });

  it('shows Cancel and Confirm buttons', () => {
    render(<ConfirmDialog {...makeProps({ isOpen: true })} />);

    expect(
      screen.getByRole('button', { name: 'Скасувати' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Підтвердити' }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Interactions
// -------------------------------------------------------
describe('ConfirmDialog interactions', () => {
  it('calls onConfirm when Confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...makeProps({ isOpen: true, onConfirm })} />);

    await user.click(screen.getByRole('button', { name: 'Підтвердити' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...makeProps({ isOpen: true, onCancel })} />);

    await user.click(screen.getByRole('button', { name: 'Скасувати' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when dialog cancel event fires (Escape key)', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...makeProps({ isOpen: true, onCancel })} />);

    const dialog = document.querySelector('dialog')!;
    fireEvent(dialog, new Event('cancel'));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// -------------------------------------------------------
// Accessibility
// -------------------------------------------------------
describe('ConfirmDialog accessibility', () => {
  it('Confirm and Cancel buttons meet 44px touch target (h-11)', () => {
    render(<ConfirmDialog {...makeProps({ isOpen: true })} />);

    const cancelBtn = screen.getByRole('button', { name: 'Скасувати' });
    const confirmBtn = screen.getByRole('button', { name: 'Підтвердити' });

    expect(cancelBtn.className).toContain('h-11');
    expect(confirmBtn.className).toContain('h-11');
  });

  it('dialog has role="dialog"', () => {
    render(<ConfirmDialog {...makeProps({ isOpen: true })} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
