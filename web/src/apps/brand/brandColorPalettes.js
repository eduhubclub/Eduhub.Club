/**
 * Edu.Hub primary color scales — Material-style levels for brand guidelines.
 * Hex values align with Tailwind’s default palette for each PRIMARY_KEYS family
 * (Pink → rose). Brown uses Material brown; app chrome still fills amber-700.
 */

import { PRIMARY_KEYS, PRIMARY_SOLID_HEX } from '../../shared/theme';
import { relativeLuminance } from '../../shared/colorContrast';

const LEVELS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  'A100',
  'A200',
  'A400',
  'A700',
];

/** @type {Record<string, Record<string, string>>} */
const SCALES = {
  Red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    A100: '#ff8a80',
    A200: '#ff5252',
    A400: '#ff1744',
    A700: '#d50000',
  },
  Orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    A100: '#ffd180',
    A200: '#ffab40',
    A400: '#ff9100',
    A700: '#ff6d00',
  },
  Amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    A100: '#ffe57f',
    A200: '#ffd740',
    A400: '#ffc400',
    A700: '#ffab00',
  },
  Emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    A100: '#b9f6ca',
    A200: '#69f0ae',
    A400: '#00e676',
    A700: '#00c853',
  },
  Blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    A100: '#82b1ff',
    A200: '#448aff',
    A400: '#2979ff',
    A700: '#2962ff',
  },
  Indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    A100: '#8c9eff',
    A200: '#536dfe',
    A400: '#3d5afe',
    A700: '#304ffe',
  },
  Purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    A100: '#ea80fc',
    A200: '#e040fb',
    A400: '#d500f9',
    A700: '#aa00ff',
  },
  // App “Pink” primary is rose-400 (#fb7185).
  Pink: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    A100: '#ff80ab',
    A200: '#ff4081',
    A400: '#f50057',
    A700: '#c51162',
  },
  Brown: {
    50: '#efebe9',
    100: '#d7ccc8',
    200: '#bcaaa4',
    300: '#a1887f',
    400: '#8d6e63',
    500: '#795548',
    600: '#6d4c41',
    700: '#5d4037',
    800: '#4e342e',
    900: '#3e2723',
    A100: '#d7ccc8',
    A200: '#bcaaa4',
    A400: '#8d6e63',
    A700: '#5d4037',
  },
};

/** Tailwind / Material family label for captions. */
export const PRIMARY_TAILWIND_FAMILY = {
  Red: 'red',
  Orange: 'orange',
  Amber: 'amber',
  Emerald: 'emerald',
  Blue: 'blue',
  Indigo: 'indigo',
  Purple: 'purple',
  Pink: 'rose',
  Brown: 'brown',
};

function findAppTone(name, scale) {
  const solid = PRIMARY_SOLID_HEX[name]?.toLowerCase();
  if (!solid) return null;
  return LEVELS.find((level) => scale[level].toLowerCase() === solid) ?? null;
}

function buildSwatches(entries) {
  return entries.map(({ level, hex }) => ({
    level,
    hex,
    onDark: relativeLuminance(hex) < 0.45,
  }));
}

/** @param {string} name */
export function getBrandScale(name) {
  return SCALES[name] || SCALES.Blue;
}

/**
 * Primary palettes for HubBrand Color page — Material-style leveled rows.
 */
export const BRAND_COLOR_PALETTES = PRIMARY_KEYS.map((name) => {
  const scale = SCALES[name];
  const appTone = findAppTone(name, scale);
  return {
    name,
    family: PRIMARY_TAILWIND_FAMILY[name],
    appTone,
    /** When the theme solid isn’t in this scale (Brown → amber-700). */
    appFillHex: appTone ? null : PRIMARY_SOLID_HEX[name] ?? null,
    swatches: buildSwatches(LEVELS.map((level) => ({ level, hex: scale[level] }))),
  };
});

/** Tailwind slate — shell surfaces, outlines, and annotate gray. */
const SLATE_SCALE = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

const SLATE_LEVELS = Object.keys(SLATE_SCALE);

/**
 * Neutrals: Slate (gray), White, Black — board & shell foundations.
 */
export const BRAND_NEUTRAL_PALETTES = [
  {
    name: 'Slate',
    family: 'slate',
    appTone: '500',
    appFillHex: null,
    swatches: buildSwatches(SLATE_LEVELS.map((level) => ({ level, hex: SLATE_SCALE[level] }))),
  },
  {
    name: 'White',
    family: 'white',
    appTone: 'White',
    appFillHex: null,
    swatches: buildSwatches([{ level: 'White', hex: '#ffffff' }]),
  },
  {
    name: 'Black',
    family: 'black',
    appTone: 'Black',
    appFillHex: null,
    swatches: buildSwatches([{ level: 'Black', hex: '#000000' }]),
  },
];
