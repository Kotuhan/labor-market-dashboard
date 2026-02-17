# PO Analysis: task-006
Generated: 2026-02-17

## Problem Statement

The dashboard now has working state management (task-004) and interactive slider controls (task-005), but the user experience is purely numeric. When an analyst drags a slider for an industry, they see percentage and absolute values change as text -- but there is no visual representation of the proportions. Humans are far better at perceiving relative sizes through visual shapes (pie slices) than by comparing strings of numbers.

From the user's perspective: "I am modeling a scenario where the IT sector grows from 3.1% to 8% for male workers. I can see the numbers change when I drag the slider, but I have no intuitive sense of how much of the total labor force IT now represents relative to agriculture or manufacturing. I need a pie chart that instantly shows me the visual proportions -- so I can see that IT is still a thin slice compared to the dominant sectors. Without charts, I am essentially using a spreadsheet with sliders."

**Why now:** The PRD positions pie charts as the primary visualization tool (FR-05), sitting alongside sliders in the layout wireframe. Sliders provide input; pie charts provide output comprehension. Without pie charts, the dashboard delivers only half of its interaction model. The "what-if" scenario is only powerful when the user can visually grasp the impact of their changes in real time. Task-005 (Slider) is complete, making chart integration the natural next step toward milestone M2.

**Cost of inaction:** The dashboard remains a numeric-only tool with no visual storytelling. Users cannot quickly compare relative proportions across 16 industries, cannot see gender split at a glance, and cannot present findings visually (a key use case for journalists and policy-makers). The full layout integration (task-010) cannot be built without pie chart components ready to compose into the page.

## Success Criteria

1. User can see a gender split pie chart showing male/female proportions with corresponding colors (blue for male, pink for female) and both percentage and absolute values accessible.
2. User can see a per-gender industry pie chart (one for male, one for female) showing all 16 KVED sectors as proportional slices with distinct colors.
3. When the user drags any slider, the corresponding pie chart(s) animate smoothly to reflect the new proportions within 100ms of the state change (PRD NFR-01).
4. User can hover (desktop) or tap (mobile) any pie slice to see a tooltip displaying the industry label, percentage (1 decimal), and absolute value (Ukrainian "тис." format).
5. Each pie chart includes a legend mapping slice colors to industry labels.
6. When a subcategory group is expanded (e.g., IT subcategories), a mini pie chart can render for that group showing its children's proportions.
7. Charts are responsive and render correctly at desktop (1024px+), tablet, and mobile (320px+) widths.
8. Chart animations run at 60fps (PRD NFR-08) -- no janky transitions when sliders are dragged.
9. Pie chart components are accessible: slices and tooltips include ARIA labels or descriptions so screen reader users can understand the data.
10. All pie chart components pass lint, type-check, build, and have unit tests covering rendering, data mapping, and accessibility.

## Acceptance Criteria

### Gender Split Pie Chart

* Given the dashboard state with male 52.66% and female 47.34%
  When the gender split pie chart renders
  Then it shows two slices: male in blue (#3B82F6) and female in pink (#EC4899), sized proportionally to their percentages

* Given the user changes the gender split slider to male 60% / female 40%
  When the state updates
  Then the gender split pie chart animates to reflect the new proportions within 100ms

* Given the gender split pie chart is rendered
  When the user hovers over the male slice (desktop) or taps it (mobile)
  Then a tooltip appears showing "Чоловіки", the percentage (e.g., "52.7%"), and the absolute value (e.g., "7 109 тис.")

### Per-Gender Industry Pie Chart

* Given the male gender node has 16 industry children with varying percentages
  When the male industry pie chart renders
  Then it shows 16 slices, each with a distinct color from the industry color palette, sized proportionally to their percentages

* Given the female gender node has 16 industry children
  When the female industry pie chart renders
  Then it shows 16 slices with the same industry-to-color mapping as the male chart (same industry = same color across genders)

* Given the user adjusts a male industry slider (e.g., IT from 3.1% to 8.0%)
  When auto-balance redistributes sibling percentages
  Then the male industry pie chart animates all affected slices to their new sizes

* Given an industry pie chart is rendered
  When the user hovers over a slice
  Then a tooltip shows the industry label (e.g., "IT та телеком"), percentage (e.g., "8.0%"), and absolute value (e.g., "569 тис.")

* Given an industry pie chart is rendered
  When the user inspects the chart area
  Then a legend is visible mapping each color to its industry label

### Subcategory Mini Pie Chart

* Given an industry with subcategories is expanded (e.g., IT with 10 children)
  When the mini pie chart renders
  Then it shows slices for each subcategory, sized proportionally to their percentages within the parent industry

* Given a subcategory slider is adjusted within an expanded industry
  When the state updates
  Then the mini pie chart animates to reflect the new subcategory proportions

### Real-Time Reactivity

* Given any slider in the dashboard is being dragged
  When the state updates on each drag event
  Then the corresponding pie chart(s) update their slice sizes in real time (no delay or stutter)

* Given the user switches from auto-balance to free mode
  When industry percentages no longer sum to 100%
  Then the pie chart still renders correctly, showing proportional slices based on each slice's share of the total sum (even if total exceeds 100%)

* Given the user changes the total population
  When absolute values recalculate throughout the tree
  Then tooltip absolute values update accordingly; pie chart proportions remain unchanged (only percentages drive slice sizes)

* Given the user resets the dashboard to defaults
  When all percentages return to default values
  Then all pie charts animate back to their default proportions

### Responsive Design

* Given the dashboard is viewed on a desktop (viewport >= 1024px)
  When pie charts render
  Then they display at a comfortable size with readable legends and tooltips

* Given the dashboard is viewed on a mobile device (viewport 320px)
  When pie charts render
  Then they scale down proportionally, remain readable, and tooltips do not overflow the viewport

### Color Palette

* Given the pie chart needs to render 16 industry slices
  When colors are assigned to industries
  Then a palette of 16 visually distinct colors is used, and the mapping is consistent across male and female charts (same industry always gets the same color)

### Accessibility

* Given a pie chart component renders
  When a screen reader user encounters it
  Then each chart has an accessible label describing its purpose (e.g., "Male industry distribution pie chart")

* Given a pie chart component renders with slices
  When a keyboard user navigates to the chart
  Then they can access the data (via ARIA attributes, a data table fallback, or equivalent accessible mechanism)

### Formatting Consistency

* Given the format utilities from task-005 (formatAbsoluteValue, formatPercentage)
  When pie chart tooltips and legends display values
  Then they use the same formatting functions (Ukrainian "тис." abbreviation, 1 decimal percentage)

## Out of Scope

- **Slider components**: Sliders are built in task-005. Pie charts do not contain slider controls.
- **TreePanel expand/collapse**: The mechanism for expanding/collapsing industries to show subcategories is a separate task. The mini pie chart component should be renderable independently; the parent decides when to show it.
- **ModeToggle component**: The auto/free mode toggle is not part of this task.
- **SummaryBar component**: The top-level summary statistics bar is not part of this task.
- **ResetButton component**: The reset button with confirmation modal is separate.
- **Full page layout integration**: How pie charts are positioned relative to sliders and panels is a layout/integration task, not this component task.
- **3D or donut chart variants**: PRD specifies standard pie charts only.
- **Click-to-drill-down on pie slices**: Clicking a pie slice to navigate into subcategories is not specified in the PRD. Charts are read-only visualizations.
- **Export/download chart as image**: Not in PRD v1.
- **Chart-driven state changes**: Pie charts are read-only; they visualize state but do not modify it. No drag-to-resize slices.
- **Print-friendly chart styling**: Not in PRD v1.
- **Dark mode chart colors**: No dark mode in PRD v1.
- **Server-side rendering of charts**: SPA only, no SSR.
- **Stacked bar chart or other chart types**: Only pie charts are in scope for this task.
- **Industry subcategory charts for non-IT industries**: Currently only IT (KVED J) has Level 3 children. The mini pie chart should work for any industry with children, but no new subcategory data is created.

## Open Questions

* **Q1 (RECHARTS VERSION AND DEPENDENCY)**: Recharts is listed in the PRD tech stack but is NOT currently in `package.json`. Which version should be installed? The latest stable (Recharts 2.x) is React 18 compatible. Need to confirm React 19 compatibility, since the project uses React 19. --> Owner: TL

* **Q2 (INDUSTRY COLOR PALETTE DEFINITION)**: The PRD specifies "a palette of 15 distinguishable colors (Tailwind palette)" for industries, but now the tree has 16 industries per gender. Should the color palette be defined as a fixed mapping (industry KVED code to specific Tailwind color) or generated dynamically? Where should the mapping live (in a constants file, co-located with the chart component, or in the data layer)? --> Owner: TL

* **Q3 (PIE CHART BEHAVIOR IN FREE MODE)**: In free mode, industry percentages may not sum to 100%. Should pie charts: (a) show proportional slices based on each value's share of the actual total (normalizing visually to a full circle), or (b) show a "missing" or "excess" slice to visually indicate the deviation from 100%? This affects how truthfully the chart represents the data. --> Owner: PO (user decision needed)

* **Q4 (LEGEND PLACEMENT AND TRUNCATION)**: With 16 industries per chart, a legend listing all 16 items may be quite long. Should the legend: (a) be placed to the right of the chart on desktop and below on mobile, (b) be scrollable if it overflows, (c) show only top N industries with an "Other" grouping, or (d) be hidden by default with a toggle? --> Owner: PO (user decision needed)

* **Q5 (MINI CHART SIZE AND TRIGGER)**: The PRD mentions "mini pie-chart" for expanded subcategories. What is the expected size relative to the main industry charts? Should it be rendered inline next to the subcategory sliders, or in a separate panel? --> Owner: PO (user decision needed)

* **Q6 (TOOLTIP INTERACTION ON MOBILE)**: On touch devices, tooltips typically require a tap to show. Should the tooltip: (a) appear on tap and dismiss on tap-away, (b) appear on long-press, or (c) always show values in the legend instead of requiring tooltip interaction? --> Owner: TL

* **Q7 (ANIMATION DURATION)**: The PRD says "animated transitions" (NFR-08) but does not specify duration. Should transitions be: (a) 300ms (standard UI transition), (b) 500ms (more noticeable for presentation use), or (c) configurable? --> Owner: TL

## Recommendations

- **For TL**: Consider creating a shared `chartColors.ts` constants file in `src/data/` or `src/utils/` that maps KVED codes to Tailwind color values. This ensures consistency between male and female charts, and can be reused if bar charts or other visualizations are added later.
- **For TL**: The `formatAbsoluteValue` and `formatPercentage` utilities from `src/utils/format.ts` are already built and tested. Tooltip formatters should reuse these directly.
- **For TL**: Recharts `<PieChart>` accepts data as an array of `{ name, value }` objects. Consider a utility function that transforms `TreeNode.children` into the Recharts data format, keeping the mapping logic testable outside the component.
- **For DEV**: The Slider component pattern (controlled, no internal state for values, dispatch-based) should be followed for chart components. Charts receive tree node data as props; they do not manage their own data.
- **For QA**: Test that charts render the correct number of slices for the default data (2 slices for gender, 16 slices per gender for industries, 10 slices for IT subcategories). Verify tooltip content matches formatAbsoluteValue/formatPercentage output.
