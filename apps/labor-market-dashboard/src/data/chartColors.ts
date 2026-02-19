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

/**
 * Gender colors matching PRD specification.
 * Note: GENDER_COLORS.male (#3B82F6) is the same hex as INDUSTRY_COLORS.G (Торгівля).
 * This is intentional — the bar chart uses GENDER_COLORS while pie charts use INDUSTRY_COLORS.
 */
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

/**
 * Dynamic color palette for user-added industries that lack a KVED code.
 *
 * 8 visually distinct hex colors chosen to avoid collision with the 16
 * INDUSTRY_COLORS values and GENDER_COLORS. When more than 8 custom
 * industries exist, colors cycle from the start of the palette.
 */
export const DYNAMIC_COLOR_PALETTE: readonly string[] = [
  '#0D9488', // teal-600
  '#9333EA', // purple-600
  '#CA8A04', // yellow-600
  '#DC2626', // red-600
  '#2563EB', // blue-600
  '#16A34A', // green-600
  '#EA580C', // orange-600
  '#DB2777', // pink-600
];
