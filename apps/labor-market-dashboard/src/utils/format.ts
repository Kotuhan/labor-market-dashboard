/**
 * Number formatting utilities for Ukrainian labor market display.
 *
 * Provides consistent formatting for absolute values (with "тис." abbreviation)
 * and percentages (1 decimal place). Used by Slider, PieChart, and SummaryBar.
 */

/**
 * Format an absolute value for display using Ukrainian thousands abbreviation.
 *
 * Rules:
 * - Values >= 1000: divide by 1000, round to integer, space-separated groups, append " тис."
 * - Values < 1000: display as plain integer string
 *
 * @example
 * formatAbsoluteValue(13_500_000) // "13 500 тис."
 * formatAbsoluteValue(1_194_329)  // "1 194 тис."
 * formatAbsoluteValue(6_171)      // "6 тис."
 * formatAbsoluteValue(500)        // "500"
 * formatAbsoluteValue(0)          // "0"
 *
 * @param value - The absolute numeric value to format
 * @returns Formatted string with Ukrainian "тис." abbreviation for values >= 1000
 */
export function formatAbsoluteValue(value: number): string {
  if (value < 1000) {
    return String(Math.round(value));
  }

  const thousands = Math.round(value / 1000);
  // Format with space-separated groups using manual approach
  // (Intl.NumberFormat uses non-breaking spaces which are inconsistent across environments)
  const formatted = formatWithSpaces(thousands);
  return `${formatted} тис.`;
}

/**
 * Format a percentage value with exactly 1 decimal place.
 *
 * @example
 * formatPercentage(18.5)  // "18.5%"
 * formatPercentage(0)     // "0.0%"
 * formatPercentage(100)   // "100.0%"
 * formatPercentage(30)    // "30.0%"
 *
 * @param value - The percentage value (0-100) to format
 * @returns Formatted string with 1 decimal place and % suffix
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format a population value with space-separated thousands groups.
 *
 * Unlike formatAbsoluteValue, this does NOT abbreviate with "тис." --
 * it returns the full number with spaces. Used by the population input field.
 *
 * @example
 * formatPopulation(13_500_000) // "13 500 000"
 * formatPopulation(1_194_329)  // "1 194 329"
 * formatPopulation(500)        // "500"
 * formatPopulation(0)          // "0"
 *
 * @param value - The population value to format
 * @returns Formatted string with space-separated thousands
 */
export function formatPopulation(value: number): string {
  return formatWithSpaces(Math.round(value));
}

/**
 * Format an integer with space-separated thousands groups.
 *
 * @param value - Integer to format
 * @returns String with spaces as thousands separators (e.g., 13500 -> "13 500")
 */
function formatWithSpaces(value: number): string {
  const str = String(value);
  const result: string[] = [];
  let count = 0;

  for (let i = str.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      result.unshift(' ');
    }
    result.unshift(str[i]);
    count++;
  }

  return result.join('');
}
