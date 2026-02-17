import { describe, it, expect } from 'vitest';

import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

describe('formatAbsoluteValue', () => {
  it('formats large number with "тис." abbreviation', () => {
    expect(formatAbsoluteValue(13_500_000)).toBe('13 500 тис.');
  });

  it('formats million-range number with "тис." abbreviation', () => {
    expect(formatAbsoluteValue(1_194_329)).toBe('1 194 тис.');
  });

  it('formats thousands-range number with "тис." abbreviation', () => {
    expect(formatAbsoluteValue(6_171)).toBe('6 тис.');
  });

  it('formats value below 1000 without abbreviation', () => {
    expect(formatAbsoluteValue(500)).toBe('500');
  });

  it('formats zero', () => {
    expect(formatAbsoluteValue(0)).toBe('0');
  });

  it('formats boundary value 999 without abbreviation', () => {
    expect(formatAbsoluteValue(999)).toBe('999');
  });

  it('formats boundary value 1000 with "тис." abbreviation', () => {
    expect(formatAbsoluteValue(1000)).toBe('1 тис.');
  });

  it('rounds to nearest thousand for abbreviation', () => {
    // 1_500 / 1000 = 1.5, rounds to 2
    expect(formatAbsoluteValue(1_500)).toBe('2 тис.');
    // 1_499 / 1000 = 1.499, rounds to 1
    expect(formatAbsoluteValue(1_499)).toBe('1 тис.');
  });
});

describe('formatPercentage', () => {
  it('formats standard decimal percentage', () => {
    expect(formatPercentage(18.5)).toBe('18.5%');
  });

  it('formats zero with one decimal place', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('formats 100 with one decimal place', () => {
    expect(formatPercentage(100)).toBe('100.0%');
  });

  it('formats integer with one decimal place', () => {
    expect(formatPercentage(30)).toBe('30.0%');
  });

  it('formats value with more decimals by rounding to 1 decimal', () => {
    expect(formatPercentage(52.66)).toBe('52.7%');
  });
});
