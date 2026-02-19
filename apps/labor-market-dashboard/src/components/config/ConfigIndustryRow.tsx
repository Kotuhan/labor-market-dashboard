import type { TreeAction, TreeNode } from '@/types';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

import { AddNodeForm } from './AddNodeForm';
import { ConfigSubcategoryRow } from './ConfigSubcategoryRow';

/** Props for the ConfigIndustryRow component. */
export interface ConfigIndustryRowProps {
  /** Industry tree node */
  node: TreeNode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
  /** Callback when industry removal is requested */
  onRemoveRequest: (
    nodeId: string,
    label: string,
    hasChildren: boolean,
  ) => void;
  /** Whether this industry row is currently expanded */
  isExpanded: boolean;
  /** Callback to toggle expand/collapse */
  onToggleExpand: (id: string) => void;
  /** Whether removal is blocked (last remaining industry) */
  isRemoveBlocked: boolean;
}

/**
 * A single industry row in the config page.
 *
 * Displays the industry label, percentage, absolute value, and a
 * remove button. If the industry has subcategories, a chevron toggle
 * expands to show ConfigSubcategoryRow children and an AddNodeForm.
 */
export function ConfigIndustryRow({
  node,
  dispatch,
  onRemoveRequest,
  isExpanded,
  onToggleExpand,
  isRemoveBlocked,
}: ConfigIndustryRowProps) {
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? `Згорнути ${node.label}` : `Розгорнути ${node.label}`
            }
            onClick={() => onToggleExpand(node.id)}
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}
        <span className="flex-1 text-sm font-medium text-slate-800">
          {node.label}
        </span>
        <span className="text-sm text-slate-500">
          {formatPercentage(node.percentage)}
        </span>
        <span className="text-sm text-slate-500">
          {formatAbsoluteValue(node.absoluteValue)}
        </span>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          aria-label={`Видалити ${node.label}`}
          disabled={isRemoveBlocked}
          title={
            isRemoveBlocked
              ? 'Неможливо видалити останню галузь'
              : undefined
          }
          onClick={() =>
            onRemoveRequest(node.id, node.label, hasChildren)
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-4">
          {node.children.map((child) => (
            <ConfigSubcategoryRow
              key={child.id}
              node={child}
              onRemoveRequest={(childId, childLabel) =>
                onRemoveRequest(childId, childLabel, false)
              }
            />
          ))}
          <AddNodeForm
            parentId={node.id}
            actionType="ADD_SUBCATEGORY"
            dispatch={dispatch}
            placeholder="Назва підкатегорії"
          />
        </div>
      )}
    </div>
  );
}
