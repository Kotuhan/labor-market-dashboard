import { useEffect, useRef } from 'react';

/** Props for the ConfirmDialog component. */
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Dialog title text */
  title: string;
  /** Dialog message body */
  message: string;
  /** Callback fired when user confirms */
  onConfirm: () => void;
  /** Callback fired when user cancels or presses Escape */
  onCancel: () => void;
}

/**
 * Modal confirmation dialog for destructive actions.
 *
 * Uses the native `<dialog>` element with `showModal()` for built-in
 * focus trap and backdrop. Escape key fires `onCancel` via the native
 * `cancel` event.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancel]);

  return (
    <dialog ref={dialogRef} className="rounded-lg bg-white p-6 shadow-xl max-w-md w-full">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          className="h-11 rounded-lg border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50"
          onClick={onCancel}
          autoFocus
        >
          Скасувати
        </button>
        <button
          type="button"
          className="h-11 rounded-lg bg-red-600 px-4 text-sm text-white hover:bg-red-700"
          onClick={onConfirm}
        >
          Підтвердити
        </button>
      </div>
    </dialog>
  );
}
