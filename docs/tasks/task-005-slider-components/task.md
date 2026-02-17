---
id: task-005
title: Build Interactive Slider Components
status: backlog
priority: medium
dependencies: [task-004]
created_at: 2026-02-17
---

# Build Interactive Slider Components

## Problem (PO)

Users currently have a fully functional state management layer (task-004) and a complete static data tree (task-003), but there is no visual interface for interacting with the data. The dashboard's core value proposition -- "what-if" scenario modeling via dragging sliders -- is completely inaccessible because no slider UI exists.

From the user's perspective: "I am an analyst studying Ukraine's labor market. I want to drag a slider for an industry (e.g., IT) and see its percentage change, while neighboring industries redistribute automatically. I need to see both the percentage and the absolute number of people update instantly. If I want to hold an industry constant while experimenting, I need a lock button. And when I am on a tablet or phone, the sliders should be easy to tap and drag with my finger."

This task is the bridge between backend logic and user-visible functionality. Without the Slider component, the dashboard remains a static page with no interactive value. Tasks 006+ (PieChart, TreePanel, SummaryBar, full layout integration) all depend on the slider component being available and functional.

**Why now:** Task-004 (state management) is complete. The slider component is the first user-facing element that exercises the state layer. Until it is built, there is zero validation that the state management works correctly in a real UI context. It is also the longest lead time UI component (combining range input, numeric input, lock toggle, and two display modes), so starting it now keeps the project on track for milestone M2.

**Cost of inaction:** All downstream UI tasks remain blocked. The product cannot be demoed, tested with users, or deployed to GitHub Pages in any meaningful form.

## Success Criteria (PO)

1. User can drag a range slider to change a node's percentage value between 0% and 100%.
2. User can type a precise percentage value into a numeric input field (0.0-100.0, 1 decimal place).
3. User can toggle a lock icon to lock/unlock a node, with clear visual distinction between states.
4. Slider displays both percentage (e.g., "18.5%") and absolute value (e.g., "1 297 350") for the node.
5. In auto-balance mode, adjusting one slider visually triggers sibling sliders to reposition in real time.
6. In free mode, adjusting one slider does not affect sibling sliders.
7. Locked sliders are visually dimmed/disabled and cannot be dragged or edited.
8. Slider interactions feel responsive: visual feedback appears within 100ms of user input (PRD NFR-01).
9. Slider is usable on touch devices (minimum 44x44px touch target, drag works on mobile Safari/Chrome).
10. Slider component passes Lighthouse Accessibility audit with no critical violations (labels, ARIA roles, keyboard navigation).

## Acceptance Criteria (PO)

### Core Slider Interaction

* Given a Slider component rendered for an unlocked node with percentage 30.0%
  When the user drags the range slider thumb to the right
  Then the percentage display updates continuously to reflect the thumb position (0.0-100.0, 1 decimal)

* Given a Slider component rendered for an unlocked node with percentage 30.0%
  When the user types "45.5" into the numeric input field and confirms (blur or Enter)
  Then the component dispatches SET_PERCENTAGE with nodeId and value 45.5

* Given a Slider component rendered for an unlocked node
  When the user types a value greater than 100 into the numeric input
  Then the value is clamped to the maximum allowed (100.0 in free mode, or 100 minus locked sum in auto mode)

* Given a Slider component rendered for an unlocked node
  When the user types a negative value or non-numeric text into the input
  Then the value is clamped to 0 (negative) or the input is rejected (non-numeric)

### Lock/Unlock Toggle

* Given an unlocked node that is NOT the last unlocked sibling
  When the user clicks the lock toggle button
  Then the component dispatches TOGGLE_LOCK and the visual state changes to locked (dimmed slider, lock icon filled/closed)

* Given a locked node
  When the user clicks the lock toggle button
  Then the component dispatches TOGGLE_LOCK and the visual state changes to unlocked (active slider, lock icon open)

* Given the last unlocked sibling in a group (canToggleLock returns false)
  When the user attempts to click the lock toggle
  Then the lock button is visually disabled or the click has no effect, preventing the user from locking all siblings

* Given a locked node
  When the user attempts to drag the slider or edit the numeric input
  Then the slider thumb does not move and the input is disabled/read-only

### Display Values

* Given a node with percentage 18.5% and parent absoluteValue 7,109,100
  When the Slider component renders
  Then it displays "18.5%" as the percentage and the computed absolute value (formatted with space-separated thousands, e.g., "1 315 184")

* Given the user changes a node's percentage via the slider
  When the new absolute value is computed
  Then the absolute value display updates in sync with the percentage change

### Integration with State Management

* Given the Slider component receives a dispatch function and nodeId
  When the user adjusts the slider
  Then it dispatches { type: 'SET_PERCENTAGE', nodeId, value } to the tree state reducer

* Given the Slider component receives a dispatch function and nodeId
  When the user clicks the lock toggle
  Then it dispatches { type: 'TOGGLE_LOCK', nodeId } to the tree state reducer

* Given the slider is used inside a sibling group in auto-balance mode
  When the user changes one slider
  Then sibling Slider components re-render with updated percentage and absolute values (driven by parent state)

### Accessibility

* Given a Slider component
  When a screen reader user navigates to it
  Then the range input has an accessible label (node label), the current value is announced, and the lock toggle has an accessible name

* Given a Slider component
  When a keyboard user focuses the range slider
  Then they can use arrow keys to adjust the value in discrete steps, and Tab to move between the slider, numeric input, and lock toggle

### Touch/Mobile

* Given a Slider component rendered on a touch device (viewport < 768px)
  When the user touches and drags the slider thumb
  Then the slider responds smoothly to touch gestures without triggering page scroll

* Given a Slider component rendered on a touch device
  When the user taps the lock toggle
  Then the touch target is at least 44x44px and responds reliably to taps

### Edge Cases

* Given a node is the only child of its parent (single sibling)
  When the Slider component renders
  Then the lock toggle is hidden or disabled (locking a sole sibling is meaningless)

* Given auto-balance mode with the changed slider's value clamped (e.g., locked siblings consume 90%)
  When the user drags the slider beyond the clamped maximum
  Then the slider stops at the clamped maximum and does not visually overshoot

## Out of Scope (PO)

- **PieChart integration**: Pie charts are task-007. The Slider component does not render any charts.
- **TreePanel expand/collapse**: The tree panel's expand/collapse behavior for showing subcategory sliders is task-008. This task builds the Slider as a reusable component; tree hierarchy rendering is separate.
- **ModeToggle component**: The auto/free mode toggle switch is a separate component (task-006). The Slider receives the current mode as a prop but does not render the toggle.
- **SummaryBar with deviation warning**: The free-mode deviation warning display is task-009. The Slider does not show a "sum != 100%" warning.
- **ResetButton component**: The reset button with confirmation modal is a separate component.
- **Slider animations/transitions**: CSS transitions for smooth slider movement are desirable (P1 per PRD NFR-08) but not a blocking acceptance criterion. Basic functionality without animation is acceptable for this task.
- **Debouncing/throttling**: Performance optimization for rapid slider dragging is recommended but the specific implementation strategy (debounce, throttle, requestAnimationFrame) is a TL decision.
- **Color/theming by gender**: The PRD specifies blue-500 for male and pink-500 for female, but color-coding sliders by gender context is a layout/theme concern, not a Slider component concern.
- **Undo/redo**: Not in PRD v1.
- **Tooltip overlays on hover**: The Slider displays values inline; rich tooltips are not required.

## Open Questions (PO)

* **Q1 (SLIDER LIBRARY CHOICE)**: Should the slider use a third-party library (e.g., `rc-slider`, `@radix-ui/react-slider`) or a custom HTML5 `<input type="range">` implementation? The PRD mentions "rc-slider / custom" as options. A third-party library provides accessibility and touch support out of the box but adds bundle size. A custom implementation keeps the bundle small but requires more work for a11y and cross-browser consistency. --> Owner: TL

* **Q2 (NUMERIC INPUT BEHAVIOR ON DRAG)**: When the user drags the range slider, should the numeric input field update in real time (on every mousemove/touchmove) or only on drag end (mouseup/touchend)? Real-time update provides better feedback but may cause excessive re-renders. --> Owner: TL

* **Q3 (STEP SIZE)**: RESOLVED -> **(b) 1% for dragging, 0.1% via numeric input**. Dragging uses 1% steps for usability; precise 0.1% entry only via the numeric input field.

* **Q4 (ABSOLUTE VALUE FORMAT)**: RESOLVED -> **(b) Abbreviated with "тис." suffix**. Display format "1 315 тис." matching the PRD wireframe convention.

* **Q5 (SLIDER LAYOUT ORIENTATION)**: RESOLVED -> **(a) Horizontal only**. Matches PRD wireframe, no vertical orientation needed.

---

## Technical Notes (TL)

- **Affected modules**: `apps/labor-market-dashboard/src/components/`, `apps/labor-market-dashboard/src/utils/`, `apps/labor-market-dashboard/src/__tests__/`
- **New modules to create**:
  - `src/components/Slider.tsx` -- Main slider component (controlled, reusable)
  - `src/components/index.ts` -- Component barrel export
  - `src/utils/format.ts` -- Number formatting (`formatAbsoluteValue`, `formatPercentage`)
  - `src/__tests__/components/Slider.test.tsx` -- Component tests (React Testing Library)
  - `src/__tests__/utils/format.test.ts` -- Format utility unit tests
- **Barrel exports to update**: `src/utils/index.ts` (add format exports)
- **DB schema change required?**: No (client-only SPA)
- **Architectural considerations**:
  - **Q1 resolved (TL)**: Native HTML5 `<input type="range">` chosen over rc-slider/Radix. Zero bundle impact, built-in a11y/touch, sufficient for single-value slider. Custom styling via Tailwind CSS v4 + vendor-prefixed pseudo-elements.
  - **Q2 resolved (TL)**: Dispatch SET_PERCENTAGE on every drag change event (not just drag-end). React 19 automatic batching + <1ms tree recalc means no performance concern. Provides required real-time feedback for auto-balance visualization.
  - Controlled component pattern: no internal percentage state; `value` always equals prop
  - Local `inputValue: string` state only for numeric input field (allows partial typing before commit)
  - Single-file component (~150 lines estimated), not a directory with sub-components
  - `format.ts` in `utils/` for reuse by PieChart (task-007) and SummaryBar (task-009)
  - Vitest environment changes from `'node'` to `'jsdom'` for React Testing Library support
- **New devDependencies**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- **Known risks or trade-offs**:
  - [Low] Cross-browser slider thumb styling: vendor prefixes for WebKit and Firefox, well-documented
  - [Low] Numeric input edge cases: parseFloat quirks mitigated by NaN guard + clamping
  - [Low] Component size: ~150 lines, within 200-line project limit
- **Test plan**: Unit tests for format (~8 tests) + component tests for Slider (~15 tests) using React Testing Library. No integration or E2E tests needed.

## Implementation Steps (TL)

1. **Create format utility** (`src/utils/format.ts`)
   - Files: Create `src/utils/format.ts`, modify `src/utils/index.ts`
   - Implement `formatAbsoluteValue(value: number): string` (Ukrainian "тис." abbreviation for values >= 1000) and `formatPercentage(value: number): string` (1 decimal place with % suffix)
   - Add exports to `src/utils/index.ts`
   - Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

2. **Create format utility tests** (`src/__tests__/utils/format.test.ts`)
   - Files: Create `src/__tests__/utils/format.test.ts`
   - ~8 test cases: large numbers, medium, small (<1000), zero, boundary (999, 1000), percentage formatting (standard, zero, 100, integer)
   - Verification: `pnpm test --filter @template/labor-market-dashboard` -- format tests pass

3. **Add testing dependencies for React component tests**
   - Files: Modify `apps/labor-market-dashboard/package.json`, modify `apps/labor-market-dashboard/vitest.config.ts`
   - Add devDependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
   - Change vitest.config.ts `environment` from `'node'` to `'jsdom'`
   - Run `pnpm install`
   - Verification: `pnpm test --filter @template/labor-market-dashboard` -- all existing tests still pass

4. **Add slider CSS styles** (`src/index.css`)
   - Files: Modify `src/index.css`
   - Custom CSS for native range input: appearance reset, track styling, thumb sizing (44x44px touch target), disabled state, focus-visible outline
   - Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds

5. **Create Slider component** (`src/components/Slider.tsx`)
   - Files: Create `src/components/Slider.tsx`, create `src/components/index.ts`
   - Props interface: `nodeId`, `label`, `percentage`, `absoluteValue`, `isLocked`, `canLock`, `balanceMode`, `dispatch`
   - Range input: `min={0} max={100} step={1}`, `aria-label={label}`, `aria-valuetext` with formatted percentage
   - Numeric input: local `inputValue` state, blur/Enter commit, clamping [0, 100], NaN rejection
   - Lock toggle: button with lock/unlock icon, `disabled={!canLock}`, dispatches TOGGLE_LOCK
   - Display: label, formatted percentage, formatted absolute value ("тис.")
   - Locked state: range disabled, numeric readOnly, visual dimming
   - Barrel export in `src/components/index.ts`
   - Verification: `pnpm build --filter @template/labor-market-dashboard` succeeds; `pnpm lint --filter @template/labor-market-dashboard` passes

6. **Create Slider component tests** (`src/__tests__/components/Slider.test.tsx`)
   - Files: Create `src/__tests__/components/Slider.test.tsx`
   - ~15 test cases: rendering, range input dispatch, numeric input commit, clamping, NaN rejection, lock toggle, locked state, canLock disabled, accessibility (aria-label, button names), display formatting
   - All tests use `vi.fn()` mock for dispatch
   - Verification: `pnpm test --filter @template/labor-market-dashboard` -- all Slider tests pass

7. **Final verification** -- run full suite
   - Run `pnpm lint --filter @template/labor-market-dashboard` -- no errors
   - Run `pnpm test --filter @template/labor-market-dashboard` -- all tests pass (~96 existing + ~23 new)
   - Run `pnpm build --filter @template/labor-market-dashboard` -- builds successfully
   - Verify no `any` types, Slider.tsx under 200 lines, `.tsx` only for JSX files

---

## Implementation Log (DEV)

_To be filled during implementation._

---

## QA Notes (QA)

_To be filled by QA agent._
