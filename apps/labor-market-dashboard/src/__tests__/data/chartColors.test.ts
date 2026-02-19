import { describe, it, expect } from 'vitest';

import {
  DEFAULT_NODE_COLOR,
  DYNAMIC_COLOR_PALETTE,
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

describe('DYNAMIC_COLOR_PALETTE', () => {
  it('has exactly 8 colors', () => {
    expect(DYNAMIC_COLOR_PALETTE).toHaveLength(8);
  });

  it('all values are valid hex color strings', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const color of DYNAMIC_COLOR_PALETTE) {
      expect(color).toMatch(hexPattern);
    }
  });

  it('has no duplicate colors', () => {
    const unique = new Set(DYNAMIC_COLOR_PALETTE);
    expect(unique.size).toBe(DYNAMIC_COLOR_PALETTE.length);
  });

  it('does not collide with any INDUSTRY_COLORS value', () => {
    const industryColorValues = new Set(Object.values(INDUSTRY_COLORS));
    for (const color of DYNAMIC_COLOR_PALETTE) {
      expect(industryColorValues.has(color)).toBe(false);
    }
  });
});
