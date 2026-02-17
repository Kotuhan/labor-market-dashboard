# Implementation Plan: task-003 -- Create Ukraine Labor Market Default Data

Generated: 2026-02-17

## Overview

Create static default data tree for the Labor Market Dashboard. Five files to create, zero files to modify. All data is pre-computed below -- the implementer copies hardcoded literal values, no runtime calculation.

**Total nodes**: 55 (1 root + 2 gender + 32 industry + 20 IT subcategory)

---

## Pre-Computed Data Reference

### Constants

| Constant | Value |
|---|---|
| Total employed | 13,500,000 |
| Root male % | 52.66 |
| Root female % | 47.34 |
| Male absolute | 7,109,100 |
| Female absolute | 6,390,900 |

### Normalization (PRD 100.2% -> 100.0% via largest-remainder, 1 decimal)

| # | Industry | PRD % | Normalized % | M/F Split | KVED |
|---|---|---|---|---|---|
| 1 | Торгівля | 22.2 | 22.1 | 40/60 | G |
| 2 | Сільське господарство | 17.5 | 17.4 | 63/37 | A |
| 3 | Промисловість | 14.3 | 14.3 | 70/30 | B-E |
| 4 | Держуправління та оборона | 9.4 | 9.4 | 60/40 | O |
| 5 | Освіта | 7.8 | 7.8 | 20/80 | P |
| 6 | Охорона здоров'я | 5.8 | 5.8 | 20/80 | Q |
| 7 | Транспорт | 5.8 | 5.8 | 80/20 | H |
| 8 | Будівництво | 3.5 | 3.5 | 90/10 | F |
| 9 | Професійна діяльність | 2.4 | 2.4 | 45/55 | M |
| 10 | IT та телеком | 2.2 | 2.2 | 74/26 | J |
| 11 | Інші послуги | 2.1 | 2.1 | 35/65 | S |
| 12 | Адмін. обслуговування | 1.9 | 1.9 | 55/45 | N |
| 13 | Готелі, харчування | 1.8 | 1.8 | 35/65 | I |
| 14 | Нерухомість | 1.3 | 1.3 | 55/45 | L |
| 15 | Фінанси / страхування | 1.2 | 1.2 | 30/70 | K |
| 16 | Мистецтво, спорт | 1.0 | 1.0 | 50/50 | R |
| | **SUM** | **100.2** | **100.0** | | |

### Male Industry Nodes (share of male parent, abs = round(7,109,100 * pct / 100))

| ID | Label | KVED | pct | abs |
|---|---|---|---|---|
| male-g | Торгівля | G | 16.8 | 1,194,329 |
| male-a | Сільське господарство | A | 20.8 | 1,478,693 |
| male-b-e | Промисловість | B-E | 19.0 | 1,350,729 |
| male-o | Держуправління та оборона | O | 10.7 | 760,674 |
| male-p | Освіта | P | 3.0 | 213,273 |
| male-q | Охорона здоров'я | Q | 2.2 | 156,400 |
| male-h | Транспорт | H | 8.8 | 625,601 |
| male-f | Будівництво | F | 6.0 | 426,546 |
| male-m | Професійна діяльність | M | 2.0 | 142,182 |
| male-j | IT та телеком | J | 3.1 | 220,382 |
| male-s | Інші послуги | S | 1.4 | 99,527 |
| male-n | Адмін. обслуговування | N | 2.0 | 142,182 |
| male-i | Готелі, харчування | I | 1.2 | 85,309 |
| male-l | Нерухомість | L | 1.4 | 99,527 |
| male-k | Фінанси / страхування | K | 0.7 | 49,764 |
| male-r | Мистецтво, спорт | R | 0.9 | 63,982 |
| | **SUM** | | **100.0** | |

### Female Industry Nodes (share of female parent, abs = round(6,390,900 * pct / 100))

| ID | Label | KVED | pct | abs |
|---|---|---|---|---|
| female-g | Торгівля | G | 28.0 | 1,789,452 |
| female-a | Сільське господарство | A | 13.6 | 869,162 |
| female-b-e | Промисловість | B-E | 9.1 | 581,572 |
| female-o | Держуправління та оборона | O | 7.9 | 504,881 |
| female-p | Освіта | P | 13.2 | 843,599 |
| female-q | Охорона здоров'я | Q | 9.8 | 626,308 |
| female-h | Транспорт | H | 2.4 | 153,382 |
| female-f | Будівництво | F | 0.7 | 44,736 |
| female-m | Професійна діяльність | M | 2.8 | 178,945 |
| female-j | IT та телеком | J | 1.2 | 76,691 |
| female-s | Інші послуги | S | 2.9 | 185,336 |
| female-n | Адмін. обслуговування | N | 1.8 | 115,036 |
| female-i | Готелі, харчування | I | 2.5 | 159,773 |
| female-l | Нерухомість | L | 1.2 | 76,691 |
| female-k | Фінанси / страхування | K | 1.8 | 115,036 |
| female-r | Мистецтво, спорт | R | 1.1 | 70,300 |
| | **SUM** | | **100.0** | |

### Male IT Subcategories (share of male-j, abs = round(220,382 * pct / 100))

| ID | Label | pct | abs |
|---|---|---|---|
| male-j-software-dev | Розробка ПЗ | 59.6 | 131,348 |
| male-j-qa | QA / Тестування | 14.7 | 32,396 |
| male-j-pm | PM / Product | 6.1 | 13,443 |
| male-j-hr | HR / Рекрутинг | 0.5 | 1,102 |
| male-j-devops | DevOps / SRE | 4.9 | 10,799 |
| male-j-analytics | Аналітики | 2.8 | 6,171 |
| male-j-design | UI/UX Дизайн | 2.8 | 6,171 |
| male-j-data-ml | Data / ML / AI | 2.3 | 5,069 |
| male-j-marketing | Маркетинг | 0.9 | 1,983 |
| male-j-other | Інші ролі | 5.4 | 11,901 |
| | **SUM** | **100.0** | |

### Female IT Subcategories (share of female-j, abs = round(76,691 * pct / 100))

| ID | Label | pct | abs |
|---|---|---|---|
| female-j-software-dev | Розробка ПЗ | 15.0 | 11,504 |
| female-j-qa | QA / Тестування | 22.8 | 17,486 |
| female-j-pm | PM / Product | 9.2 | 7,056 |
| female-j-hr | HR / Рекрутинг | 16.3 | 12,501 |
| female-j-devops | DevOps / SRE | 1.7 | 1,304 |
| female-j-analytics | Аналітики | 7.1 | 5,445 |
| female-j-design | UI/UX Дизайн | 7.1 | 5,445 |
| female-j-data-ml | Data / ML / AI | 4.9 | 3,758 |
| female-j-marketing | Маркетинг | 4.8 | 3,681 |
| female-j-other | Інші ролі | 11.1 | 8,513 |
| | **SUM** | **100.0** | |

### Gender Split Rules

| Scope | genderSplit |
|---|---|
| Root node | `{ male: 52.66, female: 47.34 }` |
| `gender-male` node | `{ male: 100, female: 0 }` |
| `gender-female` node | `{ male: 0, female: 100 }` |
| All nodes under `gender-male` (industries + IT subs) | `{ male: 100, female: 0 }` |
| All nodes under `gender-female` (industries + IT subs) | `{ male: 0, female: 100 }` |

---

## Files to Create

| # | File Path | Description |
|---|---|---|
| 1 | `apps/labor-market-dashboard/src/data/dataHelpers.ts` | `largestRemainder()` utility function |
| 2 | `apps/labor-market-dashboard/src/data/defaultTree.ts` | Complete `TreeNode` tree constant |
| 3 | `apps/labor-market-dashboard/src/data/index.ts` | Barrel re-exports |
| 4 | `apps/labor-market-dashboard/src/__tests__/data/dataHelpers.test.ts` | Helper function tests |
| 5 | `apps/labor-market-dashboard/src/__tests__/data/defaultTree.test.ts` | Default tree tests (7 groups) |

**Files to modify**: None.

---

## Step 1: Create `src/data/dataHelpers.ts`

### Purpose

Export `largestRemainder` function for rounding arrays of numbers so they sum to a target value. Used for pre-computation and exported for future auto-balance logic (task-004).

### Code

```typescript
/**
 * Rounds an array of numeric values to the specified number of decimal places
 * while ensuring the rounded values sum to exactly the target value.
 *
 * Uses the largest-remainder method (Hamilton's method):
 * 1. Floor all values to the desired precision
 * 2. Distribute the remaining units to items with the largest fractional remainders
 *
 * @param values - Array of exact numeric values to round
 * @param target - The desired sum of the rounded values
 * @param decimals - Number of decimal places for rounding (0 = integers)
 * @returns Array of rounded values that sum to exactly `target`
 *
 * @example
 * largestRemainder([33.333, 33.333, 33.333], 100, 1)
 * // => [33.4, 33.3, 33.3]  (sum = 100.0)
 */
export function largestRemainder(
  values: readonly number[],
  target: number,
  decimals: number,
): number[] {
  const factor = Math.pow(10, decimals);
  const targetScaled = Math.round(target * factor);

  const scaled = values.map((v) => v * factor);
  const floored = scaled.map((v) => Math.floor(v));
  const remainders = scaled.map((v, i) => v - floored[i]);

  const currentSum = floored.reduce((sum, v) => sum + v, 0);
  const unitsToDistribute = targetScaled - currentSum;

  // Sort indices by remainder descending; break ties by larger original value
  const indices = values.map((_, i) => i);
  indices.sort((a, b) => {
    const diff = remainders[b] - remainders[a];
    if (Math.abs(diff) > 1e-12) return diff;
    return values[b] - values[a];
  });

  for (let k = 0; k < unitsToDistribute; k++) {
    floored[indices[k]] += 1;
  }

  return floored.map((v) => v / factor);
}
```

### Key Patterns

- Named export, no default export
- `readonly number[]` input parameter (does not mutate)
- JSDoc with `@param`, `@returns`, `@example`
- `.ts` extension (no JSX)
- Pure function, no side effects

---

## Step 2: Create `src/data/defaultTree.ts`

### Purpose

Export `defaultTree: TreeNode` constant with all 55 nodes pre-populated with hardcoded literal values.

### Code Structure

```typescript
import type { TreeNode } from '@/types';

/**
 * Default labor market tree for Ukraine.
 *
 * Data source: PRD (normalized from 100.2% to 100.0%).
 * Gender split derived from weighted industry data: 52.66% male / 47.34% female.
 *
 * Tree structure:
 * - Level 0: Root (Зайняте населення) -- 13,500,000
 * - Level 1: Gender (Чоловіки / Жінки)
 * - Level 2: 16 KVED industries per gender (32 total)
 * - Level 3: 10 IT subcategories per gender (20 total)
 *
 * Total nodes: 55
 */
export const defaultTree: TreeNode = {
  id: 'root',
  label: 'Зайняте населення',
  percentage: 100,
  defaultPercentage: 100,
  absoluteValue: 13_500_000,
  genderSplit: { male: 52.66, female: 47.34 },
  isLocked: false,
  children: [
    {
      id: 'gender-male',
      label: 'Чоловіки',
      percentage: 52.66,
      defaultPercentage: 52.66,
      absoluteValue: 7_109_100,
      genderSplit: { male: 100, female: 0 },
      isLocked: false,
      children: [
        // ... 16 male industry nodes (see data tables above)
      ],
    },
    {
      id: 'gender-female',
      label: 'Жінки',
      percentage: 47.34,
      defaultPercentage: 47.34,
      absoluteValue: 6_390_900,
      genderSplit: { male: 0, female: 100 },
      isLocked: false,
      children: [
        // ... 16 female industry nodes (see data tables above)
      ],
    },
  ],
};
```

### Complete Node Data (implementer copies these literal values)

**Root node:**
```
id: 'root'
label: 'Зайняте населення'
percentage: 100
defaultPercentage: 100
absoluteValue: 13_500_000
genderSplit: { male: 52.66, female: 47.34 }
isLocked: false
```

**Gender-male node:**
```
id: 'gender-male'
label: 'Чоловіки'
percentage: 52.66
defaultPercentage: 52.66
absoluteValue: 7_109_100
genderSplit: { male: 100, female: 0 }
isLocked: false
```

**Gender-female node:**
```
id: 'gender-female'
label: 'Жінки'
percentage: 47.34
defaultPercentage: 47.34
absoluteValue: 6_390_900
genderSplit: { male: 0, female: 100 }
isLocked: false
```

**Male industry nodes** (all have `genderSplit: { male: 100, female: 0 }`, `isLocked: false`, `defaultPercentage === percentage`):

| id | label | kvedCode | percentage | absoluteValue | children |
|---|---|---|---|---|---|
| `'male-g'` | `'Торгівля'` | `'G'` | `16.8` | `1_194_329` | `[]` |
| `'male-a'` | `'Сільське господарство'` | `'A'` | `20.8` | `1_478_693` | `[]` |
| `'male-b-e'` | `'Промисловість'` | `'B-E'` | `19.0` | `1_350_729` | `[]` |
| `'male-o'` | `'Держуправління та оборона'` | `'O'` | `10.7` | `760_674` | `[]` |
| `'male-p'` | `'Освіта'` | `'P'` | `3.0` | `213_273` | `[]` |
| `'male-q'` | `'Охорона здоров\'я'` | `'Q'` | `2.2` | `156_400` | `[]` |
| `'male-h'` | `'Транспорт'` | `'H'` | `8.8` | `625_601` | `[]` |
| `'male-f'` | `'Будівництво'` | `'F'` | `6.0` | `426_546` | `[]` |
| `'male-m'` | `'Професійна діяльність'` | `'M'` | `2.0` | `142_182` | `[]` |
| `'male-j'` | `'IT та телеком'` | `'J'` | `3.1` | `220_382` | `[...10 subs]` |
| `'male-s'` | `'Інші послуги'` | `'S'` | `1.4` | `99_527` | `[]` |
| `'male-n'` | `'Адмін. обслуговування'` | `'N'` | `2.0` | `142_182` | `[]` |
| `'male-i'` | `'Готелі, харчування'` | `'I'` | `1.2` | `85_309` | `[]` |
| `'male-l'` | `'Нерухомість'` | `'L'` | `1.4` | `99_527` | `[]` |
| `'male-k'` | `'Фінанси / страхування'` | `'K'` | `0.7` | `49_764` | `[]` |
| `'male-r'` | `'Мистецтво, спорт'` | `'R'` | `0.9` | `63_982` | `[]` |

**Female industry nodes** (all have `genderSplit: { male: 0, female: 100 }`, `isLocked: false`, `defaultPercentage === percentage`):

| id | label | kvedCode | percentage | absoluteValue | children |
|---|---|---|---|---|---|
| `'female-g'` | `'Торгівля'` | `'G'` | `28.0` | `1_789_452` | `[]` |
| `'female-a'` | `'Сільське господарство'` | `'A'` | `13.6` | `869_162` | `[]` |
| `'female-b-e'` | `'Промисловість'` | `'B-E'` | `9.1` | `581_572` | `[]` |
| `'female-o'` | `'Держуправління та оборона'` | `'O'` | `7.9` | `504_881` | `[]` |
| `'female-p'` | `'Освіта'` | `'P'` | `13.2` | `843_599` | `[]` |
| `'female-q'` | `'Охорона здоров\'я'` | `'Q'` | `9.8` | `626_308` | `[]` |
| `'female-h'` | `'Транспорт'` | `'H'` | `2.4` | `153_382` | `[]` |
| `'female-f'` | `'Будівництво'` | `'F'` | `0.7` | `44_736` | `[]` |
| `'female-m'` | `'Професійна діяльність'` | `'M'` | `2.8` | `178_945` | `[]` |
| `'female-j'` | `'IT та телеком'` | `'J'` | `1.2` | `76_691` | `[...10 subs]` |
| `'female-s'` | `'Інші послуги'` | `'S'` | `2.9` | `185_336` | `[]` |
| `'female-n'` | `'Адмін. обслуговування'` | `'N'` | `1.8` | `115_036` | `[]` |
| `'female-i'` | `'Готелі, харчування'` | `'I'` | `2.5` | `159_773` | `[]` |
| `'female-l'` | `'Нерухомість'` | `'L'` | `1.2` | `76_691` | `[]` |
| `'female-k'` | `'Фінанси / страхування'` | `'K'` | `1.8` | `115_036` | `[]` |
| `'female-r'` | `'Мистецтво, спорт'` | `'R'` | `1.1` | `70_300` | `[]` |

**Male IT subcategory nodes** (under `male-j`, all have `genderSplit: { male: 100, female: 0 }`, `isLocked: false`, `defaultPercentage === percentage`, `children: []`, no `kvedCode`):

| id | label | percentage | absoluteValue |
|---|---|---|---|
| `'male-j-software-dev'` | `'Розробка ПЗ'` | `59.6` | `131_348` |
| `'male-j-qa'` | `'QA / Тестування'` | `14.7` | `32_396` |
| `'male-j-pm'` | `'PM / Product'` | `6.1` | `13_443` |
| `'male-j-hr'` | `'HR / Рекрутинг'` | `0.5` | `1_102` |
| `'male-j-devops'` | `'DevOps / SRE'` | `4.9` | `10_799` |
| `'male-j-analytics'` | `'Аналітики'` | `2.8` | `6_171` |
| `'male-j-design'` | `'UI/UX Дизайн'` | `2.8` | `6_171` |
| `'male-j-data-ml'` | `'Data / ML / AI'` | `2.3` | `5_069` |
| `'male-j-marketing'` | `'Маркетинг'` | `0.9` | `1_983` |
| `'male-j-other'` | `'Інші ролі'` | `5.4` | `11_901` |

**Female IT subcategory nodes** (under `female-j`, all have `genderSplit: { male: 0, female: 100 }`, `isLocked: false`, `defaultPercentage === percentage`, `children: []`, no `kvedCode`):

| id | label | percentage | absoluteValue |
|---|---|---|---|
| `'female-j-software-dev'` | `'Розробка ПЗ'` | `15.0` | `11_504` |
| `'female-j-qa'` | `'QA / Тестування'` | `22.8` | `17_486` |
| `'female-j-pm'` | `'PM / Product'` | `9.2` | `7_056` |
| `'female-j-hr'` | `'HR / Рекрутинг'` | `16.3` | `12_501` |
| `'female-j-devops'` | `'DevOps / SRE'` | `1.7` | `1_304` |
| `'female-j-analytics'` | `'Аналітики'` | `7.1` | `5_445` |
| `'female-j-design'` | `'UI/UX Дизайн'` | `7.1` | `5_445` |
| `'female-j-data-ml'` | `'Data / ML / AI'` | `4.9` | `3_758` |
| `'female-j-marketing'` | `'Маркетинг'` | `4.8` | `3_681` |
| `'female-j-other'` | `'Інші ролі'` | `11.1` | `8_513` |

### Key Patterns

- `import type { TreeNode } from '@/types';` (type-only import)
- Named export: `export const defaultTree: TreeNode`
- All numbers use underscore separators: `13_500_000`, `1_194_329`
- All `percentage` and `defaultPercentage` fields are identical
- All `isLocked` fields are `false`
- `.ts` extension (no JSX)
- JSDoc on the exported constant with tree structure overview
- Estimated file size: ~700 lines (acceptable per TL design)
- Industry ordering: same order as in the normalized table (Торгівля first, Мистецтво last)

### Escaping Note

The label `Охорона здоров'я` contains an apostrophe. Use single quotes with backslash escape (`'Охорона здоров\'я'`) or wrap in double-quote string.

---

## Step 3: Create `src/data/index.ts`

### Code

```typescript
export { defaultTree } from './defaultTree';
export { largestRemainder } from './dataHelpers';
```

### Key Patterns

- Value exports (not `export type`) because these are runtime values/functions
- `.ts` extension

---

## Step 4: Create `src/__tests__/data/dataHelpers.test.ts`

### Code

```typescript
import { describe, it, expect } from 'vitest';

import { largestRemainder } from '@/data/dataHelpers';

describe('largestRemainder', () => {
  it('rounds three equal values to sum to 100 with 1 decimal', () => {
    const result = largestRemainder([33.333, 33.333, 33.333], 100, 1);

    expect(result).toHaveLength(3);
    const sum = result.reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(100, 1);
    // Largest remainder goes to first item (all remainders equal, largest value wins -- tie)
    expect(result[0]).toBe(33.4);
    expect(result[1]).toBe(33.3);
    expect(result[2]).toBe(33.3);
  });

  it('returns exact values when no rounding is needed', () => {
    const result = largestRemainder([50, 30, 20], 100, 1);

    expect(result).toEqual([50, 30, 20]);
  });

  it('handles a single value', () => {
    const result = largestRemainder([99.7], 100, 1);

    expect(result).toEqual([100]);
  });

  it('works with 0 decimal places (integers)', () => {
    const result = largestRemainder([33.3, 33.3, 33.4], 100, 0);

    const sum = result.reduce((s, v) => s + v, 0);
    expect(sum).toBe(100);
    result.forEach((v) => {
      expect(Number.isInteger(v)).toBe(true);
    });
  });

  it('distributes remainders to items with largest fractional parts', () => {
    // 10.1 has remainder 0.1, 20.9 has remainder 0.9, 69.0 has remainder 0.0
    const result = largestRemainder([10.1, 20.9, 69.0], 100, 0);

    // 20.9 gets the +1 (largest remainder 0.9)
    expect(result).toEqual([10, 21, 69]);
  });

  it('handles the 16-industry normalization case', () => {
    const prdValues = [
      22.2, 17.5, 14.3, 9.4, 7.8, 5.8, 5.8, 3.5,
      2.4, 2.2, 2.1, 1.9, 1.8, 1.3, 1.2, 1.0,
    ];
    const exactNormalized = prdValues.map((v) => (v * 100) / 100.2);
    const result = largestRemainder(exactNormalized, 100, 1);

    const sum = result.reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(100, 1);
    expect(result).toHaveLength(16);
    // Verify the known normalized values
    expect(result[0]).toBe(22.1); // Торгівля drops 0.1
    expect(result[1]).toBe(17.4); // Сільське drops 0.1
    // All others stay the same
    for (let i = 2; i < 16; i++) {
      expect(result[i]).toBe(prdValues[i]);
    }
  });

  it('preserves array length', () => {
    const input = [10, 20, 30, 40];
    const result = largestRemainder(input, 100, 1);

    expect(result).toHaveLength(input.length);
  });

  it('does not mutate the input array', () => {
    const input = [33.333, 33.333, 33.333];
    const copy = [...input];
    largestRemainder(input, 100, 1);

    expect(input).toEqual(copy);
  });
});
```

---

## Step 5: Create `src/__tests__/data/defaultTree.test.ts`

### Code

```typescript
import { describe, it, expect } from 'vitest';

import { defaultTree } from '@/data/defaultTree';
import type { DashboardState, TreeNode } from '@/types';

/** Recursively collect all nodes in the tree. */
function collectAllNodes(node: TreeNode): TreeNode[] {
  return [node, ...node.children.flatMap(collectAllNodes)];
}

describe('defaultTree', () => {
  // -------------------------------------------------------
  // Group 1: Structural tests
  // -------------------------------------------------------
  describe('structure', () => {
    it('root has exactly 2 children (male, female)', () => {
      expect(defaultTree.children).toHaveLength(2);
      expect(defaultTree.children[0].id).toBe('gender-male');
      expect(defaultTree.children[1].id).toBe('gender-female');
    });

    it('each gender node has exactly 16 industry children', () => {
      for (const gender of defaultTree.children) {
        expect(gender.children).toHaveLength(16);
      }
    });

    it('IT industry under each gender has exactly 10 subcategory children', () => {
      for (const gender of defaultTree.children) {
        const itNode = gender.children.find((c) => c.kvedCode === 'J');
        expect(itNode).toBeDefined();
        expect(itNode!.children).toHaveLength(10);
      }
    });

    it('all non-IT industries have empty children arrays', () => {
      for (const gender of defaultTree.children) {
        const nonIT = gender.children.filter((c) => c.kvedCode !== 'J');
        expect(nonIT).toHaveLength(15);
        for (const industry of nonIT) {
          expect(industry.children).toEqual([]);
        }
      }
    });

    it('total node count is 55', () => {
      const allNodes = collectAllNodes(defaultTree);
      expect(allNodes).toHaveLength(55);
    });
  });

  // -------------------------------------------------------
  // Group 2: Percentage sum tests
  // -------------------------------------------------------
  describe('percentage sums', () => {
    it('root percentage is 100', () => {
      expect(defaultTree.percentage).toBe(100);
    });

    it('gender children percentages sum to 100', () => {
      const sum = defaultTree.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 2);
    });

    it('male industry percentages sum to 100.0', () => {
      const male = defaultTree.children[0];
      const sum = male.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('female industry percentages sum to 100.0', () => {
      const female = defaultTree.children[1];
      const sum = female.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('male IT subcategory percentages sum to 100.0', () => {
      const maleIT = defaultTree.children[0].children.find(
        (c) => c.kvedCode === 'J',
      );
      expect(maleIT).toBeDefined();
      const sum = maleIT!.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('female IT subcategory percentages sum to 100.0', () => {
      const femaleIT = defaultTree.children[1].children.find(
        (c) => c.kvedCode === 'J',
      );
      expect(femaleIT).toBeDefined();
      const sum = femaleIT!.children.reduce((s, c) => s + c.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });
  });

  // -------------------------------------------------------
  // Group 3: Absolute value consistency tests
  // -------------------------------------------------------
  describe('absolute value consistency', () => {
    it('root absoluteValue is 13,500,000', () => {
      expect(defaultTree.absoluteValue).toBe(13_500_000);
    });

    it('every child absoluteValue equals round(parent.abs * child.pct / 100) within tolerance 1', () => {
      function checkAbsValues(parent: TreeNode): void {
        for (const child of parent.children) {
          const expected = Math.round(
            (parent.absoluteValue * child.percentage) / 100,
          );
          expect(
            Math.abs(child.absoluteValue - expected),
          ).toBeLessThanOrEqual(1);
          checkAbsValues(child);
        }
      }
      checkAbsValues(defaultTree);
    });
  });

  // -------------------------------------------------------
  // Group 4: Gender split validity tests
  // -------------------------------------------------------
  describe('gender split validity', () => {
    it('every node genderSplit.male + genderSplit.female equals 100', () => {
      const allNodes = collectAllNodes(defaultTree);
      for (const node of allNodes) {
        expect(node.genderSplit.male + node.genderSplit.female).toBe(100);
      }
    });

    it('root genderSplit reflects derived weighted values', () => {
      expect(defaultTree.genderSplit.male).toBe(52.66);
      expect(defaultTree.genderSplit.female).toBe(47.34);
    });

    it('male gender node has { male: 100, female: 0 }', () => {
      const male = defaultTree.children[0];
      expect(male.genderSplit).toEqual({ male: 100, female: 0 });
    });

    it('female gender node has { male: 0, female: 100 }', () => {
      const female = defaultTree.children[1];
      expect(female.genderSplit).toEqual({ male: 0, female: 100 });
    });
  });

  // -------------------------------------------------------
  // Group 5: Default state tests
  // -------------------------------------------------------
  describe('default state', () => {
    it('every node has percentage === defaultPercentage', () => {
      const allNodes = collectAllNodes(defaultTree);
      for (const node of allNodes) {
        expect(node.percentage).toBe(node.defaultPercentage);
      }
    });

    it('every node has isLocked === false', () => {
      const allNodes = collectAllNodes(defaultTree);
      for (const node of allNodes) {
        expect(node.isLocked).toBe(false);
      }
    });
  });

  // -------------------------------------------------------
  // Group 6: Completeness tests
  // -------------------------------------------------------
  describe('completeness', () => {
    const EXPECTED_KVED_CODES = [
      'G', 'A', 'B-E', 'O', 'P', 'Q', 'H', 'F',
      'M', 'J', 'S', 'N', 'I', 'L', 'K', 'R',
    ];

    it('all 16 KVED codes present under male gender', () => {
      const maleCodes = defaultTree.children[0].children.map(
        (c) => c.kvedCode,
      );
      for (const code of EXPECTED_KVED_CODES) {
        expect(maleCodes).toContain(code);
      }
    });

    it('all 16 KVED codes present under female gender', () => {
      const femaleCodes = defaultTree.children[1].children.map(
        (c) => c.kvedCode,
      );
      for (const code of EXPECTED_KVED_CODES) {
        expect(femaleCodes).toContain(code);
      }
    });

    const EXPECTED_IT_LABELS = [
      'Розробка ПЗ',
      'QA / Тестування',
      'PM / Product',
      'HR / Рекрутинг',
      'DevOps / SRE',
      'Аналітики',
      'UI/UX Дизайн',
      'Data / ML / AI',
      'Маркетинг',
      'Інші ролі',
    ];

    it('all 10 IT subcategory labels present under male IT', () => {
      const maleIT = defaultTree.children[0].children.find(
        (c) => c.kvedCode === 'J',
      );
      expect(maleIT).toBeDefined();
      const labels = maleIT!.children.map((c) => c.label);
      for (const label of EXPECTED_IT_LABELS) {
        expect(labels).toContain(label);
      }
    });

    it('all 10 IT subcategory labels present under female IT', () => {
      const femaleIT = defaultTree.children[1].children.find(
        (c) => c.kvedCode === 'J',
      );
      expect(femaleIT).toBeDefined();
      const labels = femaleIT!.children.map((c) => c.label);
      for (const label of EXPECTED_IT_LABELS) {
        expect(labels).toContain(label);
      }
    });

    it('all labels are non-empty strings', () => {
      const allNodes = collectAllNodes(defaultTree);
      for (const node of allNodes) {
        expect(typeof node.label).toBe('string');
        expect(node.label.length).toBeGreaterThan(0);
      }
    });

    it('all IDs are unique across the entire tree', () => {
      const allNodes = collectAllNodes(defaultTree);
      const ids = allNodes.map((n) => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // -------------------------------------------------------
  // Group 7: DashboardState compatibility test
  // -------------------------------------------------------
  describe('DashboardState compatibility', () => {
    it('defaultTree can be used to construct a valid DashboardState', () => {
      const state: DashboardState = {
        totalPopulation: defaultTree.absoluteValue,
        balanceMode: 'auto',
        tree: defaultTree,
      };

      expect(state.totalPopulation).toBe(13_500_000);
      expect(state.balanceMode).toBe('auto');
      expect(state.tree.id).toBe('root');
      expect(state.tree.children).toHaveLength(2);
    });
  });
});
```

### Type Assertion Note

The test uses `!` (non-null assertion) on `.find()` results (e.g., `maleIT!.children`). This is acceptable because:
1. The preceding `expect(maleIT).toBeDefined()` validates the value exists
2. The assertion is only in test code, not production code
3. Without it, TypeScript would require an unnecessary `if` guard after an assertion that already verified the value

---

## Step 6: Full Verification

Run in order:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests pass (existing + new)
pnpm build         # Must compile successfully
```

### Expected Test Counts

- `src/__tests__/types/tree.test.ts` -- 10 existing tests (unchanged)
- `src/__tests__/data/dataHelpers.test.ts` -- 8 new tests
- `src/__tests__/data/defaultTree.test.ts` -- ~22 new tests across 7 groups

---

## Calculation Methodology (for auditing)

### Step A: Normalize PRD percentages

PRD sum = 100.2. Multiply each by 100/100.2 to get exact values, then apply largest-remainder with target=100, decimals=1. Only Торгівля (22.2 -> 22.1) and Сільське (17.5 -> 17.4) change. All others stay the same.

### Step B: Weighted root gender split

```
weightedMale = sum(normPct[i] * maleSplit[i] / 100) for all 16 industries
            = 22.1*0.40 + 17.4*0.63 + 14.3*0.70 + 9.4*0.60 + 7.8*0.20 + 5.8*0.20
              + 5.8*0.80 + 3.5*0.90 + 2.4*0.45 + 2.2*0.74 + 2.1*0.35 + 1.9*0.55
              + 1.8*0.35 + 1.3*0.55 + 1.2*0.30 + 1.0*0.50
            = 52.655
rounded to 2dp: 52.66
female = 100 - 52.66 = 47.34
```

### Step C: Gender absolute values

```
maleAbs = round(13_500_000 * 52.66 / 100) = 7_109_100
femaleAbs = 13_500_000 - 7_109_100 = 6_390_900
```

### Step D: Per-gender industry percentages

For male:
```
maleIndustryExact[i] = (normPct[i] * maleSplit[i] / 100) / 52.655 * 100
```
Apply `largestRemainder(maleIndustryExact, 100, 1)` to get final male industry percentages.
Same formula with femaleSplit and 47.345 for female.

### Step E: IT subcategories

IT weighted male = 71.75, IT weighted female = 28.25.
Same formula as Step D but scoped to IT subcategories and IT gender splits.

```
maleSubExact[i] = (subPct[i] * subMaleSplit[i] / 100) / 71.75 * 100
femaleSubExact[i] = (subPct[i] * subFemaleSplit[i] / 100) / 28.25 * 100
```
Apply `largestRemainder(maleSubExact, 100, 1)` and `largestRemainder(femaleSubExact, 100, 1)`.

---

## Summary of Decisions

| Decision | Choice | Source |
|---|---|---|
| Rounding method | Largest-remainder (Hamilton's) | TL design (arch-approved) |
| Gender split precision | 2 decimal places (52.66 / 47.34) | Q6 resolution |
| Absolute value formula | `Math.round(parent.absoluteValue * percentage / 100)` | TL design |
| Industry ordering | Same as PRD table (Торгівля first) | Convention |
| ID scheme | `{gender}-{kved}` lowercase | TL design |
| File extension | `.ts` (no JSX in any file) | Project convention |
| Test assertions | Non-null assertions (`!`) only in tests after `.toBeDefined()` | Acceptable for test code |
