/**
 * Secondary / Error families for the Color Theme playground.
 * Secondary strategies reuse generateHarmony’s recommended swatches.
 * Error is M3-static: does not follow the dynamic seed; only light/dark.
 */

import { generateHarmony } from './colorHarmony';
import {
  generateScale,
  normalizeHex,
  relativeLevel,
} from './colorScaleGenerator';

/** Quiet slate — same hexes as theme.js secondary chrome. */
const NEUTRAL_SECONDARY = {
  light: { secondary: '#475569', secondaryVariant: '#1e293b' },
  dark: { secondary: '#64748b', secondaryVariant: '#334155' },
};

/**
 * Static Error roles (M3): unchanged by dynamic schemes; light/dark only.
 * @see https://m3.material.io/styles/color/roles
 */
const STATIC_ERROR = {
  light: {
    error: '#e11d48', // rose-600
    errorContainer: '#fff1f2', // rose-50
  },
  dark: {
    error: '#f43f5e', // rose-500
    errorContainer: '#4c0519', // rose-950
  },
};

export const SECONDARY_STRATEGIES = [
  {
    id: 'default',
    label: 'Default',
    blurb: 'M3 SchemeTonalSpot — Secondary / Tertiary from dynamic color.',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    blurb: 'M3 SchemeNeutral — quieter accents.',
  },
  {
    id: 'complementary',
    label: 'Complement',
    blurb: 'TonalSpot surfaces + Complement harmony Secondary.',
  },
  {
    id: 'analogous',
    label: 'Analogous',
    blurb: 'TonalSpot surfaces + Analogous Secondary / Tertiary.',
  },
  {
    id: 'triadic',
    label: 'Triadic',
    blurb: 'TonalSpot surfaces + Triadic Secondary / Tertiary.',
  },
];

/** Error is M3-static via DynamicScheme — no picker. */
export const ERROR_STRATEGIES = [
  {
    id: 'static',
    label: 'Static',
    blurb: 'M3 Error from the scheme — light/dark only.',
  },
];

export const DEFAULT_SECONDARY_STRATEGY = 'default';
export const DEFAULT_ERROR_STRATEGY = 'static';

/**
 * Accent family labels — main / light / dark (Primary-shaped).
 * @param {'secondary' | 'tertiary'} kind
 */
function accentFamilyLabels(kind) {
  if (kind === 'tertiary') {
    return {
      main: 'Tertiary',
      light: 'Tertiary Light',
      dark: 'Tertiary Dark',
    };
  }
  return {
    main: 'Secondary',
    light: 'Secondary Light',
    dark: 'Secondary Dark',
  };
}

/**
 * Main (recommended) + light + dark tonal steps — same offsets as Primary.
 * @param {{ hex: string, seedHex?: string, recommendedLevel?: string, id?: string }} partner
 * @param {'secondary' | 'tertiary'} kind
 */
function familyFromPartner(partner, kind) {
  const labels = accentFamilyLabels(kind);
  const scale = generateScale(partner.seedHex || partner.hex);
  const by = Object.fromEntries(scale.map((s) => [s.level, s.hex]));
  const level =
    partner.recommendedLevel ||
    scale.find((s) => s.isSeed)?.level ||
    '400';
  const lightLevel = relativeLevel(level, 'lighter');
  const darkLevel = relativeLevel(level, 'darker');
  const mainHex = (partner.hex || by[level] || partner.seedHex).toLowerCase();
  const seedHex = (partner.seedHex || partner.hex).toLowerCase();

  return [
    {
      id: kind,
      label: labels.main,
      hex: mainHex,
      seedHex,
      recommendedLevel: level,
      role: 'main',
    },
    {
      id: `${kind}-light`,
      label: labels.light,
      hex: (by[lightLevel] || mainHex).toLowerCase(),
      seedHex,
      recommendedLevel: lightLevel,
      role: 'light',
    },
    {
      id: `${kind}-dark`,
      label: labels.dark,
      hex: (by[darkLevel] || mainHex).toLowerCase(),
      seedHex,
      recommendedLevel: darkLevel,
      role: 'dark',
    },
  ];
}

/**
 * Resolve Secondary (+ Tertiary when harmony has a 2nd partner).
 * Each accent family: main recommended swatch + light + dark.
 * @param {string} primaryHex
 * @param {string} [strategyId]
 * @param {boolean} [isDarkMode]
 */
export function deriveSecondaryFamily(
  primaryHex,
  strategyId = DEFAULT_SECONDARY_STRATEGY,
  isDarkMode = false,
) {
  const strategy =
    SECONDARY_STRATEGIES.find((s) => s.id === strategyId)?.id ||
    DEFAULT_SECONDARY_STRATEGY;

  if (strategy === 'neutral') {
    const mode = isDarkMode ? NEUTRAL_SECONDARY.dark : NEUTRAL_SECONDARY.light;
    const roles = familyFromPartner(
      {
        id: 'secondary',
        hex: mode.secondary,
        seedHex: mode.secondary,
      },
      'secondary',
    );
    // Keep classic slate dark as Secondary Dark when it differs.
    roles[2] = {
      ...roles[2],
      hex: mode.secondaryVariant,
      seedHex: mode.secondaryVariant,
    };
    return {
      strategy,
      families: [roles],
      roles,
      tertiaryRoles: [],
      extraFamilies: [],
      secondary: roles[0].hex,
      secondaryLight: roles[1].hex,
      secondaryDark: roles[2].hex,
      secondaryVariant: roles[2].hex,
      seedHex: roles[0].seedHex,
    };
  }

  const seed = normalizeHex(primaryHex) || '#60a5fa';
  const { colors } = generateHarmony(seed, strategy);
  const partners = colors.filter((c) => !c.isSeed);

  if (!partners.length) {
    return deriveSecondaryFamily(primaryHex, 'neutral', isDarkMode);
  }

  const roles = familyFromPartner(partners[0], 'secondary');
  const tertiaryRoles =
    partners.length > 1 ? familyFromPartner(partners[1], 'tertiary') : [];
  const extraFamilies = tertiaryRoles.length ? [tertiaryRoles] : [];

  return {
    strategy,
    families: tertiaryRoles.length ? [roles, tertiaryRoles] : [roles],
    roles,
    tertiaryRoles,
    extraFamilies,
    secondary: roles[0].hex,
    secondaryLight: roles[1].hex,
    secondaryDark: roles[2].hex,
    secondaryVariant: roles[2].hex,
    tertiary: tertiaryRoles[0]?.hex,
    tertiaryLight: tertiaryRoles[1]?.hex,
    tertiaryDark: tertiaryRoles[2]?.hex,
    seedHex: roles[0].seedHex,
    recommendedLevel: roles[0].recommendedLevel,
  };
}

/**
 * Static Error family — independent of primary seed (M3 dynamic schemes).
 * Adapts only for light / dark theme.
 * @param {boolean} [isDarkMode]
 */
export function deriveErrorFamily(isDarkMode = false) {
  const mode = isDarkMode ? STATIC_ERROR.dark : STATIC_ERROR.light;
  return {
    strategy: 'static',
    error: mode.error,
    errorContainer: mode.errorContainer,
    seedHex: mode.error,
  };
}
