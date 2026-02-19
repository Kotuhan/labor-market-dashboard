# Subtask 11.4: Integration and Polish

## Parent Task
task-011-subcategory-management

## Description
Add dynamic color palette for new industries, fix TreePanel to auto-expand newly expandable nodes, update barrel exports, and run final verification (full test suite, lint, build, bundle size check). Covers TL design Steps 6, 16-18.

## Acceptance Criteria

* Given a new industry is added that is not in the KVED palette
  When the pie chart renders
  Then the industry gets a dynamically assigned distinct color (not the default gray)

* Given a user adds the first subcategory to a leaf industry on the config page
  When they navigate to the dashboard
  Then the industry is automatically expanded in the TreePanel

* Given all components are integrated
  When `pnpm build` runs
  Then the gzipped bundle size is < 500KB

* Given all tests exist
  When `pnpm test` runs
  Then all tests pass (existing + new, no skips)

* Given the full app is running
  When navigating between pages, adding/removing nodes, and resetting
  Then all acceptance criteria from the parent task are met

## Verification Steps

1. `pnpm test` -- all tests pass
2. `pnpm lint` -- no errors
3. `pnpm build` -- builds successfully
4. Check gzipped bundle size (expect ~177KB, must be < 500KB)
5. Manual smoke test:
   - Navigate Dashboard -> Config -> Dashboard (state preserved)
   - Add industry on config page -> appears on dashboard with slider + pie slice
   - Add first subcategory to leaf -> industry becomes expandable on dashboard
   - Remove industry with subcategories -> gone from dashboard
   - Reset -> only default 55 nodes remain

## Files to Create/Modify

### Modify
- `src/data/chartColors.ts` (add DYNAMIC_COLOR_PALETTE)
- `src/data/index.ts` (add export)
- `src/utils/chartDataUtils.ts` (update getNodeColor for dynamic colors)
- `src/components/TreePanel.tsx` (auto-expand newly expandable nodes)
- `src/components/index.ts` (final barrel export updates)
- `src/__tests__/components/TreePanel.test.tsx` (add auto-expand test)
