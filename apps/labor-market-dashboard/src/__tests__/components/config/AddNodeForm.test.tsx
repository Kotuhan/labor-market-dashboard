import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AddNodeForm } from '@/components/config/AddNodeForm';
import type { AddNodeFormProps } from '@/components/config/AddNodeForm';
import type { TreeAction } from '@/types';

/** Create default props with optional overrides. */
function makeProps(overrides?: Partial<AddNodeFormProps>): AddNodeFormProps {
  return {
    parentId: 'gender-male',
    actionType: 'ADD_INDUSTRY',
    dispatch: vi.fn<(action: TreeAction) => void>(),
    placeholder: 'Назва галузі',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Rendering
// -------------------------------------------------------
describe('AddNodeForm rendering', () => {
  it('renders input with placeholder', () => {
    render(<AddNodeForm {...makeProps()} />);

    expect(screen.getByPlaceholderText('Назва галузі')).toBeInTheDocument();
  });

  it('renders disabled Add button when input is empty', () => {
    render(<AddNodeForm {...makeProps()} />);

    expect(screen.getByRole('button', { name: /Додати/ })).toBeDisabled();
  });

  it('enables Add button when input has text', async () => {
    const user = userEvent.setup();
    render(<AddNodeForm {...makeProps()} />);

    await user.type(screen.getByPlaceholderText('Назва галузі'), 'Тест');

    expect(screen.getByRole('button', { name: /Додати/ })).toBeEnabled();
  });
});

// -------------------------------------------------------
// Submission
// -------------------------------------------------------
describe('AddNodeForm submission', () => {
  it('dispatches ADD_INDUSTRY with correct payload on submit', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<AddNodeForm {...makeProps({ dispatch })} />);

    await user.type(
      screen.getByPlaceholderText('Назва галузі'),
      'Кібербезпека',
    );
    await user.click(screen.getByRole('button', { name: /Додати/ }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_INDUSTRY',
      genderId: 'gender-male',
      label: 'Кібербезпека',
    });
  });

  it('dispatches ADD_SUBCATEGORY with correct payload on submit', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(
      <AddNodeForm
        {...makeProps({
          dispatch,
          parentId: 'male-j',
          actionType: 'ADD_SUBCATEGORY',
          placeholder: 'Назва підкатегорії',
        })}
      />,
    );

    await user.type(
      screen.getByPlaceholderText('Назва підкатегорії'),
      'DevOps',
    );
    await user.click(screen.getByRole('button', { name: /Додати/ }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_SUBCATEGORY',
      industryId: 'male-j',
      label: 'DevOps',
    });
  });

  it('clears input after successful submit', async () => {
    const user = userEvent.setup();
    render(<AddNodeForm {...makeProps()} />);

    const input = screen.getByPlaceholderText('Назва галузі');
    await user.type(input, 'Тест');
    await user.click(screen.getByRole('button', { name: /Додати/ }));

    expect(input).toHaveValue('');
  });

  it('trims whitespace from label before dispatch', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<AddNodeForm {...makeProps({ dispatch })} />);

    await user.type(
      screen.getByPlaceholderText('Назва галузі'),
      '  Тест  ',
    );
    await user.click(screen.getByRole('button', { name: /Додати/ }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_INDUSTRY',
      genderId: 'gender-male',
      label: 'Тест',
    });
  });
});

// -------------------------------------------------------
// Validation
// -------------------------------------------------------
describe('AddNodeForm validation', () => {
  it('does not dispatch when label is only whitespace', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<AddNodeForm {...makeProps({ dispatch })} />);

    const input = screen.getByPlaceholderText('Назва галузі');
    await user.type(input, '   ');

    // Force submit via Enter key
    await user.keyboard('{Enter}');

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('button remains disabled for whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<AddNodeForm {...makeProps()} />);

    await user.type(
      screen.getByPlaceholderText('Назва галузі'),
      '   ',
    );

    expect(screen.getByRole('button', { name: /Додати/ })).toBeDisabled();
  });
});

// -------------------------------------------------------
// Accessibility
// -------------------------------------------------------
describe('AddNodeForm accessibility', () => {
  it('input has aria-label matching placeholder', () => {
    render(<AddNodeForm {...makeProps()} />);

    expect(screen.getByLabelText('Назва галузі')).toBeInTheDocument();
  });

  it('button meets 44px touch target (h-11)', () => {
    render(<AddNodeForm {...makeProps()} />);

    const button = screen.getByRole('button', { name: /Додати/ });
    expect(button.className).toContain('h-11');
  });
});
