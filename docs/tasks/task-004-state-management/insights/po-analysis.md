# PO Analysis: task-004
Generated: 2026-02-17

## Problem Statement

The Labor Market Dashboard has a complete data model (task-002) and a static default data tree (task-003), but currently no mechanism exists for users to interact with the data. The dashboard is read-only -- sliders cannot be moved, percentages cannot be changed, and no "what-if" scenarios can be modeled. This is the core value proposition of the entire product.

From the user's perspective: "I want to drag a slider to change an industry's percentage and immediately see the rest of the industries adjust to maintain 100%, with absolute numbers recalculating in real time. If I need to fix certain industries before adjusting others, I want to lock them. And if I want to experiment freely without the 100% constraint, I want a mode for that too."

**Why this is urgent now**: Every downstream UI feature depends on state management. Sliders (task-005), pie charts (task-006), tree panel (task-007), and summary bar (task-008) all need to consume and dispatch state changes. Without this foundation, no interactive UI can be built. This is the critical path item between static data and a functional dashboard.

**If we do nothing**: The dashboard remains a static HTML page with no interactivity. All tasks from 005 onward are blocked. The product delivers zero user value.

## Success Criteria

1. A user can change any node's percentage via a dispatched action, and sibling percentages rebalance automatically to maintain a 100% sum (auto-balance mode).
2. A user can lock any node, and locked nodes are excluded from rebalancing when a sibling changes.
3. A user can switch to "free" mode where percentage changes are independent (no rebalancing), and a sum-deviation indicator is available.
4. A user can switch back to "auto" mode from "free" mode, triggering normalization of current percentages back to 100%.
5. Absolute values recalculate correctly throughout the entire tree whenever any percentage changes (cascading from parent to children).
6. A user can change the total population, causing all absolute values in the tree to recalculate while percentages remain unchanged.
7. A user can reset the entire tree to default values (from `defaultTree`).
8. All state transitions complete within 16ms (one frame at 60fps) for a tree of 55 nodes, meeting the PRD's <100ms requirement with margin.
9. The state management layer is fully unit-tested, covering auto-balance edge cases, lock interactions, mode switching, and cascading recalculations.

## Acceptance Criteria

### Auto-Balance Mode

* Given the dashboard is in auto-balance mode with siblings [A=30%, B=40%, C=30%] all unlocked
  When the user changes A to 50%
  Then B and C are proportionally reduced to maintain 100% total (B~28.6%, C~21.4%), and all absolute values recalculate

* Given the dashboard is in auto-balance mode with siblings [A=30%, B=40%, C=30%] where B is locked
  When the user changes A to 50%
  Then B remains at 40%, C adjusts to 10%, and the total remains 100%

* Given the dashboard is in auto-balance mode with all siblings except the changed one locked
  When the user changes a slider
  Then the change is clamped to the maximum available (100% minus sum of locked siblings), and no node goes below 0%

* Given the dashboard is in auto-balance mode with unlocked siblings all at 0%
  When the user decreases a sibling (freeing percentage)
  Then the freed percentage is distributed equally among the 0% unlocked siblings

* Given a node's percentage changes in auto-balance mode
  When the new percentages are calculated
  Then `largestRemainder()` is applied to ensure sibling percentages sum to exactly 100.0 (no floating-point drift)

### Free Mode

* Given the dashboard is in free mode
  When the user changes any slider
  Then only that node's percentage and absolute value update; no siblings are affected

* Given the dashboard is in free mode and sibling percentages sum to 115%
  When the user inspects the state
  Then the state exposes the deviation from 100% (e.g., +15%) for UI consumption by SummaryBar

### Mode Switching

* Given the dashboard is in free mode with percentages summing to 115%
  When the user switches to auto-balance mode
  Then all sibling percentages are normalized to sum to exactly 100% (proportionally scaled)

* Given the dashboard is in auto-balance mode
  When the user switches to free mode
  Then no values change; percentages remain as-is

### Cascading Recalculation

* Given a gender node's percentage changes (e.g., Male from 52.66% to 60%)
  When the state updates
  Then the gender node's absolute value recalculates from root, and all children (industries) recalculate their absolute values from the new gender absolute value, and their children (subcategories) recalculate recursively

* Given the user changes the total population from 13,500,000 to 15,000,000
  When the state updates
  Then the root absolute value becomes 15,000,000, and every node in the tree recalculates its absolute value while all percentages remain unchanged

### Lock/Unlock

* Given a node is unlocked
  When the user toggles its lock
  Then isLocked becomes true and it is excluded from auto-balance redistribution

* Given a node is locked
  When the user toggles its lock
  Then isLocked becomes false and it participates in auto-balance redistribution again

### Reset

* Given the user has modified multiple sliders and locked some nodes
  When the user triggers a reset action
  Then the entire tree returns to the defaultTree state: all percentages equal their defaultPercentage values, all isLocked flags are false, balanceMode returns to 'auto', and totalPopulation returns to 13,500,000

### Performance

* Given a tree with 55 nodes
  When any state action is dispatched (percentage change, lock toggle, mode switch, reset)
  Then the state update completes in under 16ms

### Testing

* Given the state management hooks and utilities
  When unit tests are run via `pnpm test`
  Then all tests pass, covering: auto-balance proportional redistribution, locked node exclusion, edge cases (all locked, all zero, single sibling), free mode independence, mode switching normalization, cascading absolute value recalculation, total population change, and reset to defaults

## Out of Scope

- **UI components**: No Slider, PieChart, TreePanel, ModeToggle, SummaryBar, or ResetButton components. Those are tasks 005-009. This task produces only hooks and utility functions.
- **Visual rendering or DOM interaction**: No JSX, no CSS, no Tailwind. Pure logic and state.
- **Undo/redo functionality**: Not in PRD v1. State changes are one-directional.
- **Scenario saving/loading (localStorage)**: Explicitly out of scope per PRD Section 11.
- **Drag-and-drop tree reordering**: The tree structure is fixed; only values change.
- **URL-based state persistence (query params)**: Not in PRD v1.
- **Validation UI (error messages, toasts)**: Validation logic may exist in the state layer, but no user-facing error display. That belongs to UI tasks.
- **Animation/transition timing**: State updates are instant; animation is a UI concern.
- **Debouncing or throttling of slider input**: That is a UI-layer optimization for the Slider component (task-005).
- **Gender slider special behavior**: The gender slider (Level 1) has only 2 children that inherently sum to 100% via a single slider. Whether this needs special handling or follows the general auto-balance pattern is a TL/DEV decision.

## Open Questions

* **Q1 (MODE SWITCH NORMALIZATION)**: When the user switches from free mode (where percentages may not sum to 100%) to auto-balance mode, should the system (a) proportionally normalize all percentages to sum to 100%, or (b) adjust only the last-changed sibling to absorb the difference, or (c) show a confirmation dialog before normalizing? -> Owner: PO (user decision)

* **Q2 (LOCK LIMIT)**: Should there be a maximum number of siblings that can be locked simultaneously? The PRD's auto-balance pseudo-code requires at least one unlocked sibling (besides the one being changed) to redistribute to. If all siblings are locked, should the system (a) prevent the last unlock-able sibling from being locked, (b) allow it but disable the slider for the changed node, or (c) allow it and silently skip redistribution? -> Owner: PO (user decision)

* **Q3 (NEGATIVE PERCENTAGE CLAMPING)**: When auto-balance would force an unlocked sibling below 0%, should the system (a) clamp at 0% and redistribute the excess among remaining unlocked siblings, or (b) clamp the changed slider's maximum so no sibling can go below 0%? The PRD pseudo-code says `clamp(u.percentage, 0, 100)` but does not specify what happens to the "lost" excess. -> Owner: PO (user decision)

* **Q4 (STATE MANAGEMENT CHOICE)**: The PRD and task description mention both `useReducer` and `Zustand` as options. Should the TL choose freely based on technical merits, or does the user have a preference? This affects API surface, testability, and bundle size. -> Owner: PO (user decision)

* **Q5 (PERCENTAGE PRECISION)**: Should slider interactions use 1 decimal place precision (matching the `defaultTree` data and `largestRemainder` with `decimals=1`) or integer-only percentages for simplicity? The PRD does not specify slider step granularity. -> Owner: PO (user decision)

## Recommendations

- **For TL**: The auto-balance algorithm from the PRD pseudo-code needs careful handling of edge cases: all-zero unlocked siblings, single unlocked sibling, locked sum exceeding 100%. Consider implementing the core algorithm as a pure function in `utils/calculations.ts` so it can be unit-tested independently of React state, then wrap it in hooks. The `largestRemainder` function from `dataHelpers.ts` should be reused for final percentage rounding.
- **For DEV**: The cascading absolute value recalculation is a tree traversal (`parent.absoluteValue * percentage / 100` at each level). This should be a single recursive pass, not per-node updates, to avoid partial state inconsistency. Consider immutable tree updates (producing a new tree reference) to enable React's referential equality checks for re-rendering optimization.
- **For QA**: Focus testing on boundary conditions: (1) changing a slider to 0% or 100%, (2) locking all but one sibling, (3) switching modes with extreme deviations from 100%, (4) total population set to 0 or very large numbers, (5) rapid sequential changes (no stale state). Property-based testing would be valuable for the auto-balance algorithm (sum always equals 100%, no value below 0%, locked values unchanged).
