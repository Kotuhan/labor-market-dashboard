import type { BalanceMode, TreeAction } from '@/types';

/** Props for the ModeToggle component. */
export interface ModeToggleProps {
  /** Current balance mode */
  balanceMode: BalanceMode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Toggle switch for auto/free balance mode.
 *
 * Controlled component: receives balanceMode and dispatches SET_BALANCE_MODE.
 * Uses role="switch" with aria-checked for screen reader accessibility.
 * Meets WCAG 2.5.5 44x44px minimum touch target.
 */
export function ModeToggle({ balanceMode, dispatch }: ModeToggleProps) {
  const isAuto = balanceMode === 'auto';

  function handleToggle() {
    dispatch({
      type: 'SET_BALANCE_MODE',
      mode: isAuto ? 'free' : 'auto',
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isAuto}
      aria-label="Balance mode"
      onClick={handleToggle}
      className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm transition-colors hover:bg-slate-50"
    >
      <span
        className={`font-medium ${isAuto ? 'text-blue-600' : 'text-slate-400'}`}
      >
        Авто
      </span>
      <div
        className="relative h-5 w-9 rounded-full bg-slate-200"
        aria-hidden="true"
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            isAuto ? 'translate-x-0.5' : 'translate-x-[1.125rem]'
          }`}
        />
      </div>
      <span
        className={`font-medium ${!isAuto ? 'text-blue-600' : 'text-slate-400'}`}
      >
        Вільний
      </span>
    </button>
  );
}
