import type { TreeAction } from '@/types';

/** Props for the ResetButton component. */
export interface ResetButtonProps {
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Reset button with browser confirm() dialog guard.
 *
 * On click, prompts the user with a confirmation dialog.
 * If confirmed, dispatches RESET action. If cancelled, no-op.
 * Meets WCAG 2.5.5 44x44px minimum touch target.
 */
export function ResetButton({ dispatch }: ResetButtonProps) {
  function handleReset() {
    const confirmed = window.confirm(
      'Скинути всі значення до початкових? Ця дія не може бути скасована.',
    );

    if (confirmed) {
      dispatch({ type: 'RESET' });
    }
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      aria-label="Скинути до початкових значень"
      className="flex h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm-10.624-2.85a5.5 5.5 0 0 1 9.201-2.465l.312.311H11.77a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V3.53a.75.75 0 0 0-1.5 0v2.033l-.312-.311A7 7 0 0 0 2.63 8.39a.75.75 0 0 0 1.449.39Z"
          clipRule="evenodd"
        />
      </svg>
      Скинути
    </button>
  );
}
