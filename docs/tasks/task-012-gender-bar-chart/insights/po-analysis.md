# PO Analysis: task-012
Generated: 2026-02-19

## Problem Statement

Currently, the dashboard shows male and female industry data in two separate columns (GenderSection panels). To compare how many workers each gender has in a given industry, the user must visually scan back and forth between the left (male) and right (female) columns, mentally comparing absolute values. This is cognitively expensive and error-prone, especially across 16 industries.

**From the user's perspective:**

"When I look at the dashboard, I can see each gender's industries separately, but I cannot quickly compare male vs. female employment side by side for every industry at once. I want a single chart at the top that shows me the gap between male and female workers per industry so I can immediately spot where the biggest gender differences are."

**Why this is important NOW:**

The dashboard's core value proposition is modeling "what-if" scenarios for Ukraine's labor market. Gender comparison is the most requested analytical view (journalist persona: "visualize gender distribution across sectors"; analyst persona: "assess sectoral impact of demobilization"). Without a comparative visualization, users must rely on mental arithmetic -- defeating the purpose of an interactive dashboard.

**What happens if we do nothing:**

Users continue scanning two separate panels to compare gender employment by industry. The most common analytical question ("Which industries have the largest gender gap?") remains unanswerable at a glance. The journalist and policy-maker personas lose a key visualization for their reports and briefings.

## Success Criteria

1. **At-a-glance comparison**: User can identify which industries have the largest male-female employment gap within 3 seconds of looking at the chart.
2. **Real-time responsiveness**: The bar chart updates within the existing < 100ms performance budget (NFR-01) when any slider changes values in the tree state.
3. **Full industry coverage**: All 16 industries are visible in the chart without horizontal scrolling on desktop (1024px+).
4. **Consistent mental model**: The chart uses the same color coding as the rest of the dashboard (male = blue #3B82F6, female = pink #EC4899), so the user does not need to learn new visual conventions.
5. **Accessible**: Screen reader users can access the same comparison data via an alternative representation (e.g., sr-only data table), consistent with existing PieChartPanel accessibility pattern.

## Acceptance Criteria

### AC-1: Chart renders with all 16 industries

* Given the dashboard is loaded with default data
  When the user views the area between the DashboardHeader and the GenderSection columns
  Then a grouped bar chart is visible spanning the full width of the content area (`max-w-7xl`)
  And the chart displays 16 industry groups on the X-axis (one per KVED sector)
  And each industry group contains exactly 2 bars (male and female)

### AC-2: Bars show absolute values from tree state

* Given the default tree with 13,500,000 total employed
  When the chart renders
  Then the male bar for each industry shows the absolute value from the male gender node's corresponding industry child
  And the female bar shows the absolute value from the female gender node's corresponding industry child
  And the Y-axis scale is labeled in thousands of workers (e.g., "0", "200", "400", ... "тис.")

### AC-3: Industry labels in Ukrainian on X-axis

* Given the chart is rendered
  When the user reads the X-axis labels
  Then each label displays the Ukrainian industry name from the tree node's `label` field
  And labels are readable without overlap (truncated, rotated, or otherwise handled for space)

### AC-4: Gender color coding matches existing palette

* Given the chart renders
  When the user views the bars
  Then male bars use color #3B82F6 (GENDER_COLORS.male)
  And female bars use color #EC4899 (GENDER_COLORS.female)
  And a legend identifies which color represents which gender

### AC-5: Real-time updates on slider interaction

* Given the user changes any industry slider in a GenderSection panel
  When the tree state updates (percentages and absolute values recalculate)
  Then the corresponding bar in the bar chart updates its height to reflect the new absolute value
  And the update occurs within the existing < 100ms performance budget

### AC-6: Real-time updates on population change

* Given the user changes the total population value in the DashboardHeader
  When the tree state recalculates all absolute values
  Then all bars in the bar chart update their heights proportionally
  And the Y-axis scale adjusts to the new data range

### AC-7: Real-time updates on gender ratio change

* Given the user adjusts the gender ratio slider (male/female split)
  When the tree state recalculates absolute values for both genders
  Then all bars in the bar chart update to reflect the new male/female absolute values per industry

### AC-8: Chart is responsive (full-width)

* Given the viewport width is >= 1024px (desktop)
  When the chart renders
  Then it spans the full width of the `max-w-7xl` content area
  And all 16 industry groups are visible without horizontal scrolling

* Given the viewport width is < 1024px (tablet/mobile)
  When the chart renders
  Then it still spans full width and remains usable (bars may be narrower, labels may be adapted)

### AC-9: Accessibility -- screen reader support

* Given a screen reader user navigates to the bar chart
  When the chart region is reached
  Then the chart is wrapped in a semantic element with an accessible label (e.g., `<figure role="img" aria-label="...">`)
  And a sr-only data table is provided as a fallback, listing each industry with male and female absolute values

### AC-10: Tooltip on hover

* Given the chart is rendered
  When the user hovers over a bar
  Then a tooltip appears showing the industry name, gender, absolute value (formatted with Ukrainian "тис." convention), and percentage of that gender's total

### AC-11: Reset behavior

* Given the user has modified sliders and then clicks "Reset to Default"
  When the tree state resets to `initialState`
  Then the bar chart returns to its default state with original absolute values for all industries

## Out of Scope

The following are explicitly **not** included in task-012:

- **Sorting/reordering industries**: Bars follow the fixed order from the tree data (same order as industry sliders). No user-controlled sorting.
- **Stacked bar chart mode**: Only grouped (side-by-side) bars. No toggle between stacked and grouped.
- **Click-to-drill-down**: Clicking a bar does not navigate to or expand subcategories. The bar chart is read-only.
- **Subcategory-level bars**: Only Level 2 (industry) bars are shown. Subcategories (Level 3) are not visualized in this chart.
- **Download/export**: No image export or data download from the bar chart.
- **Horizontal bar chart**: The chart is vertical (industries on X-axis, values on Y-axis), as specified by the user.
- **Free mode ghost bars**: Unlike the pie chart, the bar chart does not show "unallocated" ghost bars in free mode. Bars simply reflect actual absolute values.
- **Animation on initial load**: Animated entrance transitions are nice-to-have but not required for acceptance.
- **Mobile optimization below 320px**: Per NFR-05, mobile support is P1. The chart must be functional at 1024px+ (P0) but graceful degradation below that is sufficient.

## Open Questions

No open questions requiring user decision. All design choices are resolvable from the user's request and existing patterns:

| Question | Resolution | Source |
|----------|-----------|--------|
| What chart library to use? | Recharts 2.x (existing dependency, not 3.x) | CLAUDE.md, app CLAUDE.md |
| What colors for male/female bars? | GENDER_COLORS: male=#3B82F6, female=#EC4899 | User request, chartColors.ts |
| Where to place the chart? | Below DashboardHeader, above GenderSection grid | User request |
| What values on Y-axis? | Absolute values in thousands of workers | User request |
| What labels on X-axis? | Ukrainian industry names from tree node labels | User request, data conventions |
| Should the chart be interactive (dispatch actions)? | No, read-only visualization (React.memo pattern) | Existing PieChartPanel pattern |
| Should chart respond to slider changes? | Yes, derives data from tree state (same as pie charts) | Existing reactive pattern |

## Recommendations

### For TL (Technical Design)

1. **Data extraction**: The bar chart needs industry data from **both** gender nodes simultaneously (male and female). Unlike PieChartPanel which receives a single gender's `nodes`, the new component will need `state.tree.children` (both gender nodes) or both `maleNode.children` and `femaleNode.children` from App.tsx.

2. **Data transform utility**: Consider a new `toBarChartData()` function in `chartDataUtils.ts` that pairs male and female industries by KVED code, producing an array of `{ industry: string, male: number, female: number }` objects for Recharts `BarChart`.

3. **Recharts components**: The chart should use `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer` from Recharts 2.x. These are available in the current dependency.

4. **Label truncation**: Ukrainian industry names can be long (e.g., "Сільське господарство", "Держуправління та оборона"). The X-axis will likely need angled or truncated labels. This is a UX detail for TL/DEV to solve.

5. **Industry matching**: Male and female trees have the same 16 industries in the same order (by KVED code). The data transform should match them by KVED code (not by array index) for robustness, especially since custom industries may be added per gender.

### For DEV (Implementation)

1. Follow the existing **read-only visualization pattern** from PieChartPanel: `React.memo`, `<figure role="img">`, sr-only data table, no internal state, no dispatch.

2. Follow the existing **barrel export pattern**: add the new component to `components/index.ts` with both value export and `export type` for props.

3. The Y-axis formatter should use the existing `formatAbsoluteValue()` from `utils/format.ts` (produces "тис." abbreviation).

### For QA (Test Planning)

1. Test structure should mirror `PieChartPanel.test.tsx`: ResizeObserver mock, DOM structure assertions, accessibility checks, data table fallback.
2. Test with modified tree data to verify reactive updates.
3. Test with extreme values (0 workers in an industry, all workers in one industry) to verify chart handles edge cases gracefully.
