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
    const result = largestRemainder([99.95], 100, 1);

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
