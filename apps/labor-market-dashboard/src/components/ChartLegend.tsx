/** Single legend entry. */
export interface LegendItem {
  /** Display label */
  label: string;
  /** Hex color */
  color: string;
}

/** Props for ChartLegend. */
export interface ChartLegendProps {
  /** Legend entries to display */
  items: LegendItem[];
  /** Maximum height before scrolling (in px). Default: 300 */
  maxHeight?: number;
}

/**
 * Scrollable legend component for pie charts.
 *
 * Renders a semantic list of color-label pairs with a scrollable container
 * when content exceeds maxHeight. Legend items use `<ul>/<li>` markup
 * for accessibility.
 */
export function ChartLegend({ items, maxHeight = 300 }: ChartLegendProps) {
  return (
    <div
      className="overflow-y-auto"
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="text-xs text-slate-600">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
