---
id: task-009
title: Integrate All Components and Add Real-time Updates
status: grooming
priority: medium
dependencies: [task-008]
created_at: 2026-02-18
---

# Integrate All Components and Add Real-time Updates

## Problem (PO)

Task 9 in TaskMaster describes full component integration, real-time slider-to-chart
synchronization, CSS transitions, React.memo/useMemo optimization, and Ukrainian locale
formatting. However, tasks 4-8 already implemented the vast majority of this work:

- App.tsx is a working composition root wiring useTreeState to DashboardHeader and 2 GenderSections
- All 10 components are integrated and tested (280 tests, all passing)
- React.memo is applied to TreeRow and PieChartPanel
- Ukrainian formatting exists in utils/format.ts (formatAbsoluteValue, formatPercentage, formatPopulation)
- Recharts animations run at 300ms with ease-out easing
- CSS transitions exist on ModeToggle, Slider lock button, ResetButton

The remaining gaps are:
1. **Bundle size optimization** -- production JS is 593KB (Vite warns at 500KB), needs code splitting
2. **Performance verification** -- no formal measurement that slider-to-chart latency is under 100ms

Note: Mini subcategory pie charts were intentionally removed per user request (commit `680c4a4`).

## Success Criteria (PO)

- Production bundle JS chunk stays under 500KB (or is split into chunks each under 500KB)
- Slider-to-chart update latency verified as under 100ms on a standard development machine

## Acceptance Criteria (PO)

* Given any slider is dragged
  When the value changes
  Then all connected pie charts update within 100ms (no perceptible lag)

* Given the production build is run
  When the output is inspected
  Then no single JS chunk exceeds 500KB minified (code splitting applied if needed)

## Out of Scope (PO)

- Lighthouse audit optimization (task-010 scope)
- Accessibility improvements beyond what is already implemented (task-010 scope)
- GitHub Pages deployment (task-010 scope)
- Memory leak testing (not applicable -- no subscriptions, intervals, or WebSocket connections exist)
- SEO/meta tags (task-010 scope)

## Open Questions (PO)

No open questions -- all questions were resolved during earlier tasks.

---

## Technical Notes (TL)

_To be filled by TL agent._

## Implementation Steps (TL)

_To be filled by TL agent._

---

## Implementation Log (DEV)

- Pending

---

## QA Notes (QA)

### Test Cases

- Pending

### Test Results

- Pending
