import { useEffect, useState } from 'react';

import type { BalanceMode, TreeAction } from '@/types';
import { formatPopulation } from '@/utils/format';

import { ModeToggle } from './ModeToggle';
import { ResetButton } from './ResetButton';

/** Props for the DashboardHeader component. */
export interface DashboardHeaderProps {
  /** Total employed population (e.g., 13_500_000) */
  totalPopulation: number;
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Dashboard header bar composing application title, total population input,
 * ModeToggle, and ResetButton.
 *
 * The application title is rendered as <h1> to maintain WCAG 1.3.1 heading
 * hierarchy (arch-review condition 1).
 *
 * Population input follows the Slider controlled input pattern:
 * local string state, useEffect sync from props, commit on blur/Enter.
 *
 * All interactive elements meet WCAG 2.5.5 44x44px minimum touch target.
 */
export function DashboardHeader({
  totalPopulation,
  balanceMode,
  dispatch,
}: DashboardHeaderProps) {
  const [inputValue, setInputValue] = useState(
    formatPopulation(totalPopulation),
  );
  const [isEditing, setIsEditing] = useState(false);

  // Sync inputValue from props when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatPopulation(totalPopulation));
    }
  }, [totalPopulation, isEditing]);

  /** Handle input change (just updates local state, no dispatch). */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  /** Handle input focus (mark editing to prevent prop sync). */
  function handleInputFocus() {
    setIsEditing(true);
  }

  /** Commit population input: parse, validate, dispatch or revert. */
  function commitInput() {
    setIsEditing(false);

    // Strip spaces and parse as integer
    const stripped = inputValue.replace(/\s/g, '');
    const parsed = parseInt(stripped, 10);

    if (isNaN(parsed) || parsed < 0) {
      // Revert to current prop value
      setInputValue(formatPopulation(totalPopulation));
      return;
    }

    dispatch({ type: 'SET_TOTAL_POPULATION', value: parsed });
    setInputValue(formatPopulation(parsed));
  }

  /** Handle Enter key on input. */
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900">
            Зайняте населення
          </h1>
          <input
            type="text"
            inputMode="numeric"
            value={isEditing ? inputValue : formatPopulation(totalPopulation)}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={commitInput}
            onKeyDown={handleInputKeyDown}
            aria-label="Загальна кількість зайнятих"
            className="h-11 w-40 rounded-lg border border-slate-300 px-3 text-center text-sm font-medium text-slate-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle balanceMode={balanceMode} dispatch={dispatch} />
          <ResetButton dispatch={dispatch} />
        </div>
      </div>
    </header>
  );
}
