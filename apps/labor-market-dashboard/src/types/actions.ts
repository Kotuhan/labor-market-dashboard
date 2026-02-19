import type { BalanceMode } from './tree';

/**
 * Actions dispatched to the tree state reducer.
 *
 * Discriminated union on the `type` field. Used with React `useReducer`.
 *
 * - `SET_PERCENTAGE`: Change a node's percentage (triggers auto-balance in auto mode)
 * - `TOGGLE_LOCK`: Toggle a node's isLocked flag (with lock guard)
 * - `SET_BALANCE_MODE`: Switch between auto and free mode
 * - `SET_TOTAL_POPULATION`: Change total population (recalculates absolute values)
 * - `RESET`: Restore the entire state to defaults
 * - `ADD_INDUSTRY`: Add a new industry node under a gender node
 * - `REMOVE_INDUSTRY`: Remove an industry node (and its subcategories)
 * - `ADD_SUBCATEGORY`: Add a new subcategory under an industry node
 * - `REMOVE_SUBCATEGORY`: Remove a subcategory from an industry node
 */
export type TreeAction =
  | { type: 'SET_PERCENTAGE'; nodeId: string; value: number }
  | { type: 'TOGGLE_LOCK'; nodeId: string }
  | { type: 'SET_BALANCE_MODE'; mode: BalanceMode }
  | { type: 'SET_TOTAL_POPULATION'; value: number }
  | { type: 'RESET' }
  | { type: 'ADD_INDUSTRY'; genderId: string; label: string }
  | { type: 'REMOVE_INDUSTRY'; nodeId: string }
  | { type: 'ADD_SUBCATEGORY'; industryId: string; label: string }
  | { type: 'REMOVE_SUBCATEGORY'; nodeId: string };
