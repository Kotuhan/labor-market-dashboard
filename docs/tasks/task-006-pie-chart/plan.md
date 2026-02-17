# Implementation Plan: task-006 -- Pie Chart Visualization Components

Generated: 2026-02-17

## Overview

Implement reusable pie chart visualization components for the Labor Market Dashboard using Recharts 2.x. This plan creates 5 source files (1 data constant, 1 utility, 3 components), 5 test files, modifies 4 existing files (3 barrel exports + package.json), and installs 1 new production dependency.

**Architecture Review Conditions incorporated:**
1. Prop `children` renamed to `nodes` in `PieChartPanelProps` (React reserved prop conflict)
2. `react-is` peer dependency override documented in comments
3. All patterns follow Slider.tsx, format.ts, and existing barrel conventions

## File Change Summary

| Action | File | Type |
|--------|------|------|
| MODIFY | `apps/labor-market-dashboard/package.json` | Add recharts dependency |
| CREATE | `apps/labor-market-dashboard/src/data/chartColors.ts` | Color palette constants |
| MODIFY | `apps/labor-market-dashboard/src/data/index.ts` | Barrel export |
| CREATE | `apps/labor-market-dashboard/src/utils/chartDataUtils.ts` | Data transformation utility |
| MODIFY | `apps/labor-market-dashboard/src/utils/index.ts` | Barrel export |
| CREATE | `apps/labor-market-dashboard/src/components/ChartTooltip.tsx` | Custom tooltip component |
| CREATE | `apps/labor-market-dashboard/src/components/ChartLegend.tsx` | Scrollable legend component |
| CREATE | `apps/labor-market-dashboard/src/components/PieChartPanel.tsx` | Main chart wrapper |
| MODIFY | `apps/labor-market-dashboard/src/components/index.ts` | Barrel export |
| CREATE | `apps/labor-market-dashboard/src/__tests__/data/chartColors.test.ts` | Color palette tests |
| CREATE | `apps/labor-market-dashboard/src/__tests__/utils/chartDataUtils.test.ts` | Data transformation tests |
| CREATE | `apps/labor-market-dashboard/src/__tests__/components/ChartTooltip.test.tsx` | Tooltip tests |
| CREATE | `apps/labor-market-dashboard/src/__tests__/components/ChartLegend.test.tsx` | Legend tests |
| CREATE | `apps/labor-market-dashboard/src/__tests__/components/PieChartPanel.test.tsx` | Chart panel tests |

---

## Step 1: Install Recharts Dependency

### File: `apps/labor-market-dashboard/package.json`

**Action:** MODIFY -- add `recharts` to `dependencies`

```json
{
  "name": "@template/labor-market-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "lint": "eslint .",
    "test": "vitest run",
    "clean": "rm -rf dist node_modules .turbo"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@template/config": "workspace:*",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.7.3",
    "vite": "^6.0.0",
    "eslint": "^8.57.0",
    "jsdom": "^25.0.0",
    "vitest": "^3.0.0"
  }
}
```

**Notes:**
- Recharts 2.15.x ships with built-in TypeScript declarations; no `@types/recharts` needed.
- Recharts 2.x has a `react-is@^18.3.1` transitive dependency. With React 19, this may produce a peer warning. This is functionally harmless -- React 19 includes `react-is` internally. If `pnpm install` produces a peer dependency error (not just a warning), add the following override to `package.json` and document it with a comment in the app CLAUDE.md:

```json
"pnpm": {
  "peerDependencyRules": {
    "allowedVersions": {
      "react-is": ">=18"
    }
  }
}
```

**Commands:**
```bash
cd /Users/user/dev/EU && pnpm install
```

**Verification:**
```bash
pnpm build --filter @template/labor-market-dashboard
```

---

## Step 2: Create Color Palette Constants

### File: `apps/labor-market-dashboard/src/data/chartColors.ts` (CREATE)

```typescript
/**
 * Color palette constants for pie chart visualizations.
 *
 * Industry colors are keyed by KVED code for stable mapping across
 * male and female charts. Hex values are derived from Tailwind CSS
 * palette (used directly because Recharts <Cell fill={color}> requires hex).
 */

/**
 * Mapping of KVED industry codes to hex color values.
 * 16 visually distinct colors from Tailwind's extended palette.
 * Same industry always gets the same color across gender charts.
 */
export const INDUSTRY_COLORS: Record<string, string> = {
  G: '#3B82F6',     // blue-500    -- Торгівля
  A: '#22C55E',     // green-500   -- Сільське господарство
  'B-E': '#EF4444', // red-500     -- Промисловість
  O: '#A855F7',     // purple-500  -- Держуправління та оборона
  P: '#F59E0B',     // amber-500   -- Освіта
  Q: '#EC4899',     // pink-500    -- Охорона здоров'я
  H: '#06B6D4',     // cyan-500    -- Транспорт
  F: '#F97316',     // orange-500  -- Будівництво
  M: '#8B5CF6',     // violet-500  -- Професійна діяльність
  J: '#14B8A6',     // teal-500    -- IT та телеком
  S: '#6366F1',     // indigo-500  -- Інші послуги
  N: '#84CC16',     // lime-500    -- Адмін. обслуговування
  I: '#D946EF',     // fuchsia-500 -- Готелі, харчування
  L: '#0EA5E9',     // sky-500     -- Нерухомість
  K: '#F43F5E',     // rose-500    -- Фінанси / страхування
  R: '#FACC15',     // yellow-400  -- Мистецтво, спорт
};

/** Gender colors matching PRD specification. */
export const GENDER_COLORS = {
  male: '#3B82F6',   // blue-500
  female: '#EC4899', // pink-500
} as const;

/** Ghost slice color for free mode when percentages sum to less than 100%. */
export const GHOST_SLICE_COLOR = '#E2E8F0'; // slate-200

/** Overflow indicator stroke color for free mode when percentages exceed 100%. */
export const OVERFLOW_INDICATOR_COLOR = '#FCA5A5'; // red-300

/** Default fallback color when a node has no KVED code or matching color. */
export const DEFAULT_NODE_COLOR = '#94A3B8'; // slate-400
```

### File: `apps/labor-market-dashboard/src/data/index.ts` (MODIFY)

```typescript
export { defaultTree } from './defaultTree';
export { largestRemainder } from './dataHelpers';
export {
  DEFAULT_NODE_COLOR,
  GENDER_COLORS,
  GHOST_SLICE_COLOR,
  INDUSTRY_COLORS,
  OVERFLOW_INDICATOR_COLOR,
} from './chartColors';
```

**Verification:**
```bash
pnpm build --filter @template/labor-market-dashboard
```

---

## Step 3: Create Color Palette Tests

### File: `apps/labor-market-dashboard/src/__tests__/data/chartColors.test.ts` (CREATE)

```typescript
import { describe, it, expect } from 'vitest';

import {
  DEFAULT_NODE_COLOR,
  GENDER_COLORS,
  GHOST_SLICE_COLOR,
  INDUSTRY_COLORS,
  OVERFLOW_INDICATOR_COLOR,
} from '@/data/chartColors';

describe('INDUSTRY_COLORS', () => {
  it('has exactly 16 entries (one per KVED sector)', () => {
    expect(Object.keys(INDUSTRY_COLORS)).toHaveLength(16);
  });

  it('all values are valid hex color strings', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const color of Object.values(INDUSTRY_COLORS)) {
      expect(color).toMatch(hexPattern);
    }
  });

  it('contains all 16 KVED codes from defaultTree', () => {
    const expectedCodes = [
      'G', 'A', 'B-E', 'O', 'P', 'Q', 'H', 'F',
      'M', 'J', 'S', 'N', 'I', 'L', 'K', 'R',
    ];
    for (const code of expectedCodes) {
      expect(INDUSTRY_COLORS).toHaveProperty(code);
    }
  });

  it('has no duplicate colors in the palette', () => {
    const colors = Object.values(INDUSTRY_COLORS);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});

describe('GENDER_COLORS', () => {
  it('defines male and female colors', () => {
    expect(GENDER_COLORS.male).toBe('#3B82F6');
    expect(GENDER_COLORS.female).toBe('#EC4899');
  });
});

describe('Special colors', () => {
  it('defines ghost slice color', () => {
    expect(GHOST_SLICE_COLOR).toBe('#E2E8F0');
  });

  it('defines overflow indicator color', () => {
    expect(OVERFLOW_INDICATOR_COLOR).toBe('#FCA5A5');
  });

  it('defines default node color', () => {
    expect(DEFAULT_NODE_COLOR).toBe('#94A3B8');
  });
});
```

**Verification:**
```bash
pnpm test --filter @template/labor-market-dashboard
```

---

## Step 4: Create Data Transformation Utility

### File: `apps/labor-market-dashboard/src/utils/chartDataUtils.ts` (CREATE)

```typescript
/**
 * Data transformation utilities for Recharts pie chart consumption.
 *
 * Converts TreeNode children into PieDataEntry arrays with color mapping,
 * ghost slice logic for free mode, and subcategory color generation.
 */

import type { BalanceMode, TreeNode } from '@/types';

import { DEFAULT_NODE_COLOR, GHOST_SLICE_COLOR } from '@/data/chartColors';

/** Single data point for Recharts Pie component. */
export interface PieDataEntry {
  /** Display name (node label) */
  name: string;
  /** Percentage value (drives slice size) */
  value: number;
  /** Hex color for the slice */
  color: string;
  /** Absolute value (for tooltip display) */
  absoluteValue: number;
  /** Original node ID */
  nodeId: string;
  /** Whether this entry is a ghost slice (unallocated in free mode) */
  isGhost?: boolean;
}

/**
 * Get the color for a node from the color map.
 * Uses kvedCode if available, falls back to node ID, then to defaultColor.
 *
 * @param node - The tree node to get a color for
 * @param colorMap - Mapping of kvedCode or nodeId to hex color
 * @param defaultColor - Fallback color if no mapping found
 * @returns Hex color string
 */
export function getNodeColor(
  node: TreeNode,
  colorMap: Record<string, string>,
  defaultColor: string = DEFAULT_NODE_COLOR,
): string {
  if (node.kvedCode && node.kvedCode in colorMap) {
    return colorMap[node.kvedCode];
  }
  if (node.id in colorMap) {
    return colorMap[node.id];
  }
  return defaultColor;
}

/**
 * Transform TreeNode children into Recharts-compatible data array.
 *
 * Maps each child to a PieDataEntry using the provided color map.
 * In free mode, appends a ghost slice if percentages sum to less than 100%.
 * When sum exceeds 100% in free mode, Recharts normalizes proportionally
 * (no ghost slice needed).
 *
 * @param nodes - Child TreeNode array to transform
 * @param colorMap - Mapping of kvedCode or nodeId to hex color
 * @param balanceMode - Current balance mode (controls ghost slice)
 * @param defaultColor - Fallback color for unmapped nodes
 * @returns Array of PieDataEntry for Recharts consumption
 */
export function toChartData(
  nodes: TreeNode[],
  colorMap: Record<string, string>,
  balanceMode: BalanceMode,
  defaultColor: string = DEFAULT_NODE_COLOR,
): PieDataEntry[] {
  const entries: PieDataEntry[] = nodes.map((node) => ({
    name: node.label,
    value: node.percentage,
    color: getNodeColor(node, colorMap, defaultColor),
    absoluteValue: node.absoluteValue,
    nodeId: node.id,
  }));

  // In free mode, add ghost slice if percentages sum to less than 100%
  if (balanceMode === 'free') {
    const sum = nodes.reduce((acc, node) => acc + node.percentage, 0);
    const remainder = 100 - sum;

    // Use small epsilon to avoid floating-point ghost slices
    if (remainder > 0.05) {
      entries.push({
        name: 'Нерозподілено',
        value: Math.round(remainder * 10) / 10,
        color: GHOST_SLICE_COLOR,
        absoluteValue: 0,
        nodeId: 'ghost',
        isGhost: true,
      });
    }
  }

  return entries;
}

/**
 * Generate opacity-based color shades for subcategory mini charts.
 *
 * Creates `count` hex color strings from full opacity to 40% opacity
 * of the base color, blended against white (#FFFFFF).
 *
 * @param baseColor - Hex color string (e.g., "#14B8A6")
 * @param count - Number of shades to generate
 * @returns Array of hex color strings
 */
export function generateSubcategoryColors(
  baseColor: string,
  count: number,
): string[] {
  if (count <= 0) return [];
  if (count === 1) return [baseColor];

  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);

  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    // Opacity ranges from 1.0 (first) to 0.4 (last)
    const opacity = 1.0 - (i * 0.6) / (count - 1);

    // Blend with white background
    const blendedR = Math.round(r * opacity + 255 * (1 - opacity));
    const blendedG = Math.round(g * opacity + 255 * (1 - opacity));
    const blendedB = Math.round(b * opacity + 255 * (1 - opacity));

    const hex = `#${blendedR.toString(16).padStart(2, '0')}${blendedG.toString(16).padStart(2, '0')}${blendedB.toString(16).padStart(2, '0')}`;
    colors.push(hex.toUpperCase());
  }

  return colors;
}
```

### File: `apps/labor-market-dashboard/src/utils/index.ts` (MODIFY)

```typescript
export {
  autoBalance,
  canToggleLock,
  getSiblingDeviation,
  normalizeGroup,
  recalcAbsoluteValues,
} from './calculations';

export type { PercentageUpdate } from './calculations';

export {
  generateSubcategoryColors,
  getNodeColor,
  toChartData,
} from './chartDataUtils';

export type { PieDataEntry } from './chartDataUtils';

export { formatAbsoluteValue, formatPercentage } from './format';

export {
  collectSiblingInfo,
  findNodeById,
  findParentById,
  updateChildrenInTree,
  updateNodeInTree,
} from './treeUtils';

export type { SiblingInfo } from './treeUtils';
```

**Pattern note:** Value exports for functions, `export type` for the `PieDataEntry` interface -- follows the established mixed export convention in `utils/index.ts`.

**Verification:**
```bash
pnpm build --filter @template/labor-market-dashboard
```

---

## Step 5: Create Data Transformation Tests

### File: `apps/labor-market-dashboard/src/__tests__/utils/chartDataUtils.test.ts` (CREATE)

```typescript
import { describe, it, expect } from 'vitest';

import { GHOST_SLICE_COLOR, INDUSTRY_COLORS } from '@/data/chartColors';
import { defaultTree } from '@/data/defaultTree';
import type { TreeNode } from '@/types';

import {
  generateSubcategoryColors,
  getNodeColor,
  toChartData,
} from '@/utils/chartDataUtils';

/** Male gender node children (16 industries). */
const maleChildren = defaultTree.children[0].children;

/** Helper: create a minimal TreeNode for testing. */
function makeNode(overrides?: Partial<TreeNode>): TreeNode {
  return {
    id: 'test-node',
    label: 'Test',
    percentage: 25,
    defaultPercentage: 25,
    absoluteValue: 100_000,
    genderSplit: { male: 100, female: 0 },
    isLocked: false,
    children: [],
    ...overrides,
  };
}

// -------------------------------------------------------
// toChartData tests
// -------------------------------------------------------
describe('toChartData', () => {
  it('returns correct number of entries from male industry children', () => {
    const result = toChartData(maleChildren, INDUSTRY_COLORS, 'auto');
    expect(result).toHaveLength(16);
  });

  it('maps node label to name and percentage to value', () => {
    const nodes = [makeNode({ label: 'Торгівля', percentage: 16.8 })];
    const result = toChartData(nodes, {}, 'auto');

    expect(result[0].name).toBe('Торгівля');
    expect(result[0].value).toBe(16.8);
  });

  it('maps absoluteValue and nodeId correctly', () => {
    const nodes = [makeNode({ id: 'male-g', absoluteValue: 1_194_329 })];
    const result = toChartData(nodes, {}, 'auto');

    expect(result[0].absoluteValue).toBe(1_194_329);
    expect(result[0].nodeId).toBe('male-g');
  });

  it('does not append ghost slice in auto mode', () => {
    const nodes = [
      makeNode({ percentage: 60 }),
      makeNode({ id: 'n2', percentage: 30 }),
    ];
    const result = toChartData(nodes, {}, 'auto');

    expect(result).toHaveLength(2);
    expect(result.every((e) => !e.isGhost)).toBe(true);
  });

  it('appends ghost slice in free mode when sum < 100', () => {
    const nodes = [
      makeNode({ percentage: 60 }),
      makeNode({ id: 'n2', percentage: 30 }),
    ];
    const result = toChartData(nodes, {}, 'free');

    expect(result).toHaveLength(3);
    const ghost = result[2];
    expect(ghost.name).toBe('Нерозподілено');
    expect(ghost.value).toBe(10);
    expect(ghost.color).toBe(GHOST_SLICE_COLOR);
    expect(ghost.isGhost).toBe(true);
  });

  it('does not append ghost slice in free mode when sum = 100', () => {
    const nodes = [
      makeNode({ percentage: 60 }),
      makeNode({ id: 'n2', percentage: 40 }),
    ];
    const result = toChartData(nodes, {}, 'free');

    expect(result).toHaveLength(2);
  });

  it('does not append ghost slice in free mode when sum > 100 (overflow)', () => {
    const nodes = [
      makeNode({ percentage: 60 }),
      makeNode({ id: 'n2', percentage: 55 }),
    ];
    const result = toChartData(nodes, {}, 'free');

    // No ghost slice added; Recharts normalizes proportionally
    expect(result).toHaveLength(2);
    expect(result.every((e) => !e.isGhost)).toBe(true);
  });
});

// -------------------------------------------------------
// getNodeColor tests
// -------------------------------------------------------
describe('getNodeColor', () => {
  it('returns color by kvedCode when present in colorMap', () => {
    const node = makeNode({ kvedCode: 'G' });
    const result = getNodeColor(node, INDUSTRY_COLORS);

    expect(result).toBe('#3B82F6');
  });

  it('falls back to node ID when kvedCode is not in colorMap', () => {
    const node = makeNode({ id: 'custom-id', kvedCode: 'UNKNOWN' });
    const colorMap = { 'custom-id': '#FF0000' };
    const result = getNodeColor(node, colorMap);

    expect(result).toBe('#FF0000');
  });

  it('falls back to default color when no mapping found', () => {
    const node = makeNode({ id: 'no-match' });
    const result = getNodeColor(node, {}, '#AABBCC');

    expect(result).toBe('#AABBCC');
  });
});

// -------------------------------------------------------
// generateSubcategoryColors tests
// -------------------------------------------------------
describe('generateSubcategoryColors', () => {
  it('returns correct number of colors', () => {
    const result = generateSubcategoryColors('#14B8A6', 10);
    expect(result).toHaveLength(10);
  });

  it('returns empty array for count 0', () => {
    const result = generateSubcategoryColors('#14B8A6', 0);
    expect(result).toHaveLength(0);
  });

  it('returns the base color for count 1', () => {
    const result = generateSubcategoryColors('#14B8A6', 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('#14B8A6');
  });

  it('first color is the base color (full opacity)', () => {
    const result = generateSubcategoryColors('#14B8A6', 5);
    expect(result[0]).toBe('#14B8A6');
  });

  it('last color is lighter than the first (blended toward white)', () => {
    const result = generateSubcategoryColors('#14B8A6', 5);
    // Last color should be closer to white (higher RGB values)
    const firstR = parseInt(result[0].slice(1, 3), 16);
    const lastR = parseInt(result[4].slice(1, 3), 16);
    expect(lastR).toBeGreaterThan(firstR);
  });

  it('all colors are valid hex strings', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    const result = generateSubcategoryColors('#14B8A6', 10);
    for (const color of result) {
      expect(color).toMatch(hexPattern);
    }
  });
});
```

**Verification:**
```bash
pnpm test --filter @template/labor-market-dashboard
```

---

## Step 6: Create ChartTooltip Component

### File: `apps/labor-market-dashboard/src/components/ChartTooltip.tsx` (CREATE)

```tsx
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

/**
 * Payload item from Recharts Tooltip.
 * Recharts passes this structure when hovering a pie slice.
 */
interface RechartsPayloadItem {
  /** Slice name from data entry */
  name: string;
  /** Slice value (percentage) from data entry */
  value: number;
  /** Full data entry payload including custom fields */
  payload: {
    name: string;
    value: number;
    absoluteValue: number;
    color: string;
    isGhost?: boolean;
  };
}

/** Props for ChartTooltip (passed by Recharts Tooltip content prop). */
export interface ChartTooltipProps {
  /** Whether tooltip is currently active (from Recharts) */
  active?: boolean;
  /** Payload array from Recharts (contains data point info) */
  payload?: RechartsPayloadItem[];
}

/**
 * Custom tooltip content for pie chart slices.
 *
 * Displays the slice label, formatted percentage, and formatted absolute value
 * using the established Ukrainian formatting utilities.
 *
 * Returns null when inactive or empty to prevent rendering empty tooltip boxes.
 */
export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const { name, value } = item;
  const { absoluteValue, color, isGhost } = item.payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-700">{name}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-900">
          {formatPercentage(value)}
        </span>
        {!isGhost && (
          <span className="text-xs text-slate-500">
            {formatAbsoluteValue(absoluteValue)}
          </span>
        )}
      </div>
    </div>
  );
}
```

**Notes:**
- Follows Slider pattern: named export, JSDoc, Tailwind-only styling.
- Returns null for inactive/empty states (Recharts expects this pattern).
- Reuses `formatAbsoluteValue` and `formatPercentage` from `@/utils/format`.
- Ghost slice tooltip omits the absolute value (always 0, not meaningful).
- Under 200 lines (well under limit at ~60 lines).

**Verification:**
```bash
pnpm build --filter @template/labor-market-dashboard && pnpm lint --filter @template/labor-market-dashboard
```

---

## Step 7: Create ChartTooltip Tests

### File: `apps/labor-market-dashboard/src/__tests__/components/ChartTooltip.test.tsx` (CREATE)

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChartTooltip } from '@/components/ChartTooltip';
import type { ChartTooltipProps } from '@/components/ChartTooltip';

/** Create default props for ChartTooltip. */
function makeProps(overrides?: Partial<ChartTooltipProps>): ChartTooltipProps {
  return {
    active: true,
    payload: [
      {
        name: 'Торгівля',
        value: 16.8,
        payload: {
          name: 'Торгівля',
          value: 16.8,
          absoluteValue: 1_194_329,
          color: '#3B82F6',
        },
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('ChartTooltip', () => {
  it('renders label, percentage, and absolute value when active', () => {
    render(<ChartTooltip {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
    expect(screen.getByText('16.8%')).toBeInTheDocument();
    expect(screen.getByText('1 194 тис.')).toBeInTheDocument();
  });

  it('returns null when not active', () => {
    const { container } = render(
      <ChartTooltip {...makeProps({ active: false })} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when payload is empty', () => {
    const { container } = render(
      <ChartTooltip {...makeProps({ payload: [] })} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when payload is undefined', () => {
    const { container } = render(
      <ChartTooltip {...makeProps({ payload: undefined })} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('hides absolute value for ghost slice entries', () => {
    const ghostProps = makeProps({
      payload: [
        {
          name: 'Нерозподілено',
          value: 10.0,
          payload: {
            name: 'Нерозподілено',
            value: 10.0,
            absoluteValue: 0,
            color: '#E2E8F0',
            isGhost: true,
          },
        },
      ],
    });
    render(<ChartTooltip {...ghostProps} />);

    expect(screen.getByText('Нерозподілено')).toBeInTheDocument();
    expect(screen.getByText('10.0%')).toBeInTheDocument();
    // Absolute value should not be rendered for ghost slices
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
```

**Verification:**
```bash
pnpm test --filter @template/labor-market-dashboard
```

---

## Step 8: Create ChartLegend Component

### File: `apps/labor-market-dashboard/src/components/ChartLegend.tsx` (CREATE)

```tsx
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
```

**Notes:**
- Semantic `<ul>/<li>` markup for screen readers.
- Color swatch uses `aria-hidden="true"` (label text carries the information).
- `maxHeight` with `overflow-y-auto` enables scrolling when 16 items overflow.
- Inline `style` for `maxHeight` is acceptable -- it is a dynamic numeric prop, not a design concern. Tailwind does not support arbitrary dynamic pixel values in class names without JIT config.
- Under 200 lines (approximately 40 lines).

**Verification:**
```bash
pnpm build --filter @template/labor-market-dashboard && pnpm lint --filter @template/labor-market-dashboard
```

---

## Step 9: Create ChartLegend Tests

### File: `apps/labor-market-dashboard/src/__tests__/components/ChartLegend.test.tsx` (CREATE)

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChartLegend } from '@/components/ChartLegend';
import type { ChartLegendProps } from '@/components/ChartLegend';

/** Sample legend items for testing. */
const sampleItems = [
  { label: 'Торгівля', color: '#3B82F6' },
  { label: 'Сільське господарство', color: '#22C55E' },
  { label: 'Промисловість', color: '#EF4444' },
];

/** Create default props for ChartLegend. */
function makeProps(overrides?: Partial<ChartLegendProps>): ChartLegendProps {
  return {
    items: sampleItems,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('ChartLegend', () => {
  it('renders correct number of list items', () => {
    render(<ChartLegend {...makeProps()} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('displays each item label', () => {
    render(<ChartLegend {...makeProps()} />);

    expect(screen.getByText('Торгівля')).toBeInTheDocument();
    expect(screen.getByText('Сільське господарство')).toBeInTheDocument();
    expect(screen.getByText('Промисловість')).toBeInTheDocument();
  });

  it('uses semantic list markup (ul/li)', () => {
    render(<ChartLegend {...makeProps()} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('applies maxHeight style to scrollable container', () => {
    const { container } = render(
      <ChartLegend {...makeProps({ maxHeight: 200 })} />,
    );

    const scrollContainer = container.firstElementChild;
    expect(scrollContainer).toHaveStyle({ maxHeight: '200px' });
  });

  it('applies default maxHeight of 300px when not specified', () => {
    const { container } = render(<ChartLegend {...makeProps()} />);

    const scrollContainer = container.firstElementChild;
    expect(scrollContainer).toHaveStyle({ maxHeight: '300px' });
  });
});
```

**Verification:**
```bash
pnpm test --filter @template/labor-market-dashboard
```

---

## Step 10: Create PieChartPanel Component

### File: `apps/labor-market-dashboard/src/components/PieChartPanel.tsx` (CREATE)

**IMPORTANT: The TL design used `children` as the prop name. Per arch-review condition #1, this is renamed to `nodes` to avoid conflict with React's reserved `children` prop.**

```tsx
import { memo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { OVERFLOW_INDICATOR_COLOR } from '@/data/chartColors';
import type { BalanceMode, TreeNode } from '@/types';
import { toChartData } from '@/utils/chartDataUtils';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';

/** Variant controlling chart size and feature set. */
type ChartSize = 'standard' | 'mini';

/** Props for PieChartPanel. */
export interface PieChartPanelProps {
  /**
   * Child tree nodes to visualize as pie slices.
   * Named `nodes` instead of `children` to avoid conflict with React's reserved prop.
   */
  nodes: TreeNode[];
  /** Map of node ID (or kvedCode) to hex color string */
  colorMap: Record<string, string>;
  /** Accessible label for the chart (e.g., "Male industry distribution") */
  ariaLabel: string;
  /** Chart size variant. 'standard' = ~300px, 'mini' = ~200px */
  size?: ChartSize;
  /** Current balance mode -- controls ghost slice visibility */
  balanceMode: BalanceMode;
  /** Whether to show the legend. Default: true */
  showLegend?: boolean;
}

/** Chart dimensions by size variant. */
const SIZE_CONFIG: Record<ChartSize, { height: number; outerRadius: number }> =
  {
    standard: { height: 300, outerRadius: 120 },
    mini: { height: 200, outerRadius: 80 },
  };

/** Animation duration in ms (resolved Q7: 300ms standard UI transition). */
const ANIMATION_DURATION = 300;

/**
 * Pie chart visualization panel for tree node data.
 *
 * Read-only component: receives TreeNode data as props, renders a Recharts
 * pie chart with custom tooltip and optional legend. Does not manage data
 * state or dispatch actions.
 *
 * Wrapped in React.memo to prevent re-renders when parent re-renders
 * but chart data has not changed.
 */
export const PieChartPanel = memo(function PieChartPanel({
  nodes,
  colorMap,
  ariaLabel,
  size = 'standard',
  balanceMode,
  showLegend = true,
}: PieChartPanelProps) {
  const data = toChartData(nodes, colorMap, balanceMode);
  const config = SIZE_CONFIG[size];

  // Calculate sum for overflow detection in free mode
  const sum = nodes.reduce((acc, node) => acc + node.percentage, 0);
  const isOverflow = balanceMode === 'free' && sum > 100.05;

  // Prepare legend items (exclude ghost slices)
  const legendItems = data
    .filter((entry) => !entry.isGhost)
    .map((entry) => ({
      label: entry.name,
      color: entry.color,
    }));

  return (
    <figure role="img" aria-label={ariaLabel}>
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        <div className="relative" style={{ minHeight: `${config.height}px` }}>
          <ResponsiveContainer width="100%" height={config.height}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={config.outerRadius}
                isAnimationActive={true}
                animationDuration={ANIMATION_DURATION}
                animationEasing="ease-out"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.nodeId}
                    fill={entry.color}
                    stroke={
                      entry.isGhost && isOverflow
                        ? OVERFLOW_INDICATOR_COLOR
                        : '#FFFFFF'
                    }
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Overflow indicator badge (free mode, sum > 100%) */}
          {isOverflow && (
            <div className="absolute right-0 top-0 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              {formatPercentage(Math.round(sum * 10) / 10)}
            </div>
          )}
        </div>

        {/* Legend (outside SVG, positioned via flex) */}
        {showLegend && <ChartLegend items={legendItems} />}
      </div>

      {/* Screen-reader-only data table fallback */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Категорія</th>
            <th scope="col">Відсоток</th>
            <th scope="col">Абсолютне значення</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter((entry) => !entry.isGhost)
            .map((entry) => (
              <tr key={entry.nodeId}>
                <td>{entry.name}</td>
                <td>{formatPercentage(entry.value)}</td>
                <td>{formatAbsoluteValue(entry.absoluteValue)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
});
```

**Notes:**
- **`nodes` instead of `children`** -- per arch-review condition #1.
- `React.memo` wraps the component via `memo(function PieChartPanel(...))` named function pattern for devtools clarity.
- Responsive layout: `flex-col` on mobile, `flex-row` on `md:` breakpoint.
- `ResponsiveContainer` adapts width to parent; height is fixed by size variant.
- `sr-only` data table provides accessible fallback (Tailwind v4 utility class).
- Ghost slices are excluded from the legend and the screen-reader table.
- Overflow badge shown only in free mode when sum > 100%.
- Under 200 lines (approximately 130 lines).
- No internal data state, no dispatch -- read-only visualization.

**Verification:**
```bash
pnpm build --filter @template/labor-market-dashboard && pnpm lint --filter @template/labor-market-dashboard
```

---

## Step 10b: Update Components Barrel Export

### File: `apps/labor-market-dashboard/src/components/index.ts` (MODIFY)

```typescript
export { ChartLegend } from './ChartLegend';
export type { ChartLegendProps, LegendItem } from './ChartLegend';

export { ChartTooltip } from './ChartTooltip';
export type { ChartTooltipProps } from './ChartTooltip';

export { PieChartPanel } from './PieChartPanel';
export type { PieChartPanelProps } from './PieChartPanel';

export { Slider } from './Slider';
export type { SliderProps } from './Slider';
```

**Pattern note:** Value exports for components, `export type` for interfaces. Alphabetical order by component name.

---

## Step 11: Create PieChartPanel Tests

### File: `apps/labor-market-dashboard/src/__tests__/components/PieChartPanel.test.tsx` (CREATE)

**IMPORTANT NOTE on testing Recharts in jsdom:**
Recharts renders SVG using `ResponsiveContainer` which relies on `ResizeObserver` and DOM measurements. In jsdom, `ResizeObserver` is not available and container dimensions are 0x0, which means `ResponsiveContainer` will not render the chart SVG. The tests below focus on the non-SVG parts of the component (the `<figure>` wrapper, ARIA attributes, data table, legend, overflow indicator) which render correctly in jsdom.

For the SVG chart itself, two approaches:
1. **Mock `ResizeObserver`**: Add a mock in the test file to allow `ResponsiveContainer` to function.
2. **Test around SVG**: Focus tests on the wrapper DOM structure that does not depend on Recharts SVG rendering.

This plan uses approach 1 (mock `ResizeObserver`) for maximum coverage.

```tsx
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PieChartPanel } from '@/components/PieChartPanel';
import type { PieChartPanelProps } from '@/components/PieChartPanel';
import { INDUSTRY_COLORS } from '@/data/chartColors';
import type { TreeNode } from '@/types';

/**
 * Mock ResizeObserver for jsdom (Recharts ResponsiveContainer requires it).
 * This mock triggers the callback immediately with zero-dimension entries,
 * which is sufficient for our DOM-structure-focused tests.
 */
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      // Trigger callback with minimal entry so ResponsiveContainer renders
      this.callback(
        [
          {
            target,
            contentRect: {
              width: 400,
              height: 300,
              top: 0,
              left: 0,
              bottom: 300,
              right: 400,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        this,
      );
    }

    unobserve() {}
    disconnect() {}
  };
});

/** Helper: create sample industry nodes for testing. */
function makeSampleNodes(count: number): TreeNode[] {
  const kvedCodes = ['G', 'A', 'B-E', 'O', 'P', 'Q', 'H', 'F', 'M', 'J', 'S', 'N', 'I', 'L', 'K', 'R'];
  const labels = [
    'Торгівля', 'Сільське господарство', 'Промисловість', 'Держуправління та оборона',
    'Освіта', "Охорона здоров'я", 'Транспорт', 'Будівництво',
    'Професійна діяльність', 'IT та телеком', 'Інші послуги', 'Адмін. обслуговування',
    'Готелі, харчування', 'Нерухомість', 'Фінанси / страхування', 'Мистецтво, спорт',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    label: labels[i % labels.length],
    kvedCode: kvedCodes[i % kvedCodes.length],
    percentage: Math.round((100 / count) * 10) / 10,
    defaultPercentage: Math.round((100 / count) * 10) / 10,
    absoluteValue: Math.round(7_109_100 / count),
    genderSplit: { male: 100, female: 0 },
    isLocked: false,
    children: [],
  }));
}

/** Create default props for PieChartPanel. */
function makeProps(overrides?: Partial<PieChartPanelProps>): PieChartPanelProps {
  return {
    nodes: makeSampleNodes(4),
    colorMap: INDUSTRY_COLORS,
    ariaLabel: 'Male industry distribution',
    balanceMode: 'auto',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// -------------------------------------------------------
// Accessibility / structure tests
// -------------------------------------------------------
describe('PieChartPanel accessibility', () => {
  it('renders a figure with role="img" and aria-label', () => {
    render(<PieChartPanel {...makeProps()} />);

    const figure = screen.getByRole('img', {
      name: 'Male industry distribution',
    });
    expect(figure).toBeInTheDocument();
  });

  it('renders screen-reader data table with correct row count', () => {
    const nodes = makeSampleNodes(4);
    render(<PieChartPanel {...makeProps({ nodes })} />);

    // The table should have 4 data rows (one per node)
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // +1 for header row
    expect(rows).toHaveLength(5);
  });

  it('data table contains formatted values', () => {
    const nodes = [
      {
        id: 'test-g',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 16.8,
        defaultPercentage: 16.8,
        absoluteValue: 1_194_329,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
    ];
    render(<PieChartPanel {...makeProps({ nodes })} />);

    const table = screen.getByRole('table');
    expect(within(table).getByText('Торгівля')).toBeInTheDocument();
    expect(within(table).getByText('16.8%')).toBeInTheDocument();
    expect(within(table).getByText('1 194 тис.')).toBeInTheDocument();
  });
});

// -------------------------------------------------------
// Legend tests
// -------------------------------------------------------
describe('PieChartPanel legend', () => {
  it('renders legend when showLegend is true (default)', () => {
    render(<PieChartPanel {...makeProps()} />);

    // Legend renders list items
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('hides legend when showLegend is false', () => {
    render(<PieChartPanel {...makeProps({ showLegend: false })} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('legend excludes ghost slices', () => {
    const nodes = [
      {
        id: 'node-1',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 60,
        defaultPercentage: 60,
        absoluteValue: 4_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
      {
        id: 'node-2',
        label: 'Освіта',
        kvedCode: 'P',
        percentage: 30,
        defaultPercentage: 30,
        absoluteValue: 2_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
    ];

    render(
      <PieChartPanel {...makeProps({ nodes, balanceMode: 'free' })} />,
    );

    const listItems = screen.getAllByRole('listitem');
    // Should show 2 items (Торгівля + Освіта), NOT the ghost "Нерозподілено"
    expect(listItems).toHaveLength(2);
  });
});

// -------------------------------------------------------
// Free mode / ghost slice tests
// -------------------------------------------------------
describe('PieChartPanel free mode', () => {
  it('data table excludes ghost slice entries', () => {
    const nodes = [
      {
        id: 'node-1',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 80,
        defaultPercentage: 80,
        absoluteValue: 5_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
    ];

    render(
      <PieChartPanel {...makeProps({ nodes, balanceMode: 'free' })} />,
    );

    const table = screen.getByRole('table');
    const dataRows = within(table).getAllByRole('row');
    // 1 header + 1 data row (ghost excluded from table)
    expect(dataRows).toHaveLength(2);
  });

  it('shows overflow indicator when sum > 100% in free mode', () => {
    const nodes = [
      {
        id: 'node-1',
        label: 'Торгівля',
        kvedCode: 'G',
        percentage: 60,
        defaultPercentage: 60,
        absoluteValue: 4_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
      {
        id: 'node-2',
        label: 'Освіта',
        kvedCode: 'P',
        percentage: 55,
        defaultPercentage: 55,
        absoluteValue: 3_500_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [] as TreeNode[],
      },
    ];

    render(
      <PieChartPanel {...makeProps({ nodes, balanceMode: 'free' })} />,
    );

    // Should show overflow badge with total percentage
    expect(screen.getByText('115.0%')).toBeInTheDocument();
  });

  it('does not show overflow indicator in auto mode', () => {
    render(<PieChartPanel {...makeProps({ balanceMode: 'auto' })} />);

    // No overflow badge
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('115.0%');
  });
});

// -------------------------------------------------------
// Size variant tests
// -------------------------------------------------------
describe('PieChartPanel size variants', () => {
  it('renders with standard size by default', () => {
    const { container } = render(<PieChartPanel {...makeProps()} />);

    // Check that the chart container has the standard height
    const chartContainer = container.querySelector('[style*="min-height"]');
    expect(chartContainer).toHaveStyle({ minHeight: '300px' });
  });

  it('renders with mini size when specified', () => {
    const { container } = render(
      <PieChartPanel {...makeProps({ size: 'mini' })} />,
    );

    const chartContainer = container.querySelector('[style*="min-height"]');
    expect(chartContainer).toHaveStyle({ minHeight: '200px' });
  });
});
```

**Notes:**
- `ResizeObserver` mock is required for Recharts `ResponsiveContainer` in jsdom.
- Tests focus on DOM structure (figure, ARIA, data table, legend) not SVG geometry.
- `makeProps()` factory with `Partial<Props>` overrides follows Slider test pattern.
- `afterEach(cleanup)` for explicit cleanup (globals: false).
- Vitest v3 import style used throughout.

**Verification:**
```bash
pnpm test --filter @template/labor-market-dashboard
```

---

## Step 12: Final Verification

Run the complete verification suite:

```bash
# Type-check and build
pnpm build --filter @template/labor-market-dashboard

# Lint
pnpm lint --filter @template/labor-market-dashboard

# All tests
pnpm test --filter @template/labor-market-dashboard
```

### Checklist

- [ ] No `any` types in any new file
- [ ] `.tsx` extension only for files with JSX (ChartTooltip, ChartLegend, PieChartPanel, test files with JSX)
- [ ] `.ts` extension for pure data/logic files (chartColors.ts, chartDataUtils.ts, chartColors.test.ts, chartDataUtils.test.ts)
- [ ] All components under 200 lines
- [ ] Barrel exports updated in data/index.ts, utils/index.ts, components/index.ts
- [ ] `nodes` prop name used (not `children`) in PieChartPanel -- arch-review condition #1
- [ ] `react-is` peer dependency documented if override was needed -- arch-review condition #3
- [ ] All tests pass
- [ ] Build succeeds

---

## Patterns Reference

### Conventions Followed from Existing Codebase

| Convention | Source | Applied In |
|-----------|--------|-----------|
| Named exports, no default exports | Slider.tsx | All new components |
| JSDoc on all exports and interfaces | tree.ts, format.ts | All new files |
| `makeProps()` factory in tests | Slider.test.tsx | All component tests |
| `afterEach(cleanup)` | Slider.test.tsx | All component tests |
| `vi.fn<(args) => void>()` vitest v3 syntax | Slider.test.tsx | N/A (no callbacks in read-only charts) |
| Tailwind-only styling | Slider.tsx | All new components |
| Value exports for functions, `export type` for interfaces | utils/index.ts | utils/index.ts, components/index.ts |
| `@` path alias for imports | Slider.tsx | All new files |
| Explicit vitest imports (globals: false) | format.test.ts | All new test files |
| Single-file components (not directory-based) | Slider.tsx | All new components |

### Key Deviations from TL Design (Arch-Review Mandated)

1. **`PieChartPanelProps.children` renamed to `nodes`**: The TL design used `children: TreeNode[]` which conflicts with React's reserved `children` prop. Changed to `nodes` per arch-review condition #1. This applies to the props interface, the component signature, and all test files.

2. **No Recharts `@types/recharts`**: Confirmed not needed (Recharts 2.x ships TypeScript declarations).

3. **`react-is` peer override**: May be needed depending on `pnpm install` behavior. If override is added, it will be documented in the app CLAUDE.md per arch-review condition #3.

---

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
