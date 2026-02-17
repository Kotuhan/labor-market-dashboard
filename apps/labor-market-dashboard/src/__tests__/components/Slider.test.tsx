import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Slider } from '@/components/Slider';
import type { SliderProps } from '@/components/Slider';
import type { TreeAction } from '@/types';

/** Create default props for the Slider component. */
function makeProps(
  overrides?: Partial<SliderProps>,
): SliderProps {
  return {
    nodeId: 'test-node',
    label: 'Торгівля',
    percentage: 30.0,
    absoluteValue: 2_133_000,
    isLocked: false,
    canLock: true,
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
describe('Slider rendering', () => {
  it('displays the node label', () => {
    render(<Slider {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
  });

  it('displays formatted percentage', () => {
    render(<Slider {...makeProps({ percentage: 18.5 })} />);

    expect(screen.getByText('18.5%')).toBeInTheDocument();
  });

  it('displays formatted absolute value with "тис." abbreviation', () => {
    render(<Slider {...makeProps({ absoluteValue: 2_133_000 })} />);

    expect(screen.getByText('2 133 тис.')).toBeInTheDocument();
  });

  it('displays absolute value without abbreviation when below 1000', () => {
    render(<Slider {...makeProps({ absoluteValue: 500 })} />);

    expect(screen.getByText('500')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Range input tests
// -------------------------------------------------------
describe('Slider range input', () => {
  it('dispatches SET_PERCENTAGE on range change', () => {
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const range = screen.getByRole('slider');
    fireEvent.change(range, { target: { value: '50' } });

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-node',
      value: 50,
    });
  });

  it('has aria-label matching node label', () => {
    render(<Slider {...makeProps()} />);

    const range = screen.getByRole('slider');
    expect(range).toHaveAttribute('aria-label', 'Торгівля');
  });

  it('has aria-valuetext with formatted percentage', () => {
    render(<Slider {...makeProps({ percentage: 30.0 })} />);

    const range = screen.getByRole('slider');
    expect(range).toHaveAttribute('aria-valuetext', '30.0%');
  });

  it('is disabled when node is locked', () => {
    render(<Slider {...makeProps({ isLocked: true })} />);

    const range = screen.getByRole('slider');
    expect(range).toBeDisabled();
  });
});

// -------------------------------------------------------
// Numeric input tests
// -------------------------------------------------------
describe('Slider numeric input', () => {
  it('dispatches SET_PERCENTAGE on blur with valid value', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, '45.5');
    await user.tab(); // trigger blur

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-node',
      value: 45.5,
    });
  });

  it('dispatches SET_PERCENTAGE on Enter key', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, '55.0');
    await user.keyboard('{Enter}');

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_PERCENTAGE',
        nodeId: 'test-node',
        value: 55.0,
      }),
    );
  });

  it('clamps value above 100 to 100', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, '150');
    await user.tab();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-node',
      value: 100,
    });
  });

  it('clamps negative value to 0', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, '-5');
    await user.tab();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PERCENTAGE',
      nodeId: 'test-node',
      value: 0,
    });
  });

  it('reverts to prop value when NaN is entered', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<Slider {...makeProps({ percentage: 30.0, dispatch })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();

    // NaN should not dispatch SET_PERCENTAGE
    expect(dispatch).not.toHaveBeenCalled();
    // Input reverts to prop value
    expect(input).toHaveValue('30.0');
  });

  it('is readOnly when node is locked', () => {
    render(<Slider {...makeProps({ isLocked: true })} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    expect(input).toHaveAttribute('readonly');
  });
});

// -------------------------------------------------------
// Lock toggle tests
// -------------------------------------------------------
describe('Slider lock toggle', () => {
  it('dispatches TOGGLE_LOCK on click when unlocked', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<Slider {...makeProps({ dispatch })} />);

    const lockBtn = screen.getByRole('button', { name: /lock торгівля/i });
    await user.click(lockBtn);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_LOCK',
      nodeId: 'test-node',
    });
  });

  it('dispatches TOGGLE_LOCK on click when locked', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<Slider {...makeProps({ isLocked: true, dispatch })} />);

    const unlockBtn = screen.getByRole('button', { name: /unlock торгівля/i });
    await user.click(unlockBtn);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_LOCK',
      nodeId: 'test-node',
    });
  });

  it('is disabled when canLock is false and node is unlocked', () => {
    render(<Slider {...makeProps({ canLock: false })} />);

    const lockBtn = screen.getByRole('button', { name: /lock торгівля/i });
    expect(lockBtn).toBeDisabled();
  });

  it('is enabled when canLock is false but node is locked (unlock is always allowed)', () => {
    render(<Slider {...makeProps({ canLock: false, isLocked: true })} />);

    const unlockBtn = screen.getByRole('button', { name: /unlock торгівля/i });
    expect(unlockBtn).not.toBeDisabled();
  });

  it('shows closed lock icon when locked', () => {
    render(<Slider {...makeProps({ isLocked: true })} />);

    // The unlock button should be present (accessible name changes)
    expect(
      screen.getByRole('button', { name: /unlock торгівля/i }),
    ).toBeInTheDocument();
  });

  it('shows open lock icon when unlocked', () => {
    render(<Slider {...makeProps({ isLocked: false })} />);

    expect(
      screen.getByRole('button', { name: /lock торгівля/i }),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Locked state visual tests
// -------------------------------------------------------
describe('Slider locked state', () => {
  it('applies dimmed opacity when locked', () => {
    const { container } = render(<Slider {...makeProps({ isLocked: true })} />);

    // The outermost div should have opacity-50 class
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('opacity-50');
  });
});

// -------------------------------------------------------
// Prop sync tests
// -------------------------------------------------------
describe('Slider prop sync', () => {
  it('updates input value when percentage prop changes and not editing', () => {
    const props = makeProps({ percentage: 30.0 });
    const { rerender } = render(<Slider {...props} />);

    const input = screen.getByRole('textbox', { name: /percentage/i });
    expect(input).toHaveValue('30.0');

    // Simulate parent re-render with new percentage (e.g., sibling auto-balance)
    rerender(<Slider {...makeProps({ percentage: 45.5 })} />);

    expect(input).toHaveValue('45.5');
  });
});
