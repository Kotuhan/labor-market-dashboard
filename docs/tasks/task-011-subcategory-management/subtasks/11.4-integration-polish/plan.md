# Implementation Plan: Subtask 11.4 -- Integration and Polish

Generated: 2026-02-19

## Overview

This subtask covers TL design Steps 6, 16-18: adding a dynamic color palette for new industries (so they get distinct pie chart colors instead of fallback gray), fixing the dashboard TreePanel to auto-expand nodes that gain their first subcategory, updating barrel exports for completeness, and running final verification (full test suite, lint, build, bundle size). No new components are created; this is a minimal polish subtask touching ~5 source files.

## Implementation Order

1. Add `DYNAMIC_COLOR_PALETTE` to `chartColors.ts`
2. Update `data/index.ts` to export the new palette
3. Update `GenderSection.tsx` to build a merged color map with dynamic colors
4. Add dynamic color tests to `chartColors.test.ts` and `chartDataUtils.test.ts`
5. Add auto-expand `useEffect` to `TreePanel.tsx`
6. Add auto-expand test to `TreePanel.test.tsx`
7. Audit barrel exports for completeness
8. Final verification: `pnpm lint && pnpm test && pnpm build`

---

## Step 1: Add `DYNAMIC_COLOR_PALETTE` to `chartColors.ts`

**File**: `apps/labor-market-dashboard/src/data/chartColors.ts`
**Action**: modify

### What to Add

Add a new exported constant `DYNAMIC_COLOR_PALETTE` after the existing `DEFAULT_NODE_COLOR` constant. This is an array of 8 visually distinct hex colors that do not collide with any of the 16 `INDUSTRY_COLORS` values or `GENDER_COLORS` values.

**Palette selection rationale**: The 16 existing `INDUSTRY_COLORS` use Tailwind's 500-level palette (blue, green, red, purple, amber, pink, cyan, orange, violet, teal, indigo, lime, fuchsia, sky, rose, yellow). The dynamic palette should use colors from a different value range or hue to avoid visual confusion.

**Recommended hex values** (Tailwind 600-700 range, distinct from existing 500s):

```typescript
/**
 * Dynamic color palette for user-added industries that lack a KVED code.
 *
 * 8 visually distinct hex colors chosen to avoid collision with the 16
 * INDUSTRY_COLORS values and GENDER_COLORS. When more than 8 custom
 * industries exist, colors cycle from the start of the palette.
 */
export const DYNAMIC_COLOR_PALETTE: readonly string[] = [
  '#0D9488', // teal-600
  '#9333EA', // purple-600
  '#CA8A04', // yellow-600
  '#DC2626', // red-600
  '#2563EB', // blue-600
  '#16A34A', // green-600
  '#EA580C', // orange-600
  '#DB2777', // pink-600
];
```

**Key details**:
- Mark as `readonly string[]` to prevent mutation.
- These are all Tailwind 600-level variants, one full shade step darker than the existing 500-level INDUSTRY_COLORS. The visual contrast is sufficient for distinguishing dynamic industries from default ones.
- 8 colors is generous for the typical use case (users adding 1-3 custom industries). Colors cycle via modulo if more than 8 are added.

### Important: Collision Check

Before finalizing, verify none of these hex values appear in `INDUSTRY_COLORS`:
- `INDUSTRY_COLORS` values: `#3B82F6`, `#22C55E`, `#EF4444`, `#A855F7`, `#F59E0B`, `#EC4899`, `#06B6D4`, `#F97316`, `#8B5CF6`, `#14B8A6`, `#6366F1`, `#84CC16`, `#D946EF`, `#0EA5E9`, `#F43F5E`, `#FACC15`
- None of the recommended 600-level values appear above. Safe to proceed.

---

## Step 2: Update `data/index.ts` barrel export

**File**: `apps/labor-market-dashboard/src/data/index.ts`
**Action**: modify

### Change

Add `DYNAMIC_COLOR_PALETTE` to the existing `chartColors.ts` export block. The modified block becomes:

```typescript
export {
  DEFAULT_NODE_COLOR,
  DYNAMIC_COLOR_PALETTE,
  GENDER_COLORS,
  GHOST_SLICE_COLOR,
  INDUSTRY_COLORS,
  OVERFLOW_INDICATOR_COLOR,
} from './chartColors';
```

Maintain alphabetical order within the export block (it is currently alphabetical).

---

## Step 3: Update `GenderSection.tsx` to build a merged color map

**File**: `apps/labor-market-dashboard/src/components/GenderSection.tsx`
**Action**: modify

### Problem

Currently, `GenderSection` passes `INDUSTRY_COLORS` directly to `PieChartPanel` as the `colorMap` prop:

```typescript
<PieChartPanel
  nodes={genderNode.children}
  colorMap={INDUSTRY_COLORS}
  ...
/>
```

When a user adds a new industry (no `kvedCode`), `getNodeColor()` falls back to checking `node.id` in the map, finds nothing, and returns `DEFAULT_NODE_COLOR` (slate-400 gray). All custom industries appear as the same gray in the pie chart.

### Solution

Build a merged color map that includes both `INDUSTRY_COLORS` (for KVED-mapped nodes) and dynamically assigned colors for non-KVED nodes. The dynamic colors come from `DYNAMIC_COLOR_PALETTE`, cycling by the index of the non-KVED node among all non-KVED siblings.

### Implementation

1. **Add import** for `DYNAMIC_COLOR_PALETTE` from `@/data/chartColors`:
   ```typescript
   import { DYNAMIC_COLOR_PALETTE, INDUSTRY_COLORS } from '@/data/chartColors';
   ```

2. **Add a `useMemo` import** from React (this computation should be memoized since it runs on every render):
   ```typescript
   import { useMemo } from 'react';
   ```

3. **Build the merged color map** inside the component, before the return statement:

   ```typescript
   const colorMap = useMemo(() => {
     const merged: Record<string, string> = { ...INDUSTRY_COLORS };

     // Assign dynamic colors to industries without a KVED code
     let dynamicIndex = 0;
     for (const child of genderNode.children) {
       if (!child.kvedCode && !(child.id in merged)) {
         merged[child.id] =
           DYNAMIC_COLOR_PALETTE[dynamicIndex % DYNAMIC_COLOR_PALETTE.length];
         dynamicIndex++;
       }
     }

     return merged;
   }, [genderNode.children]);
   ```

4. **Pass `colorMap` to PieChartPanel**:
   ```typescript
   <PieChartPanel
     nodes={genderNode.children}
     colorMap={colorMap}
     ariaLabel={`Розподіл галузей -- ${genderNode.label}`}
     balanceMode={balanceMode}
   />
   ```

### Key Details

- **Why `useMemo`**: The merged map only needs to be recomputed when `genderNode.children` changes (add/remove industry). Without memoization, a new object would be created on every render, defeating `React.memo` on `PieChartPanel`.
- **Why assign by `child.id`**: Custom industries have no `kvedCode`. The `getNodeColor()` function already has a fallback path: check `kvedCode`, then check `node.id` in the color map. By adding the `child.id` key to the merged map, we leverage the existing fallback.
- **Cycling**: `DYNAMIC_COLOR_PALETTE[dynamicIndex % DYNAMIC_COLOR_PALETTE.length]` ensures cycling when more than 8 custom industries exist. The first custom industry gets palette[0], the second gets palette[1], etc.
- **Deterministic ordering**: The loop iterates `genderNode.children` in order, so the color assignment is stable as long as the children order is stable. Newly added industries go to the end (per `addChildToParent`), so existing custom industries keep their colors.

### Impact on GenderBarChart

`GenderBarChart` (`DashboardPage.tsx`) does NOT use `INDUSTRY_COLORS` for bar fill -- it uses `GENDER_COLORS` (blue for male, pink for female). Custom industries in the bar chart will naturally appear as bars with the correct gender color. No changes needed to `GenderBarChart` or `DashboardPage`.

---

## Step 4: Add tests for dynamic color palette

### File 1: `apps/labor-market-dashboard/src/__tests__/data/chartColors.test.ts`
**Action**: modify

Add a new `describe('DYNAMIC_COLOR_PALETTE')` block after the existing `describe('Special colors')` block:

**Test cases**:

1. `'has exactly 8 colors'`
   - Assert: `DYNAMIC_COLOR_PALETTE.length` is `8`

2. `'all values are valid hex color strings'`
   - Assert: each color matches `/^#[0-9A-Fa-f]{6}$/`

3. `'has no duplicate colors'`
   - Assert: `new Set(DYNAMIC_COLOR_PALETTE).size` equals `DYNAMIC_COLOR_PALETTE.length`

4. `'does not collide with any INDUSTRY_COLORS value'`
   - Assert: for every color in `DYNAMIC_COLOR_PALETTE`, it is NOT found in `Object.values(INDUSTRY_COLORS)`

**New import**: Add `DYNAMIC_COLOR_PALETTE` to the existing import from `@/data/chartColors`.

### File 2: `apps/labor-market-dashboard/src/__tests__/components/GenderSection.test.tsx`
**Action**: modify (if file exists) or note for manual verification

Check whether `GenderSection.test.tsx` exists and already tests the color map. The dynamic color behavior can be verified via a test that renders a `GenderSection` with a custom industry (no `kvedCode`) and asserts the pie chart receives a non-gray color in the data table.

**New test case** (add to existing `GenderSection.test.tsx`):

5. `'assigns a dynamic color to a custom industry without kvedCode'`
   - Setup: Create a `genderNode` with one default industry (has `kvedCode: 'G'`) and one custom industry (no `kvedCode`, `defaultPercentage: 0`)
   - Render `GenderSection` with this node
   - Assert: The sr-only data table has 2 rows (both industries appear in the pie chart)
   - This test verifies integration -- the custom node gets a color from the palette (not the gray default), which means it appears as a distinct slice

**Alternative**: If testing the actual hex color in the rendered output is fragile (Recharts SVG internals), test the `useMemo` logic by extracting it into a helper function and testing it in isolation. See "Potential Extraction" below.

### Potential Extraction: `buildColorMap` helper

If the `useMemo` logic in `GenderSection` grows complex or needs direct unit testing, extract it into a named function in `apps/labor-market-dashboard/src/utils/chartDataUtils.ts`:

```typescript
/**
 * Build a color map that merges static KVED colors with dynamic colors
 * for custom industries.
 */
export function buildIndustryColorMap(
  children: TreeNode[],
): Record<string, string> {
  // ... same logic as the useMemo
}
```

However, for this subtask's scope (8 lines of logic), keeping it inline with `useMemo` in `GenderSection` is acceptable. Only extract if the reviewer requests it or if the file exceeds 200 lines.

---

## Step 5: Add auto-expand `useEffect` to `TreePanel.tsx`

**File**: `apps/labor-market-dashboard/src/components/TreePanel.tsx`
**Action**: modify

### Problem

TreePanel's `expandedIds` state starts as an empty `Set` (all industries collapsed). When a user adds the first subcategory to a leaf industry on the config page, the industry transitions from leaf to parent. When the user navigates to the dashboard, that industry should be automatically expanded so the new subcategory is visible.

### Solution

Add a `useEffect` with a `useRef` guard (same pattern already used in `ConfigGenderSection.tsx`) that watches `genderNode.children` and auto-expands any industry that has children but is not yet tracked in the "seen expandable" set.

### Implementation

1. **Add imports**: Add `useEffect` and `useRef` to the existing React import line:
   ```typescript
   import { useCallback, useEffect, useRef, useState } from 'react';
   ```

2. **Add `seenExpandableRef`** after the `expandedIds` state declaration:
   ```typescript
   // Track IDs we have already auto-expanded so we don't re-expand
   // after the user explicitly collapses them.
   const seenExpandableRef = useRef<Set<string>>(new Set());
   ```

3. **Add `useEffect`** after `seenExpandableRef`:
   ```typescript
   // Auto-expand industries that gain children (e.g., first subcategory added
   // on the config page). Only expands IDs we haven't seen before to respect
   // user collapse actions.
   useEffect(() => {
     const newExpandable = genderNode.children
       .filter((child) => child.children.length > 0)
       .filter((child) => !seenExpandableRef.current.has(child.id));
     if (newExpandable.length > 0) {
       newExpandable.forEach((n) => seenExpandableRef.current.add(n.id));
       setExpandedIds((prev) => {
         const next = new Set(prev);
         newExpandable.forEach((n) => next.add(n.id));
         return next;
       });
     }
   }, [genderNode.children]);
   ```

### Key Details

- **Same pattern as `ConfigGenderSection`**: Lines 29-53 of `ConfigGenderSection.tsx` implement the identical pattern. This ensures consistency.
- **Why `useRef` guard**: Without the ref, a user who manually collapses an expandable node would see it re-expand on every re-render (since the effect would fire again and see the node has children but is not in `expandedIds`). The ref tracks "we already tried to auto-expand this" and skips it on subsequent runs.
- **Only new expandable nodes**: The filter `!seenExpandableRef.current.has(child.id)` ensures we only auto-expand nodes that were NEWLY discovered as having children. Nodes that already had children on mount are NOT auto-expanded (TreePanel starts fully collapsed by default, which is intentional).
- **Interaction with the industry list toggle**: The auto-expand only adds IDs to `expandedIds` (the subcategory-level expand state). The industry list itself (`isIndustriesExpanded`) is a separate boolean state and is not affected. If the user has the industry list collapsed, they will not see the auto-expanded subcategory until they expand the industry list.
- **No change to `isIndustriesExpanded` behavior**: The industry list starts collapsed. Auto-expand only affects which industries show their subcategories when the list IS expanded.

---

## Step 6: Add auto-expand test to `TreePanel.test.tsx`

**File**: `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx`
**Action**: modify

### New Test Block

Add a new `describe('TreePanel auto-expand')` block after the existing `describe('TreePanel mirrored layout')` block:

**Test cases**:

1. `'auto-expands an industry that gains children (re-render with children added)'`
   - Setup: Start with a `genderNode` where `male-g` (Торгівля) is a leaf (no children).
   - Render TreePanel. Expand the industry list.
   - Verify subcategories for Торгівля are NOT shown (it is a leaf -- no expand chevron).
   - Re-render with the same component but updated `genderNode` where `male-g` now has 1 child (simulate adding a subcategory via config page).
   - Verify: The expand button for Торгівля now exists.
   - Click the expand button for Торгівля (or verify that its children are automatically visible -- the auto-expand should have expanded it).
   - Assert: The subcategory label is visible in the document.
   - **Implementation note**: Use `rerender(<TreePanel {...updatedProps} />)` from RTL to simulate the prop change (as if the user navigated from config page back to dashboard with a new subcategory added).

2. `'does not re-expand a node that was manually collapsed by the user'`
   - Setup: Start with `genderNode` where `male-j` (IT та телеком) has 2 children.
   - Render TreePanel. Expand industry list.
   - The `seenExpandableRef` will record `male-j` on first effect run (since it has children).
   - Click collapse on IT та телеком. Verify subcategories disappear.
   - Re-render with the same props (no structural change -- same children).
   - Verify: IT та телеком remains collapsed (the auto-expand does not fight the user's explicit collapse).

### Helper Adjustments

The existing `makeTestGenderNode()` helper is sufficient for test 1 (can override `male-g` to have children). For test 2, the default `makeTestGenderNode()` already has `male-j` with children.

**For test 1, the updated `genderNode`**:
```typescript
const withSubcategory = makeTestGenderNode({
  children: [
    {
      ...makeTestGenderNode().children[0], // male-g (Торгівля)
      children: [
        {
          id: 'male-g-test',
          label: 'Тестова підкатегорія',
          percentage: 100,
          defaultPercentage: 0,
          absoluteValue: 3_000_000,
          genderSplit: { male: 100, female: 0 },
          isLocked: false,
          children: [],
        },
      ],
    },
    makeTestGenderNode().children[1], // male-j (IT) unchanged
  ],
});
```

Use `rerender()` from the `render()` return value:
```typescript
const { rerender } = render(<TreePanel {...makeProps()} />);
// ... expand industries, verify no subcategory chevron for Торгівля ...
rerender(<TreePanel {...makeProps({ genderNode: withSubcategory })} />);
// ... verify subcategory is now visible ...
```

---

## Step 7: Audit barrel exports for completeness

**File**: `apps/labor-market-dashboard/src/components/index.ts`
**Action**: verify (modify only if needed)

### Current State

The main barrel (`components/index.ts`) already exports:
- 15 dashboard components (including DashboardPage)
- Layout re-exports (AppLayout, Sidebar)
- Config re-exports (all 6 config components)

### Verification Checklist

1. All component names in the `components/` directory are exported from `components/index.ts` -- check.
2. All component names in `components/config/` are exported from `components/config/index.ts` -- check.
3. All component names in `components/layout/` are exported from `components/layout/index.ts` -- check.
4. `DYNAMIC_COLOR_PALETTE` is exported from `data/index.ts` -- will be added in Step 2.
5. No dead exports (exports referencing files that do not exist).

Based on the current codebase review, barrel exports are already complete. The only addition needed is the `DYNAMIC_COLOR_PALETTE` export in `data/index.ts` (Step 2). No changes to `components/index.ts` are expected.

If any discrepancy is found during implementation, add the missing export following the existing pattern: value export for the component, `export type` for the props interface.

---

## Step 8: Final Verification

Run in order:
1. `pnpm lint` -- must pass with 0 errors
2. `pnpm test` -- all existing tests + all new tests must pass
3. `pnpm build` -- must compile successfully with no type errors
4. Check gzipped bundle size: `ls -la apps/labor-market-dashboard/dist/assets/*.js` and verify total is well under 500KB. Expected: ~177KB (no new dependencies in this subtask).

### Manual Smoke Test Checklist

- [ ] Navigate Dashboard -> Config -> Dashboard: all state preserved
- [ ] Add a new industry on config page (e.g., "Кібербезпека" under Чоловіки)
- [ ] Navigate to dashboard: the new industry appears in the TreePanel with a slider
- [ ] The new industry appears as a distinct colored slice in the pie chart (NOT gray)
- [ ] Add the first subcategory to the new industry (it was a leaf)
- [ ] Navigate to dashboard: the industry is auto-expanded when the industry list is opened, showing the subcategory
- [ ] Manually collapse the industry. Navigate away and back. Verify it stays collapsed (auto-expand respects user collapse).
- [ ] Remove the custom industry on config page. Dashboard: it disappears from tree and pie chart.
- [ ] Reset to defaults: only the original 55 nodes remain, custom nodes gone

---

## File Summary

### Files to Modify (6)

| # | File Path | Change |
|---|-----------|--------|
| 1 | `apps/labor-market-dashboard/src/data/chartColors.ts` | Add `DYNAMIC_COLOR_PALETTE` constant (8 hex colors) |
| 2 | `apps/labor-market-dashboard/src/data/index.ts` | Add `DYNAMIC_COLOR_PALETTE` to exports |
| 3 | `apps/labor-market-dashboard/src/components/GenderSection.tsx` | Build merged color map with dynamic colors via `useMemo`; import `DYNAMIC_COLOR_PALETTE` |
| 4 | `apps/labor-market-dashboard/src/components/TreePanel.tsx` | Add `useEffect` + `useRef` for auto-expand of newly expandable nodes |
| 5 | `apps/labor-market-dashboard/src/__tests__/data/chartColors.test.ts` | Add 4 tests for `DYNAMIC_COLOR_PALETTE` (count, hex validity, uniqueness, no collision) |
| 6 | `apps/labor-market-dashboard/src/__tests__/components/TreePanel.test.tsx` | Add 2 tests for auto-expand behavior (new expandable node, respects user collapse) |

### Files NOT Modified

- `src/utils/chartDataUtils.ts` -- no changes needed. The existing `getNodeColor()` already supports the `node.id` fallback path. Dynamic colors are injected via the `colorMap` parameter from `GenderSection`.
- `src/components/index.ts` -- already complete.
- `src/components/config/index.ts` -- already complete.

---

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass (existing + ~6 new)
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.

---

## Critical Implementation Notes

1. **Do NOT modify `getNodeColor()` in `chartDataUtils.ts`**. The existing function already supports looking up colors by `node.id` as a fallback after `kvedCode`. The dynamic color assignment happens upstream in `GenderSection` where we add `child.id` keys to the merged color map. This keeps the utility function general-purpose and avoids coupling it to the `DYNAMIC_COLOR_PALETTE`.

2. **The `useMemo` dependency should be `genderNode.children`**, not `genderNode`. Using the full `genderNode` would recompute on percentage or absolute value changes (frequent during slider drag), which is wasteful since the color map only depends on which children exist and whether they have `kvedCode`.

3. **The auto-expand `useRef` pattern in `TreePanel` is identical to the one in `ConfigGenderSection.tsx`** (lines 29-53). Follow that exact pattern for consistency. The only difference is placement: `ConfigGenderSection` manages its own expand state for config rows, while `TreePanel` manages expand state for dashboard tree rows.

4. **TreePanel starts with industries collapsed** (`isIndustriesExpanded` is `false`). The auto-expand effect only manages `expandedIds` (which tracks which industries show their subcategories). The user must still expand the industry list first to see any subcategory content. This is intentional.

5. **Color cycling is deterministic**: The loop iterates `genderNode.children` in order. `addChildToParent` always appends new children at the end. Therefore, the Nth custom industry always gets `DYNAMIC_COLOR_PALETTE[N-1 % 8]`, regardless of how many default industries exist.

6. **`GenderSection` is a thin component (44 lines currently)**. Adding `useMemo` and the import will bring it to approximately 60 lines -- well within the 200-line limit.

7. **No changes to `TreeRow`**: TreeRow already handles the chevron toggle and recursive rendering correctly. It will naturally show the expand chevron when a node gains children (it checks `node.children.length > 0`). The auto-expand in TreePanel ensures the `expandedIds` set contains the newly expandable node ID, so TreeRow will render the children automatically.
