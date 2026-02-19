import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ConfigGenderSection } from '@/components/config/ConfigGenderSection';
import type { ConfigGenderSectionProps } from '@/components/config/ConfigGenderSection';
import type { TreeAction, TreeNode } from '@/types';

/**
 * Mock native <dialog> methods -- jsdom does not implement them.
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

/** Create a test gender node with two industries, one having a subcategory. */
function makeGenderNode(): TreeNode {
  return {
    id: 'gender-male',
    label: 'Чоловіки',
    percentage: 50,
    defaultPercentage: 50,
    absoluteValue: 5_000_000,
    genderSplit: { male: 100, female: 0 },
    isLocked: false,
    children: [
      {
        id: 'male-a',
        label: 'Сільське господарство',
        kvedCode: 'A',
        percentage: 60,
        defaultPercentage: 60,
        absoluteValue: 3_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [],
      },
      {
        id: 'male-j',
        label: 'IT та телеком',
        kvedCode: 'J',
        percentage: 40,
        defaultPercentage: 40,
        absoluteValue: 2_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [
          {
            id: 'male-j-dev',
            label: 'Розробка ПЗ',
            percentage: 100,
            defaultPercentage: 100,
            absoluteValue: 2_000_000,
            genderSplit: { male: 100, female: 0 },
            isLocked: false,
            children: [],
          },
        ],
      },
    ],
  };
}

/** Create default props with optional overrides. */
function makeProps(
  overrides?: Partial<ConfigGenderSectionProps>,
): ConfigGenderSectionProps {
  return {
    genderNode: makeGenderNode(),
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
describe('ConfigGenderSection rendering', () => {
  it('renders gender heading as h2', () => {
    render(<ConfigGenderSection {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Чоловіки', level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders section with aria-label matching gender label', () => {
    render(<ConfigGenderSection {...makeProps()} />);

    expect(
      screen.getByRole('region', { name: 'Чоловіки' }),
    ).toBeInTheDocument();
  });

  it('renders an industry row for each child', () => {
    render(<ConfigGenderSection {...makeProps()} />);

    expect(screen.getByText('Сільське господарство')).toBeInTheDocument();
    expect(screen.getByText('IT та телеком')).toBeInTheDocument();
  });

  it('renders "Add industry" form', () => {
    render(<ConfigGenderSection {...makeProps()} />);

    expect(
      screen.getByPlaceholderText('Назва галузі'),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Add industry
// -------------------------------------------------------
describe('ConfigGenderSection add industry', () => {
  it('dispatches ADD_INDUSTRY when form is submitted', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ConfigGenderSection {...makeProps({ dispatch })} />);

    const industryInput = screen.getByPlaceholderText('Назва галузі');
    await user.type(industryInput, 'Кібербезпека');
    // Scope to the industry form (parent of the input) to avoid matching
    // the subcategory AddNodeForm button in the auto-expanded IT section.
    const industryForm = industryInput.closest('form')!;
    await user.click(within(industryForm).getByRole('button', { name: /Додати/ }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_INDUSTRY',
      genderId: 'gender-male',
      label: 'Кібербезпека',
    });
  });
});

// -------------------------------------------------------
// Remove flow
// -------------------------------------------------------
describe('ConfigGenderSection remove flow', () => {
  it('shows confirmation dialog when remove is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfigGenderSection {...makeProps()} />);

    const removeButtons = screen.getAllByLabelText(/^Видалити /);
    // Click remove on the first industry (Сільське господарство)
    await user.click(removeButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/Сільське господарство.*буде видалено/),
    ).toBeInTheDocument();
  });

  it('dispatches REMOVE_INDUSTRY on confirm', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ConfigGenderSection {...makeProps({ dispatch })} />);

    const removeButtons = screen.getAllByLabelText(/^Видалити /);
    await user.click(removeButtons[0]);

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Підтвердити' }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_INDUSTRY',
      nodeId: 'male-a',
    });
  });

  it('closes dialog without dispatch on cancel', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: TreeAction) => void>();
    render(<ConfigGenderSection {...makeProps({ dispatch })} />);

    const removeButtons = screen.getAllByLabelText(/^Видалити /);
    await user.click(removeButtons[0]);

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Скасувати' }));

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('shows warning about subcategories when industry has children', async () => {
    const user = userEvent.setup();
    render(<ConfigGenderSection {...makeProps()} />);

    // IT та телеком has children -- click its remove button directly
    await user.click(
      screen.getByLabelText('Видалити IT та телеком'),
    );

    expect(
      screen.getByText(/та всі підкатегорії будуть видалені/),
    ).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Remove blocked
// -------------------------------------------------------
describe('ConfigGenderSection remove blocked', () => {
  it('remove button is disabled when only one industry remains', () => {
    const singleIndustryNode: TreeNode = {
      ...makeGenderNode(),
      children: [makeGenderNode().children[0]],
    };
    render(
      <ConfigGenderSection
        {...makeProps({ genderNode: singleIndustryNode })}
      />,
    );

    const removeButton = screen.getByLabelText(
      'Видалити Сільське господарство',
    );
    expect(removeButton).toBeDisabled();
  });
});

// -------------------------------------------------------
// Expand/collapse
// -------------------------------------------------------
describe('ConfigGenderSection expand/collapse', () => {
  it('auto-expands industry with subcategories and shows them', () => {
    render(<ConfigGenderSection {...makeProps()} />);

    // IT та телеком has children and should be auto-expanded
    expect(screen.getByText('Розробка ПЗ')).toBeInTheDocument();
  });

  it('collapses industry on chevron click and hides subcategories', async () => {
    const user = userEvent.setup();
    render(<ConfigGenderSection {...makeProps()} />);

    // IT та телеком should be auto-expanded -- find its collapse chevron
    const collapseBtn = screen.getByLabelText('Згорнути IT та телеком');
    await user.click(collapseBtn);

    expect(screen.queryByText('Розробка ПЗ')).not.toBeInTheDocument();
  });

  it('shows add subcategory form when industry is expanded', () => {
    render(<ConfigGenderSection {...makeProps()} />);

    // IT та телеком is auto-expanded
    expect(
      screen.getByPlaceholderText('Назва підкатегорії'),
    ).toBeInTheDocument();
  });
});
