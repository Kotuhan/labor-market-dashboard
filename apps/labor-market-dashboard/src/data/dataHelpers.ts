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
