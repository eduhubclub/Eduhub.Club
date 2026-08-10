import { PRIMARY_KEYS, PRIMARY_SOLID_HEX } from '../../shared/theme';
import {
  WCAG,
  bestOnColor,
  contrastRatio,
  formatContrastRatio,
  wcagNonTextPasses,
  wcagTextLabel,
  wcagTextPasses,
} from '../../shared/colorContrast';

const SURFACE_LIGHT = '#ffffff';
const SURFACE_DARK = '#0f172a';

/** Theme pairing guidance — mirrors accessible roles in theme.js. */
export const BRAND_ACCESS_PAIRINGS = {
  Red: {
    primaryFill: '#f87171',
    primaryOn: '#0f172a',
    variantFill: '#dc2626',
    variantOn: '#ffffff',
    linkOnSurface: '#dc2626',
    linkLevel: '600',
  },
  Orange: {
    primaryFill: '#fb923c',
    primaryOn: '#0f172a',
    variantFill: '#c2410c',
    variantOn: '#ffffff',
    linkOnSurface: '#c2410c',
    linkLevel: '700',
  },
  Amber: {
    primaryFill: '#fbbf24',
    primaryOn: '#0f172a',
    variantFill: '#b45309',
    variantOn: '#ffffff',
    linkOnSurface: '#92400e',
    linkLevel: '800',
  },
  Emerald: {
    primaryFill: '#10b981',
    primaryOn: '#0f172a',
    variantFill: '#047857',
    variantOn: '#ffffff',
    linkOnSurface: '#047857',
    linkLevel: '700',
  },
  Blue: {
    primaryFill: '#60a5fa',
    primaryOn: '#0f172a',
    variantFill: '#2563eb',
    variantOn: '#ffffff',
    linkOnSurface: '#2563eb',
    linkLevel: '600',
  },
  Indigo: {
    primaryFill: '#818cf8',
    primaryOn: '#0f172a',
    variantFill: '#4f46e5',
    variantOn: '#ffffff',
    linkOnSurface: '#4f46e5',
    linkLevel: '600',
  },
  Purple: {
    primaryFill: '#c084fc',
    primaryOn: '#0f172a',
    variantFill: '#9333ea',
    variantOn: '#ffffff',
    linkOnSurface: '#9333ea',
    linkLevel: '600',
  },
  Pink: {
    primaryFill: '#fb7185',
    primaryOn: '#0f172a',
    variantFill: '#e11d48',
    variantOn: '#ffffff',
    linkOnSurface: '#e11d48',
    linkLevel: '600',
  },
  Brown: {
    primaryFill: '#b45309',
    primaryOn: '#ffffff',
    variantFill: '#78350f',
    variantOn: '#ffffff',
    linkOnSurface: '#78350f',
    linkLevel: '900',
  },
};

function pairingReport(name) {
  const p = BRAND_ACCESS_PAIRINGS[name];
  const primaryOnRatio = contrastRatio(p.primaryOn, p.primaryFill);
  const variantOnRatio = contrastRatio(p.variantOn, p.variantFill);
  const linkRatio = contrastRatio(p.linkOnSurface, SURFACE_LIGHT);
  const whiteOnApp = contrastRatio('#ffffff', PRIMARY_SOLID_HEX[name]);
  return {
    name,
    primary: {
      fill: p.primaryFill,
      on: p.primaryOn,
      ratio: primaryOnRatio,
      label: wcagTextLabel(primaryOnRatio),
      passes: wcagTextPasses(primaryOnRatio),
    },
    variant: {
      fill: p.variantFill,
      on: p.variantOn,
      ratio: variantOnRatio,
      label: wcagTextLabel(variantOnRatio),
      passes: wcagTextPasses(variantOnRatio),
    },
    link: {
      fill: p.linkOnSurface,
      level: p.linkLevel,
      ratio: linkRatio,
      label: wcagTextLabel(linkRatio),
      passes: wcagTextPasses(linkRatio),
    },
    /** White on the historical “App” swatch — often fails; documented, not used for UI text. */
    whiteOnApp: {
      ratio: whiteOnApp,
      label: wcagTextLabel(whiteOnApp),
      passes: wcagTextPasses(whiteOnApp),
    },
  };
}

export const BRAND_PRIMARY_ACCESS_REPORTS = PRIMARY_KEYS.map(pairingReport);

/** WCAG reference rows for the Color page. */
export const WCAG_REFERENCE_ROWS = [
  {
    category: 'Normal text',
    aa: `${WCAG.textAA}:1`,
    aaa: `${WCAG.textAAA}:1`,
    note: 'Body copy, labels, button text',
  },
  {
    category: 'Large text',
    aa: `${WCAG.textAALarge}:1`,
    aaa: `${WCAG.textAAALarge}:1`,
    note: '18px+ regular or 14px+ bold',
  },
  {
    category: 'Non-text',
    aa: `${WCAG.nonTextAA}:1`,
    aaa: '—',
    note: 'Icons, focus rings, chart marks',
  },
];

/**
 * Per-swatch accessibility hints for palette columns.
 * @param {string} hex
 */
export function swatchAccessRoles(hex) {
  const white = bestOnColor(hex, { dark: '#ffffff' });
  const dark = bestOnColor(hex, { light: '#0f172a' });
  return {
    bestOn: white.passesAA ? white : dark.passesAA ? dark : white.ratio >= dark.ratio ? white : dark,
    whiteOnSwatch: {
      ratio: contrastRatio('#ffffff', hex),
      passes: wcagTextPasses(contrastRatio('#ffffff', hex)),
    },
    darkOnSwatch: {
      ratio: contrastRatio('#0f172a', hex),
      passes: wcagTextPasses(contrastRatio('#0f172a', hex)),
    },
    onLightSurface: {
      ratio: contrastRatio(hex, SURFACE_LIGHT),
      passes: wcagNonTextPasses(contrastRatio(hex, SURFACE_LIGHT)),
    },
    onDarkSurface: {
      ratio: contrastRatio(hex, SURFACE_DARK),
      passes: wcagNonTextPasses(contrastRatio(hex, SURFACE_DARK)),
    },
  };
}

/** Palettes whose App swatch cannot carry white button labels. */
export const APP_TONE_WHITE_TEXT_ISSUES = BRAND_PRIMARY_ACCESS_REPORTS.filter(
  (r) => !r.whiteOnApp.passes,
).map((r) => r.name);

export function summarizePaletteAccessibility(palette) {
  const report = BRAND_PRIMARY_ACCESS_REPORTS.find((r) => r.name === palette.name);
  if (report) return report;
  if (palette.name === 'Slate') {
    const mid = '#64748b';
    return {
      name: 'Slate',
      primary: {
        fill: mid,
        on: '#ffffff',
        ratio: contrastRatio('#ffffff', mid),
        label: wcagTextLabel(contrastRatio('#ffffff', mid)),
        passes: true,
      },
    };
  }
  return null;
}

export { formatContrastRatio, WCAG };
