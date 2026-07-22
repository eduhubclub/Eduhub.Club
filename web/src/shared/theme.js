/**
 * Edu.Hub color system — Material Design roles (M2/M3-inspired) + legacy aliases.
 *
 * Prefer Material role keys in new UI:
 *   colorPrimary, colorOnPrimary, colorPrimaryVariant,
 *   colorSecondary, colorOnSecondary,
 *   colorPrimaryContainer, colorOnPrimaryContainer,
 *   colorBackground, colorOnBackground,
 *   colorSurface, colorOnSurface, colorSurfaceVariant, colorOnSurfaceVariant,
 *   colorOutline, colorError, colorOnError
 *
 * Legacy aliases (bg, text, border, …) remain for existing screens.
 * All class strings are explicit so Tailwind JIT keeps them.
 */

/** Shared surfaces / error — light & dark schemes. */
export const surfaceSchemes = {
  light: {
    colorBackground: 'bg-slate-50',
    colorOnBackground: 'text-slate-900',
    colorSurface: 'bg-white',
    colorOnSurface: 'text-slate-900',
    colorSurfaceVariant: 'bg-slate-100',
    colorOnSurfaceVariant: 'text-slate-500',
    colorOutline: 'border-slate-300',
    colorOutlineVariant: 'border-slate-200',
    colorError: 'bg-rose-600',
    colorOnError: 'text-white',
    colorErrorContainer: 'bg-rose-50',
    colorOnErrorContainer: 'text-rose-700',
  },
  dark: {
    colorBackground: 'bg-slate-950',
    colorOnBackground: 'text-slate-100',
    colorSurface: 'bg-slate-900',
    colorOnSurface: 'text-slate-100',
    colorSurfaceVariant: 'bg-slate-800',
    colorOnSurfaceVariant: 'text-slate-400',
    colorOutline: 'border-slate-600',
    colorOutlineVariant: 'border-slate-700',
    colorError: 'bg-rose-500',
    colorOnError: 'text-white',
    colorErrorContainer: 'bg-rose-950',
    colorOnErrorContainer: 'text-rose-200',
  },
};

/**
 * Build an app theme from a primary hue family.
 * @param {{ token: string, primary: string, variant: string, secondary: string, secondaryOn: string, hoverBg: string, ring: string, text: string, hoverText: string, groupHoverText: string, border: string, bgMuted: string, activeBg: string, containerOn: string }} p
 */
function brandTheme(p) {
  return {
    // —— Material roles (brand) ——
    colorPrimary: p.primary,
    colorOnPrimary: 'text-white',
    colorPrimaryVariant: p.variant,
    colorOnPrimaryVariant: 'text-white',
    colorSecondary: p.secondary,
    colorOnSecondary: p.secondaryOn,
    colorPrimaryContainer: p.activeBg,
    colorOnPrimaryContainer: p.containerOn,

    // —— Legacy aliases (kept for current UI) ——
    primary: p.token,
    bg: p.primary,
    bgMuted: p.bgMuted,
    activeBg: p.activeBg,
    text: p.text,
    hoverText: p.hoverText,
    groupHoverText: p.groupHoverText,
    border: p.border,
    hoverBg: p.hoverBg,
    ring: p.ring,
  };
}

/** Soft secondary chrome shared across primaries. */
const SECONDARY = { secondary: 'bg-slate-600', secondaryOn: 'text-white' };

/**
 * Canonical Edu.Hub primaries — muted fills (400 / soft 700 brown) so UI isn’t garish.
 * Rainbow order for Design pickers.
 */
export const primaryPalettes = {
  Red: brandTheme({
    token: 'red-400',
    primary: 'bg-red-400',
    variant: 'bg-red-600',
    bgMuted: 'bg-red-400/35',
    activeBg: 'bg-red-400/12',
    text: 'text-red-500',
    hoverText: 'hover:text-red-500',
    groupHoverText: 'group-hover:text-red-500',
    border: 'border-red-400',
    hoverBg: 'hover:bg-red-50',
    ring: 'ring-red-400',
    containerOn: 'text-red-700',
    ...SECONDARY,
  }),
  Orange: brandTheme({
    token: 'orange-400',
    primary: 'bg-orange-400',
    variant: 'bg-orange-600',
    bgMuted: 'bg-orange-400/35',
    activeBg: 'bg-orange-400/12',
    text: 'text-orange-500',
    hoverText: 'hover:text-orange-500',
    groupHoverText: 'group-hover:text-orange-500',
    border: 'border-orange-400',
    hoverBg: 'hover:bg-orange-50',
    ring: 'ring-orange-400',
    containerOn: 'text-orange-800',
    ...SECONDARY,
  }),
  Amber: brandTheme({
    token: 'amber-400',
    primary: 'bg-amber-400',
    variant: 'bg-amber-600',
    bgMuted: 'bg-amber-400/35',
    activeBg: 'bg-amber-400/12',
    text: 'text-amber-600',
    hoverText: 'hover:text-amber-600',
    groupHoverText: 'group-hover:text-amber-600',
    border: 'border-amber-400',
    hoverBg: 'hover:bg-amber-50',
    ring: 'ring-amber-400',
    containerOn: 'text-amber-800',
    ...SECONDARY,
  }),
  Emerald: brandTheme({
    token: 'emerald-500',
    primary: 'bg-emerald-500/80',
    variant: 'bg-emerald-700',
    bgMuted: 'bg-emerald-500/30',
    activeBg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    hoverText: 'hover:text-emerald-600',
    groupHoverText: 'group-hover:text-emerald-600',
    border: 'border-emerald-500/80',
    hoverBg: 'hover:bg-emerald-50',
    ring: 'ring-emerald-500/80',
    containerOn: 'text-emerald-800',
    ...SECONDARY,
  }),
  Blue: brandTheme({
    token: 'blue-400',
    primary: 'bg-blue-400',
    variant: 'bg-blue-600',
    bgMuted: 'bg-blue-400/35',
    activeBg: 'bg-blue-400/12',
    text: 'text-blue-400',
    hoverText: 'hover:text-blue-400',
    groupHoverText: 'group-hover:text-blue-400',
    border: 'border-blue-400',
    hoverBg: 'hover:bg-blue-50',
    ring: 'ring-blue-400',
    containerOn: 'text-blue-700',
    ...SECONDARY,
  }),
  Indigo: brandTheme({
    token: 'indigo-400',
    primary: 'bg-indigo-400',
    variant: 'bg-indigo-600',
    bgMuted: 'bg-indigo-400/35',
    activeBg: 'bg-indigo-400/12',
    text: 'text-indigo-500',
    hoverText: 'hover:text-indigo-500',
    groupHoverText: 'group-hover:text-indigo-500',
    border: 'border-indigo-400',
    hoverBg: 'hover:bg-indigo-50',
    ring: 'ring-indigo-400',
    containerOn: 'text-indigo-700',
    ...SECONDARY,
  }),
  Purple: brandTheme({
    token: 'purple-400',
    primary: 'bg-purple-400',
    variant: 'bg-purple-600',
    bgMuted: 'bg-purple-400/35',
    activeBg: 'bg-purple-400/12',
    text: 'text-purple-500',
    hoverText: 'hover:text-purple-500',
    groupHoverText: 'group-hover:text-purple-500',
    border: 'border-purple-400',
    hoverBg: 'hover:bg-purple-50',
    ring: 'ring-purple-400',
    containerOn: 'text-purple-700',
    ...SECONDARY,
  }),
  Pink: brandTheme({
    token: 'rose-400',
    primary: 'bg-rose-400',
    variant: 'bg-rose-600',
    bgMuted: 'bg-rose-400/35',
    activeBg: 'bg-rose-400/12',
    text: 'text-rose-500',
    hoverText: 'hover:text-rose-500',
    groupHoverText: 'group-hover:text-rose-500',
    border: 'border-rose-400',
    hoverBg: 'hover:bg-rose-50',
    ring: 'ring-rose-400',
    containerOn: 'text-rose-700',
    ...SECONDARY,
  }),
  Brown: brandTheme({
    token: 'amber-700',
    primary: 'bg-amber-700/85',
    variant: 'bg-amber-900',
    bgMuted: 'bg-amber-700/30',
    activeBg: 'bg-amber-700/10',
    text: 'text-amber-800',
    hoverText: 'hover:text-amber-800',
    groupHoverText: 'group-hover:text-amber-800',
    border: 'border-amber-700/80',
    hoverBg: 'hover:bg-amber-50',
    ring: 'ring-amber-700/80',
    containerOn: 'text-amber-900',
    ...SECONDARY,
  }),
};

/** Rainbow order for Design → Colors picker. */
export const PRIMARY_KEYS = [
  'Red',
  'Orange',
  'Amber',
  'Emerald',
  'Blue',
  'Indigo',
  'Purple',
  'Pink',
  'Brown',
];

/**
 * Solid hex for each primary — matches Tailwind fills used in primaryPalettes
 * (≈ *-400 / emerald-500 / amber-700). For canvas, SVG, and annotate pickers.
 */
export const PRIMARY_SOLID_HEX = {
  Red: '#f87171',
  Orange: '#fb923c',
  Amber: '#fbbf24',
  Emerald: '#10b981',
  Blue: '#60a5fa',
  Indigo: '#818cf8',
  Purple: '#c084fc',
  Pink: '#fb7185',
  Brown: '#b45309',
};

/** Board neutrals for annotate / fill pickers. */
export const BOARD_NEUTRAL_HEX = {
  slate: '#64748b', // slate-500
  white: '#ffffff',
  black: '#000000',
};

/**
 * Dashboard annotate palette: primary rainbow + slate + white + black.
 * Import instead of hardcoding hex lists in apps.
 */
export const ANNOTATE_PALETTE = [
  ...PRIMARY_KEYS.map((key) => PRIMARY_SOLID_HEX[key]),
  BOARD_NEUTRAL_HEX.slate,
  BOARD_NEUTRAL_HEX.white,
  BOARD_NEUTRAL_HEX.black,
];

/** Apps map onto muted primaries (themeKey still Hub, Classes, …). */
export const appThemes = {
  Hub: { ...primaryPalettes.Blue },
  // themeKey: 'Blue' also resolves via primaryPalettes
  District: { ...primaryPalettes.Pink },
  Admin: { ...primaryPalettes.Emerald },
  Analytics: { ...primaryPalettes.Orange },
  Classes: { ...primaryPalettes.Emerald },
  Students: { ...primaryPalettes.Indigo },
  Randomizer: { ...primaryPalettes.Purple },
  Dashboard: { ...primaryPalettes.Blue },
  Groups: { ...primaryPalettes.Orange },
  TieBreaker: { ...primaryPalettes.Pink },
  NoiseMeter: { ...primaryPalettes.Amber },
  Timer: { ...primaryPalettes.Emerald },
  Design: { ...primaryPalettes.Purple },
  EarlyLiteracy: { ...primaryPalettes.Blue },
  Games: { ...primaryPalettes.Indigo },
};

/** Default primary key for each appThemes / themeKey name. */
export const appThemePrimaryKeys = {
  Hub: 'Blue',
  District: 'Pink',
  Admin: 'Emerald',
  Analytics: 'Orange',
  Classes: 'Emerald',
  Students: 'Indigo',
  Randomizer: 'Purple',
  Dashboard: 'Blue',
  Groups: 'Orange',
  TieBreaker: 'Pink',
  NoiseMeter: 'Amber',
  Timer: 'Emerald',
  Design: 'Purple',
  EarlyLiteracy: 'Blue',
  Games: 'Indigo',
};

/**
 * Resolve a themeKey or palette name to a PRIMARY_KEYS value.
 * @param {string} themeKeyOrPrimary
 */
export function resolvePrimaryKey(themeKeyOrPrimary) {
  if (primaryPalettes[themeKeyOrPrimary]) return themeKeyOrPrimary;
  return appThemePrimaryKeys[themeKeyOrPrimary] || 'Blue';
}

/**
 * @param {string} name - primary palette name or app themeKey
 * @param {boolean} [isDarkMode=false]
 */
export function getTheme(name, isDarkMode = false) {
  const brand =
    primaryPalettes[name] || appThemes[name] || primaryPalettes.Blue;
  const surfaces = isDarkMode ? surfaceSchemes.dark : surfaceSchemes.light;
  return { ...brand, ...surfaces, isDarkMode: Boolean(isDarkMode) };
}

/** Material role swatches for the Design guide (ordered). */
export const MATERIAL_COLOR_ROLES = [
  {
    id: 'primary',
    label: 'Primary',
    bgKey: 'colorPrimary',
    onKey: 'colorOnPrimary',
    note: 'Key actions, FABs, modal headers, active nav',
  },
  {
    id: 'primaryVariant',
    label: 'Primary variant',
    bgKey: 'colorPrimaryVariant',
    onKey: 'colorOnPrimaryVariant',
    note: 'Pressed / darker emphasis on primary',
  },
  {
    id: 'secondary',
    label: 'Secondary',
    bgKey: 'colorSecondary',
    onKey: 'colorOnSecondary',
    note: 'Supporting accent — chrome actions, less emphasis',
  },
  {
    id: 'primaryContainer',
    label: 'Primary container',
    bgKey: 'colorPrimaryContainer',
    onKey: 'colorOnPrimaryContainer',
    note: 'Selected rows, soft highlights (was activeBg)',
  },
  {
    id: 'background',
    label: 'Background',
    bgKey: 'colorBackground',
    onKey: 'colorOnBackground',
    note: 'App canvas behind content',
  },
  {
    id: 'surface',
    label: 'Surface',
    bgKey: 'colorSurface',
    onKey: 'colorOnSurface',
    note: 'Cards, sheets, modals, sidebar',
  },
  {
    id: 'surfaceVariant',
    label: 'Surface variant',
    bgKey: 'colorSurfaceVariant',
    onKey: 'colorOnSurfaceVariant',
    note: 'Subtle panels, footers, muted areas',
  },
  {
    id: 'error',
    label: 'Error',
    bgKey: 'colorError',
    onKey: 'colorOnError',
    note: 'Destructive actions and validation',
  },
  {
    id: 'errorContainer',
    label: 'Error container',
    bgKey: 'colorErrorContainer',
    onKey: 'colorOnErrorContainer',
    note: 'Error banners and soft alerts',
  },
];

export const NAV_HEIGHT = 'h-14';
