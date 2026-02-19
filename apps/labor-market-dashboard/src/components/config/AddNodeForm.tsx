import { useState } from 'react';

import type { TreeAction } from '@/types';

/** Props for the AddNodeForm component. */
export interface AddNodeFormProps {
  /** ID of the parent node (genderId for industries, industryId for subcategories) */
  parentId: string;
  /** Which action to dispatch */
  actionType: 'ADD_INDUSTRY' | 'ADD_SUBCATEGORY';
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
  /** Placeholder text for the input field */
  placeholder: string;
}

/**
 * Inline form for adding a new industry or subcategory node.
 *
 * Dispatches ADD_INDUSTRY or ADD_SUBCATEGORY on form submit,
 * then clears the input. The submit button is disabled when
 * the input is empty or whitespace-only.
 */
export function AddNodeForm({
  parentId,
  actionType,
  dispatch,
  placeholder,
}: AddNodeFormProps) {
  const [label, setLabel] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;

    if (actionType === 'ADD_INDUSTRY') {
      dispatch({ type: 'ADD_INDUSTRY', genderId: parentId, label: trimmed });
    } else {
      dispatch({
        type: 'ADD_SUBCATEGORY',
        industryId: parentId,
        label: trimmed,
      });
    }
    setLabel('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={!label.trim()}
          className="flex h-11 items-center gap-1 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Додати
        </button>
      </div>
    </form>
  );
}
