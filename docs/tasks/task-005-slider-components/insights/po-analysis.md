# PO Analysis: task-005
Generated: 2026-02-17

## Problem Statement

Users currently have a fully functional state management layer (task-004) and a complete static data tree (task-003), but there is no visual interface for interacting with the data. The dashboard's core value proposition -- "what-if" scenario modeling via dragging sliders -- is completely inaccessible because no slider UI exists.

From the user's perspective: "I am an analyst studying Ukraine's labor market. I want to drag a slider for an industry (e.g., IT) and see its percentage change, while neighboring industries redistribute automatically. I need to see both the percentage and the absolute number of people update instantly. If I want to hold an industry constant while experimenting, I need a lock button. And when I am on a tablet or phone, the sliders should be easy to tap and drag with my finger."

This task is the bridge between backend logic and user-visible functionality. Without the Slider component, the dashboard remains a static page with no interactive value. Tasks 006+ (PieChart, TreePanel, SummaryBar, full layout integration) all depend on the slider component being available and functional.

**Why now:** Task-004 (state management) is complete. The slider component is the first user-facing element that exercises the state layer. Until it is built, there is zero validation that the state management works correctly in a real UI context. It is also the longest lead time UI component (combining range input, numeric input, lock toggle, and two display modes), so starting it now keeps the project on track for milestone M2.

**Cost of inaction:** All downstream UI tasks remain blocked. The product cannot be demoed, tested with users, or deployed to GitHub Pages in any meaningful form.

## Success Criteria

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

## Acceptance Criteria

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

## Out of Scope

- **PieChart integration**: Pie charts are task-007. The Slider component does not render any charts.
- **TreePanel expand/collapse**: The tree panel's expand/collapse behavior for showing subcategory sliders is task-008. This task builds the Slider as a reusable component; tree hierarchy rendering is separate.
- **ModeToggle component**: The auto/free mode toggle switch is a separate component (task-006). The Slider receives the current mode as a prop but does not render the toggle.
- **SummaryBar with deviation warning**: The free-mode deviation warning display is task-009. The Slider does not show a "sum != 100%" warning.
- **ResetButton component**: The reset button with confirmation modal is a separate component.
- **Number formatting utility (format.ts)**: While the Slider must display formatted absolute values, the format utility itself (`format.ts`) should be created as a shared utility but is not the focus of acceptance testing here. If it does not yet exist, it should be created as part of this task, but the testing focus remains on slider behavior.
- **Slider animations/transitions**: CSS transitions for smooth slider movement are desirable (P1 per PRD NFR-08) but not a blocking acceptance criterion. Basic functionality without animation is acceptable for this task.
- **Debouncing/throttling**: Performance optimization for rapid slider dragging is recommended but the specific implementation strategy (debounce, throttle, requestAnimationFrame) is a TL decision.
- **Color/theming**: The PRD specifies blue-500 for male and pink-500 for female, but color-coding sliders by gender context is a layout/theme concern, not a Slider component concern.
- **Undo/redo**: Not in PRD v1.
- **Tooltip overlays on hover**: The Slider displays values inline; rich tooltips on hover are not required.

## Open Questions

* **Q1 (SLIDER LIBRARY CHOICE)**: Should the slider use a third-party library (e.g., `rc-slider`, `@radix-ui/react-slider`) or a custom HTML5 `<input type="range">` implementation? The PRD mentions "rc-slider / custom" as options. A third-party library provides accessibility and touch support out of the box but adds bundle size. A custom implementation keeps the bundle small but requires more work for a11y and cross-browser consistency. --> Owner: TL

* **Q2 (NUMERIC INPUT BEHAVIOR ON DRAG)**: When the user drags the range slider, should the numeric input field update in real time (on every mousemove/touchmove) or only on drag end (mouseup/touchend)? Real-time update provides better feedback but may cause excessive re-renders. --> Owner: TL

* **Q3 (STEP SIZE)**: What should the slider step size be? Options: (a) 0.1% (matching the 1-decimal-place precision), (b) 1% for dragging with 0.1% precision only via numeric input, (c) configurable per tree level. --> Owner: PO/USER

* **Q4 (ABSOLUTE VALUE FORMAT)**: The PRD says "2 430 тис." (thousands abbreviated). Should the Slider display the full number with space separators (e.g., "1 315 184") or abbreviated with "тис." suffix (e.g., "1 315 тис.")? --> Owner: PO/USER

* **Q5 (SLIDER LAYOUT ORIENTATION)**: Should the Slider component be horizontal-only (as shown in PRD wireframe) or also support vertical orientation for potential future layouts? --> Owner: PO/USER

## Recommendations

- **For TL**: The Slider component should be designed as a controlled component accepting props: `nodeId`, `label`, `percentage`, `absoluteValue`, `isLocked`, `canLock`, `balanceMode`, `onPercentageChange`, `onToggleLock`. This keeps it decoupled from the dispatch mechanism and reusable at all tree levels (gender, industry, subcategory).
- **For TL**: Consider using `requestAnimationFrame` batching or React 19's automatic batching to handle rapid slider drag events without excessive re-renders.
- **For DEV**: The `format.ts` utility does not exist yet. It should be created as part of this task to format absolute values with space-separated thousands (Ukrainian number formatting convention).
- **For QA**: Test the slider with both mouse and touch inputs. Verify keyboard navigation (Tab order, arrow keys). Verify that locked sliders truly cannot be manipulated. Test the edge case where all siblings except one are locked -- the last unlocked sibling's lock button should be disabled.
- **For QA**: Verify that the numeric input rejects non-numeric characters, handles paste of invalid values, and correctly handles edge cases like empty string, "0", "100", and values with more than 1 decimal place (should round to 1 decimal).
