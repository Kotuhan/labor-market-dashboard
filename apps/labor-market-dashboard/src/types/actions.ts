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
 */
export type TreeAction =
  | { type: 'SET_PERCENTAGE'; nodeId: string; value: number }
  | { type: 'TOGGLE_LOCK'; nodeId: string }
  | { type: 'SET_BALANCE_MODE'; mode: BalanceMode }
  | { type: 'SET_TOTAL_POPULATION'; value: number }
  | { type: 'RESET' };
