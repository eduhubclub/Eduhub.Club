/**
 * Edu.Hub color theme roles — M3 DynamicScheme as the accent baseline,
 * then remapped to our product model:
 *
 * - Primary Container = white / dark chrome (default boards & cards)
 * - Accent Container  = soft primary tint (rare colored fills)
 * - Surfaces          = neutral slate ladder (seed does not tint chrome)
 *
 * Accents (Primary / Secondary / Tertiary / Error) still come from
 * @material/material-color-utilities + optional harmony overlays.
 */

import { bestOnColor, contrastRatio } from '../../shared/colorContrast';
import { PRIMARY_SOLID_HEX } from '../../shared/theme';
import { getBrandScale } from './brandColorPalettes';
import { generateScale, primaryFamilyFromScale } from './colorScaleGenerator';
import {
  DEFAULT_SECONDARY_STRATEGY,
  deriveSecondaryFamily,
} from './colorThemeFamilies';
import { materialRolesFromSeed } from './materialDynamicTheme';

export { DEFAULT_ERROR_STRATEGY } from './colorThemeFamilies';

/**
 * Achromatic chrome — matches app `surfaceSchemes` in theme.js.
 * Seed never tints these; color lives on accents and Accent Container.
 */
export const EDU_HUB_CHROME = {
  light: {
    background: '#f8fafc', // slate-50
    onBackground: '#0f172a',
    surface: '#ffffff',
    onSurface: '#0f172a',
    surfaceVariant: '#f1f5f9', // slate-100
    onSurfaceVariant: '#64748b', // slate-500
    outline: '#cbd5e1', // slate-300
    outlineVariant: '#e2e8f0', // slate-200
  },
  dark: {
    background: '#020617', // slate-950
    onBackground: '#f1f5f9',
    surface: '#0f172a', // slate-900
    onSurface: '#f1f5f9',
    surfaceVariant: '#1e293b', // slate-800
    onSurfaceVariant: '#94a3b8', // slate-400
    outline: '#475569', // slate-600
    outlineVariant: '#334155', // slate-700
  },
};

/**
 * @param {string} label
 * @param {string} hex Fill — the role’s color value
 * @param {{ tall?: boolean, half?: boolean, labelHex?: string }} [opts]
 */
function swatch(label, hex, opts = {}) {
  const fill = hex.toLowerCase();
  const wcag = bestOnColor(fill);
  let onHex = wcag.hex;
  if (opts.labelHex) {
    const candidate = opts.labelHex.toLowerCase();
    if (contrastRatio(candidate, fill) >= 3) {
      onHex = candidate;
    }
  }
  return {
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    hex: fill,
    onHex,
    passesAA: wcag.passesAA,
    tall: Boolean(opts.tall),
    half: Boolean(opts.half),
  };
}

/**
 * Secondary / Tertiary / Error accent column (main → on → container → on).
 * @param {string} name
 * @param {{
 *   main: string,
 *   onMain: string,
 *   container: string,
 *   onContainer: string,
 * }} r
 */
function buildAccentColumn(name, r) {
  return {
    id: name.toLowerCase(),
    name,
    main: swatch(name, r.main, { tall: true }),
    onMain: swatch(`On ${name}`, r.onMain, { labelHex: r.main }),
    container: swatch(`${name} Container`, r.container),
    onContainer: swatch(`On ${name} Container`, r.onContainer, {
      labelHex: r.container,
    }),
  };
}

/**
 * Primary column — Edu.Hub stack:
 * Primary → On Primary → Primary Container (chrome) → On Primary Container
 * → Accent Container (soft tint) → On Accent Container
 */
function buildPrimaryColumn(r) {
  return {
    id: 'primary',
    name: 'Primary',
    main: swatch('Primary', r.main, { tall: true }),
    onMain: swatch('On Primary', r.onMain, { labelHex: r.main }),
    container: swatch('Primary Container', r.container),
    onContainer: swatch('On Primary Container', r.onContainer, {
      labelHex: r.container,
    }),
    accentContainer: swatch('Accent Container', r.accentContainer),
    onAccentContainer: swatch('On Accent Container', r.onAccentContainer, {
      labelHex: r.accentContainer,
    }),
  };
}

/**
 * Apply Secondary strategy overlays onto MCU accent roles.
 * - default / neutral: leave scheme accents
 * - complementary / analogous / triadic: harmony partners replace Secondary (+ Tertiary)
 * @param {ReturnType<typeof materialRolesFromSeed>['roles']} roles
 * @param {string} seedHex
 * @param {string} secondaryStrategy
 * @param {boolean} isDark
 */
function applySecondaryStrategy(roles, seedHex, secondaryStrategy, isDark) {
  if (
    secondaryStrategy === 'default' ||
    secondaryStrategy === 'material' || // legacy id
    secondaryStrategy === 'neutral' ||
    !secondaryStrategy
  ) {
    return roles;
  }

  const derived = deriveSecondaryFamily(seedHex, secondaryStrategy, isDark);
  const sec = derived.roles;
  if (!sec?.length) return roles;

  const next = { ...roles };
  next.secondary = sec[0].hex;
  next.onSecondary = bestOnColor(sec[0].hex).hex.toLowerCase();
  next.secondaryContainer = sec[1]?.hex || sec[0].hex;
  next.onSecondaryContainer = bestOnColor(next.secondaryContainer).hex.toLowerCase();
  next.secondaryFixed = next.secondaryContainer;
  next.secondaryFixedDim = sec[2]?.hex || next.secondary;
  next.onSecondaryFixed = bestOnColor(next.secondaryFixed).hex.toLowerCase();
  next.onSecondaryFixedVariant = bestOnColor(
    next.secondaryFixedDim,
  ).hex.toLowerCase();

  const ter = derived.tertiaryRoles;
  if (ter?.length) {
    next.tertiary = ter[0].hex;
    next.onTertiary = bestOnColor(ter[0].hex).hex.toLowerCase();
    next.tertiaryContainer = ter[1]?.hex || ter[0].hex;
    next.onTertiaryContainer = bestOnColor(
      next.tertiaryContainer,
    ).hex.toLowerCase();
    next.tertiaryFixed = next.tertiaryContainer;
    next.tertiaryFixedDim = ter[2]?.hex || next.tertiary;
    next.onTertiaryFixed = bestOnColor(next.tertiaryFixed).hex.toLowerCase();
    next.onTertiaryFixedVariant = bestOnColor(
      next.tertiaryFixedDim,
    ).hex.toLowerCase();
  }

  return next;
}

/**
 * Remap MCU scheme → Edu.Hub product roles.
 * Keeps accent hues; replaces chrome + Primary Container; promotes soft tint to Accent Container.
 * @param {ReturnType<typeof materialRolesFromSeed>['roles']} mcu
 * @param {boolean} isDark
 */
export function applyEduHubRoleModel(mcu, isDark = false) {
  const chrome = EDU_HUB_CHROME[isDark ? 'dark' : 'light'];
  const accentContainer = mcu.primaryContainer;
  const onAccentContainer =
    mcu.onPrimaryContainer || bestOnColor(accentContainer).hex.toLowerCase();

  return {
    ...mcu,
    // Neutral chrome (not seed-tinted)
    background: chrome.background,
    onBackground: chrome.onBackground,
    surface: chrome.surface,
    onSurface: chrome.onSurface,
    surfaceVariant: chrome.surfaceVariant,
    onSurfaceVariant: chrome.onSurfaceVariant,
    outline: chrome.outline,
    outlineVariant: chrome.outlineVariant,
    surfaceDim: chrome.background,
    surfaceBright: chrome.surface,
    // Nested steps → Surface / Surface Variant only
    surfaceContainerLowest: chrome.surface,
    surfaceContainerLow: chrome.surface,
    surfaceContainer: chrome.surfaceVariant,
    surfaceContainerHigh: chrome.surfaceVariant,
    surfaceContainerHighest: chrome.surfaceVariant,

    // Primary Container = default board chrome (alias of Surface)
    primaryContainer: chrome.surface,
    onPrimaryContainer: chrome.onSurface,

    // Soft primary tint — rare colored fills
    accentContainer,
    onAccentContainer,
  };
}

/**
 * Build board + tokens from Edu.Hub role hexes.
 * @param {ReturnType<typeof applyEduHubRoleModel>} roles
 * @param {{ isDarkMode?: boolean, secondaryStrategy?: string }} meta
 */
export function buildColorThemeRolesFromMaterial(roles, meta = {}) {
  const primaryCol = buildPrimaryColumn({
    main: roles.primary,
    onMain: roles.onPrimary,
    container: roles.primaryContainer,
    onContainer: roles.onPrimaryContainer,
    accentContainer: roles.accentContainer,
    onAccentContainer: roles.onAccentContainer,
  });
  const secondaryCol = buildAccentColumn('Secondary', {
    main: roles.secondary,
    onMain: roles.onSecondary,
    container: roles.secondaryContainer,
    onContainer: roles.onSecondaryContainer,
  });
  const tertiaryCol = buildAccentColumn('Tertiary', {
    main: roles.tertiary,
    onMain: roles.onTertiary,
    container: roles.tertiaryContainer,
    onContainer: roles.onTertiaryContainer,
  });
  const errorCol = buildAccentColumn('Error', {
    main: roles.error,
    onMain: roles.onError,
    container: roles.errorContainer,
    onContainer: roles.onErrorContainer,
  });

  const background = swatch('Background', roles.background);
  const surface = swatch('Surface', roles.surface);
  const surfaceVariant = swatch('Surface Variant', roles.surfaceVariant);
  const onSurface = swatch('On Surface', roles.onSurface);
  const onSurfaceVariant = swatch('On Surface Variant', roles.onSurfaceVariant);
  const outline = swatch('Outline', roles.outline);
  const outlineVariant = swatch('Outline Variant', roles.outlineVariant);

  const inverseSurface = swatch('Inverse Surface', roles.inverseSurface);
  const inverseOnSurface = swatch('Inverse On Surface', roles.inverseOnSurface);
  const inversePrimary = swatch('Inverse Primary', roles.inversePrimary);
  const scrim = swatch('Scrim', roles.scrim);
  const shadow = swatch('Shadow', roles.shadow);

  const accentContainer = primaryCol.accentContainer;
  const onAccentContainer = primaryCol.onAccentContainer;

  const tokens = {
    colorPrimary: primaryCol.main,
    colorOnPrimary: primaryCol.onMain,
    /** Soft tint — prefer colorAccentContainer in new UI. */
    colorPrimaryLight: accentContainer,
    colorPrimaryContainer: primaryCol.container,
    colorOnPrimaryContainer: primaryCol.onContainer,
    colorAccentContainer: accentContainer,
    colorOnAccentContainer: onAccentContainer,
    colorPrimaryVariant: swatch('Primary Dark', roles.primaryFixedDim),
    colorOnPrimaryVariant: swatch(
      'On Primary Dark',
      roles.onPrimaryFixedVariant || bestOnColor(roles.primaryFixedDim).hex,
    ),
    colorPrimaryFixed: swatch('Primary Fixed', roles.primaryFixed),
    colorPrimaryFixedDim: swatch('Primary Fixed Dim', roles.primaryFixedDim),
    colorOnPrimaryFixed: swatch('On Primary Fixed', roles.onPrimaryFixed),
    colorOnPrimaryFixedVariant: swatch(
      'On Primary Fixed Variant',
      roles.onPrimaryFixedVariant,
    ),

    colorSecondary: secondaryCol.main,
    colorOnSecondary: secondaryCol.onMain,
    colorSecondaryLight: secondaryCol.container,
    colorSecondaryDark: swatch('Secondary Dark', roles.secondaryFixedDim),
    colorSecondaryVariant: swatch('Secondary Dark', roles.secondaryFixedDim),
    colorSecondaryContainer: secondaryCol.container,
    colorOnSecondaryContainer: secondaryCol.onContainer,

    colorTertiary: tertiaryCol.main,
    colorOnTertiary: tertiaryCol.onMain,
    colorTertiaryLight: tertiaryCol.container,
    colorTertiaryDark: swatch('Tertiary Dark', roles.tertiaryFixedDim),
    colorTertiaryContainer: tertiaryCol.container,
    colorOnTertiaryContainer: tertiaryCol.onContainer,

    colorError: errorCol.main,
    colorOnError: errorCol.onMain,
    colorErrorContainer: errorCol.container,
    colorOnErrorContainer: errorCol.onContainer,

    colorBackground: background,
    colorOnBackground: swatch('On Background', roles.onBackground),
    /** Alias of Primary Container — same white/dark chrome. */
    colorSurface: surface,
    colorOnSurface: onSurface,
    colorSurfaceVariant: surfaceVariant,
    colorOnSurfaceVariant: onSurfaceVariant,
    colorOutline: outline,
    colorOutlineVariant: outlineVariant,
    colorInverseSurface: inverseSurface,
    colorInverseOnSurface: inverseOnSurface,
    colorInversePrimary: inversePrimary,
    colorScrim: scrim,
    colorShadow: shadow,
  };

  const board = {
    accents: [primaryCol, secondaryCol, tertiaryCol, errorCol],
    surfaces: {
      // Edu.Hub ladder — no seed-tinted container steps
      top: [background, surface, surfaceVariant],
      containers: [],
      ink: [onSurface, onSurfaceVariant, outline, outlineVariant],
    },
    inverse: {
      stack: [inverseSurface, inverseOnSurface, inversePrimary],
      utility: [scrim, shadow],
    },
  };

  return {
    isDarkMode: Boolean(meta.isDarkMode),
    secondaryStrategy: meta.secondaryStrategy || DEFAULT_SECONDARY_STRATEGY,
    errorStrategy: 'static',
    engine: 'edu-hub',
    accentEngine: 'material-color-utilities',
    roles,
    tokens,
    board,
    rows: [],
  };
}

/**
 * MCU accents → Edu.Hub chrome remap → board/tokens.
 * @param {ReturnType<typeof materialRolesFromSeed>['roles']} mcuRoles
 * @param {{ isDarkMode?: boolean, secondaryStrategy?: string }} meta
 */
function buildFromMcuRoles(mcuRoles, meta = {}) {
  const isDark = Boolean(meta.isDarkMode);
  const roles = applyEduHubRoleModel(mcuRoles, isDark);
  return buildColorThemeRolesFromMaterial(roles, meta);
}

/**
 * @deprecated Prefer colorThemeRolesFromScale — kept for call sites
 * that still pass primary manually.
 */
export function buildColorThemeRoles(opts) {
  const seed = opts.primary;
  const isDark = Boolean(opts.isDarkMode);
  const strategy = opts.secondaryStrategy || DEFAULT_SECONDARY_STRATEGY;
  const variant = strategy === 'neutral' ? 'neutral' : 'tonalSpot';
  const { roles: base } = materialRolesFromSeed(seed, isDark, {
    variant,
    pinPrimary: true,
  });
  const mcu = applySecondaryStrategy(base, seed, strategy, isDark);
  return buildFromMcuRoles(mcu, {
    isDarkMode: isDark,
    secondaryStrategy: strategy,
  });
}

/**
 * Live Color Test theme from a generated 50–950 scale.
 * @param {{ level: string, hex: string, isSeed?: boolean }[]} scale
 * @param {boolean} [isDarkMode]
 * @param {{ secondaryStrategy?: string }} [opts]
 */
export function colorThemeRolesFromScale(scale, isDarkMode = false, opts = {}) {
  const family = primaryFamilyFromScale(scale);
  const secondaryStrategy =
    opts.secondaryStrategy || DEFAULT_SECONDARY_STRATEGY;
  const variant = secondaryStrategy === 'neutral' ? 'neutral' : 'tonalSpot';
  const { roles: base, seed } = materialRolesFromSeed(
    family.primary,
    isDarkMode,
    { variant, pinPrimary: true },
  );
  const mcu = applySecondaryStrategy(
    base,
    seed,
    secondaryStrategy,
    isDarkMode,
  );
  return buildFromMcuRoles(mcu, {
    isDarkMode,
    secondaryStrategy,
  });
}

/**
 * AppGuide preview from a HubBrand primary key.
 * @param {string} primaryKey
 * @param {boolean} [isDarkMode]
 * @param {{ secondaryStrategy?: string }} [opts]
 */
export function colorThemeRolesFromPrimaryKey(
  primaryKey,
  isDarkMode = false,
  opts = {},
) {
  const solid = PRIMARY_SOLID_HEX[primaryKey];
  if (solid) {
    return colorThemeRolesFromScale(generateScale(solid), isDarkMode, opts);
  }
  const scale = getBrandScale(primaryKey);
  const primary = scale['400'] || scale['500'];
  const secondaryStrategy =
    opts.secondaryStrategy || DEFAULT_SECONDARY_STRATEGY;
  const variant = secondaryStrategy === 'neutral' ? 'neutral' : 'tonalSpot';
  const { roles: base, seed } = materialRolesFromSeed(primary, isDarkMode, {
    variant,
    pinPrimary: true,
  });
  const mcu = applySecondaryStrategy(
    base,
    seed,
    secondaryStrategy,
    isDarkMode,
  );
  return buildFromMcuRoles(mcu, {
    isDarkMode,
    secondaryStrategy,
  });
}
