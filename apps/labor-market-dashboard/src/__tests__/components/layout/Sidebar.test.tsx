import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

import { Sidebar } from '@/components/layout/Sidebar';
import type { SidebarProps } from '@/components/layout/Sidebar';

/** Create default props with optional overrides. */
function makeProps(overrides?: Partial<SidebarProps>): SidebarProps {
  return {
    isOpen: true,
    onToggle: vi.fn(),
    ...overrides,
  };
}

/** Render Sidebar within a wouter Router using memoryLocation. */
function renderSidebar(
  props: SidebarProps,
  options?: { path?: string },
) {
  const { hook } = memoryLocation({ path: options?.path ?? '/' });
  return render(
    <Router hook={hook}>
      <Sidebar {...props} />
    </Router>,
  );
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Rendering
// -------------------------------------------------------
describe('Sidebar rendering', () => {
  it('renders nav landmark with aria-label', () => {
    renderSidebar(makeProps());

    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument();
  });

  it('renders toggle button with aria-label', () => {
    renderSidebar(makeProps());

    expect(
      screen.getByRole('button', { name: 'Toggle navigation' }),
    ).toBeInTheDocument();
  });

  it('renders Dashboard link', () => {
    renderSidebar(makeProps());

    const link = screen.getByRole('link', { name: /Dashboard/i });
    expect(link).toBeInTheDocument();
  });

  it('renders Configuration link', () => {
    renderSidebar(makeProps());

    const link = screen.getByRole('link', { name: /Configuration/i });
    expect(link).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Active state
// -------------------------------------------------------
describe('Sidebar active state', () => {
  it('marks Dashboard as active on root path', () => {
    renderSidebar(makeProps(), { path: '/' });

    const link = screen.getByRole('link', { name: /Dashboard/i });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('marks Configuration as active on /config path', () => {
    renderSidebar(makeProps(), { path: '/config' });

    const link = screen.getByRole('link', { name: /Configuration/i });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark Dashboard as active on /config', () => {
    renderSidebar(makeProps(), { path: '/config' });

    const link = screen.getByRole('link', { name: /Dashboard/i });
    expect(link).not.toHaveAttribute('aria-current');
  });
});

// -------------------------------------------------------
// Toggle
// -------------------------------------------------------
describe('Sidebar toggle', () => {
  it('shows link text when open', () => {
    renderSidebar(makeProps({ isOpen: true }));

    const dashboardText = screen.getByText('Dashboard');
    expect(dashboardText).not.toHaveClass('hidden');
  });

  it('hides link text when collapsed', () => {
    renderSidebar(makeProps({ isOpen: false }));

    const dashboardText = screen.getByText('Dashboard');
    expect(dashboardText).toHaveClass('hidden');
  });

  it('calls onToggle when toggle button is clicked', async () => {
    const onToggle = vi.fn();
    renderSidebar(makeProps({ onToggle }));

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Toggle navigation' }));

    expect(onToggle).toHaveBeenCalledOnce();
  });
});

// -------------------------------------------------------
// Keyboard navigation
// -------------------------------------------------------
describe('Sidebar keyboard navigation', () => {
  it('all links are reachable via Tab', async () => {
    renderSidebar(makeProps());

    const user = userEvent.setup();

    // First Tab -> toggle button
    await user.tab();
    expect(
      screen.getByRole('button', { name: 'Toggle navigation' }),
    ).toHaveFocus();

    // Second Tab -> Dashboard link
    await user.tab();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveFocus();

    // Third Tab -> Configuration link
    await user.tab();
    expect(
      screen.getByRole('link', { name: /Configuration/i }),
    ).toHaveFocus();
  });
});

// -------------------------------------------------------
// Toggle accessibility
// -------------------------------------------------------
describe('Sidebar toggle accessibility', () => {
  it('toggle button has aria-expanded=true when open', () => {
    renderSidebar(makeProps({ isOpen: true }));

    expect(
      screen.getByRole('button', { name: 'Toggle navigation' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggle button has aria-expanded=false when collapsed', () => {
    renderSidebar(makeProps({ isOpen: false }));

    expect(
      screen.getByRole('button', { name: 'Toggle navigation' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });
});
