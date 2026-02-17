import { useEffect, useState } from 'react';

import type { BalanceMode, TreeAction } from '@/types';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

/** Props for the Slider component. */
export interface SliderProps {
  /** Unique ID of the tree node this slider controls */
  nodeId: string;
  /** Display label (Ukrainian text, e.g., "Торгівля") */
  label: string;
  /** Current percentage value (0-100, 1 decimal place) */
  percentage: number;
  /** Computed absolute value for display */
  absoluteValue: number;
  /** Whether this node is locked */
  isLocked: boolean;
  /** Whether the lock toggle can be activated (canToggleLock result) */
  canLock: boolean;
  /** Current balance mode (passed for potential future use, not used in v1 logic) */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Interactive slider for controlling a tree node's percentage value.
 *
 * Combines a native range input, a numeric text input for precise entry,
 * a lock toggle button, and value displays (percentage + abbreviated absolute).
 *
 * Controlled component: percentage is always driven by props.
 * Local state exists only for the numeric input (to allow partial typing).
 */
export function Slider({
  nodeId,
  label,
  percentage,
  absoluteValue,
  isLocked,
  canLock,
  balanceMode: _balanceMode,
  dispatch,
}: SliderProps) {
  const [inputValue, setInputValue] = useState(percentage.toFixed(1));
  const [isEditing, setIsEditing] = useState(false);

  // Sync inputValue from props when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setInputValue(percentage.toFixed(1));
    }
  }, [percentage, isEditing]);

  /** Handle range slider drag. Dispatches on every change for real-time feedback. */
  function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    dispatch({ type: 'SET_PERCENTAGE', nodeId, value });
  }

  /** Handle numeric input change (just updates local state, no dispatch). */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  /** Handle numeric input focus (mark editing to prevent prop sync). */
  function handleInputFocus() {
    setIsEditing(true);
  }

  /** Commit numeric input: parse, clamp, dispatch, and exit editing mode. */
  function commitInput() {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);

    if (isNaN(parsed)) {
      // Revert to current prop value
      setInputValue(percentage.toFixed(1));
      return;
    }

    // Clamp to [0, 100] and round to 1 decimal
    const clamped = Math.max(0, Math.min(parsed, 100));
    const rounded = Math.round(clamped * 10) / 10;

    dispatch({ type: 'SET_PERCENTAGE', nodeId, value: rounded });
    setInputValue(rounded.toFixed(1));
  }

  /** Handle Enter key on numeric input. */
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }

  /** Handle lock toggle click. */
  function handleLockToggle() {
    dispatch({ type: 'TOGGLE_LOCK', nodeId });
  }

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border border-slate-200 px-4 py-3 ${
        isLocked ? 'opacity-50' : ''
      }`}
    >
      {/* Top row: label, percentage, absolute value */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {formatPercentage(percentage)}
          </span>
          <span className="text-xs text-slate-500">
            {formatAbsoluteValue(absoluteValue)}
          </span>
        </div>
      </div>

      {/* Bottom row: range slider, numeric input, lock toggle */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(percentage)}
          disabled={isLocked}
          onChange={handleRangeChange}
          aria-label={label}
          aria-valuetext={formatPercentage(percentage)}
          className="min-w-0 flex-1"
        />

        <input
          type="text"
          inputMode="decimal"
          value={isEditing ? inputValue : percentage.toFixed(1)}
          readOnly={isLocked}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={commitInput}
          onKeyDown={handleInputKeyDown}
          aria-label={`${label} percentage`}
          className={`w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm ${
            isLocked
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-white text-slate-900'
          }`}
        />

        <button
          type="button"
          onClick={handleLockToggle}
          disabled={!canLock && !isLocked}
          aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors ${
            !canLock && !isLocked
              ? 'cursor-not-allowed text-slate-300'
              : isLocked
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
        >
          {isLocked ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 00-7.5 0v3h1.5a3 3 0 013 3v6.75a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-6.75a3 3 0 013-3h8.25v-3c0-2.9 2.35-5.25 5.25-5.25z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
