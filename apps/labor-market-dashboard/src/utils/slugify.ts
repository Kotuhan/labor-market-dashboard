/**
 * Ukrainian-to-Latin transliteration and slug generation utility.
 *
 * Converts Ukrainian Cyrillic labels to URL-safe kebab-case slugs.
 * Used to generate predictable node IDs from user-provided labels.
 */

/** Mapping from Ukrainian Cyrillic lowercase characters to Latin equivalents. */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a',   'б': 'b',   'в': 'v',   'г': 'h',
  'ґ': 'g',   'д': 'd',   'е': 'e',   'є': 'ye',
  'ж': 'zh',  'з': 'z',   'и': 'y',   'і': 'i',
  'ї': 'yi',  'й': 'i',   'к': 'k',   'л': 'l',
  'м': 'm',   'н': 'n',   'о': 'o',   'п': 'p',
  'р': 'r',   'с': 's',   'т': 't',   'у': 'u',
  'ф': 'f',   'х': 'kh',  'ц': 'ts',  'ч': 'ch',
  'ш': 'sh',  'щ': 'shch','ь': '',    'ю': 'yu',
  'я': 'ya',
};

/**
 * Convert a Ukrainian label string to a URL-safe kebab-case slug.
 *
 * Algorithm:
 * 1. Lowercase the input
 * 2. Transliterate Cyrillic characters via the map
 * 3. Drop non-alphanumeric, non-space, non-hyphen characters not in the map
 * 4. Collapse whitespace and hyphens into single hyphens
 * 5. Trim leading/trailing hyphens
 * 6. Return "node" as fallback for empty results
 *
 * @example
 * slugify("Кібербезпека")          // "kiberbezpeka"
 * slugify("Розробка ПЗ")           // "rozrobka-pz"
 * slugify("Сільське господарство")  // "silske-hospodarstvo"
 * slugify("UI/UX Дизайн")          // "ui-ux-dyzain"
 * slugify("")                       // "node"
 *
 * @param label - The label string to convert (typically Ukrainian)
 * @returns A kebab-case slug suitable for use in node IDs
 */
export function slugify(label: string): string {
  const lower = label.toLowerCase();
  let result = '';

  for (const char of lower) {
    if (char in CYRILLIC_TO_LATIN) {
      result += CYRILLIC_TO_LATIN[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else if (char === ' ' || char === '-' || char === '/') {
      result += '-';
    }
    // Characters not in the map and not ASCII alphanumeric or spaces/hyphens are dropped
  }

  // Collapse multiple hyphens into one and trim leading/trailing hyphens
  result = result.replace(/-+/g, '-').replace(/^-|-$/g, '');

  return result || 'node';
}
