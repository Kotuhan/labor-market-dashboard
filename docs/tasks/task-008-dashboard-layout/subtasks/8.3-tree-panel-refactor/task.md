# Subtask 8.3: Refactor TreePanel for Single-Gender Rendering + Deviation Warnings

## Parent Task
docs/tasks/task-008-dashboard-layout

## Description
Refactor TreePanel from rendering the full tree (root + all genders) to rendering industries for a single gender node. Move root header to DashboardHeader. Add inline free-mode deviation warnings to TreePanel (gender-level) and TreeRow (subcategory-level).

Covers TL design Step 4. This is the most complex subtask (breaking API change + test updates).

## Acceptance Criteria

### TreePanel Refactor
* Given the refactored TreePanel, when it receives a single gender node, then it renders that gender's industries with sliders (same behavior as before for one gender)
* Given TreePanel's new API, when it renders, then it displays the gender heading as `<h2>`, percentage, and absolute value
* Given all existing TreePanel tests, when adapted to new API, then all pass

### Deviation Warnings
* Given the dashboard is in free mode, when a gender's industry percentages don't sum to 100%, then inline warning text appears showing deviation
* Given the dashboard is in auto-balance mode, when the user views any group, then no deviation warning is displayed
* Given an expanded industry with subcategories in free mode, when subcategory percentages don't sum to 100%, then TreeRow shows inline deviation warning
* Given the dashboard switches from free to auto mode, when groups had deviations, then all warnings disappear

## Files to Modify
- `apps/labor-market-dashboard/src/components/TreePanel.tsx` (major refactor)
- `apps/labor-market-dashboard/src/components/TreeRow.tsx` (add deviation warning)
- `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx` (update for new API + add deviation tests)
- `apps/labor-market-dashboard/src/__tests__/components/TreeRow.test.tsx` (add deviation warning tests)

## Dependencies
- None (does not depend on 8.1 or 8.2)
