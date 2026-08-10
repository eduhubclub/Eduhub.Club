/**
 * Material 3 dynamic scheme engine for HubBrand Color Theme.
 * Uses @material/material-color-utilities DynamicScheme getters.
 *
 * @see https://m3.material.io/styles/color/roles
 * @see https://github.com/material-foundation/material-color-utilities
 */

import {
  Hct,
  SchemeNeutral,
  SchemeTonalSpot,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';
import { bestOnColor } from '../../shared/colorContrast';
import { normalizeHex } from './colorScaleGenerator';

/**
 * @param {number} argb
 */
function toHex(argb) {
  return hexFromArgb(argb).toLowerCase();
}

/**
 * @param {string} seedHex
 * @param {boolean} isDark
 * @param {'tonalSpot' | 'neutral'} [variant]
 * @param {number} [contrastLevel] -1…1, default 0
 */
export function createMaterialScheme(
  seedHex,
  isDark = false,
  variant = 'tonalSpot',
  contrastLevel = 0,
) {
  const hex = normalizeHex(seedHex) || '#60a5fa';
  const hct = Hct.fromInt(argbFromHex(hex));
  if (variant === 'neutral') {
    return new SchemeNeutral(hct, Boolean(isDark), contrastLevel);
  }
  return new SchemeTonalSpot(hct, Boolean(isDark), contrastLevel);
}

/**
 * Flat M3 role hexes from a DynamicScheme (ARGB getters).
 * @param {import('@material/material-color-utilities').DynamicScheme} scheme
 */
export function materialRolesFromScheme(scheme) {
  return {
    primary: toHex(scheme.primary),
    onPrimary: toHex(scheme.onPrimary),
    primaryContainer: toHex(scheme.primaryContainer),
    onPrimaryContainer: toHex(scheme.onPrimaryContainer),
    primaryFixed: toHex(scheme.primaryFixed),
    primaryFixedDim: toHex(scheme.primaryFixedDim),
    onPrimaryFixed: toHex(scheme.onPrimaryFixed),
    onPrimaryFixedVariant: toHex(scheme.onPrimaryFixedVariant),
    inversePrimary: toHex(scheme.inversePrimary),

    secondary: toHex(scheme.secondary),
    onSecondary: toHex(scheme.onSecondary),
    secondaryContainer: toHex(scheme.secondaryContainer),
    onSecondaryContainer: toHex(scheme.onSecondaryContainer),
    secondaryFixed: toHex(scheme.secondaryFixed),
    secondaryFixedDim: toHex(scheme.secondaryFixedDim),
    onSecondaryFixed: toHex(scheme.onSecondaryFixed),
    onSecondaryFixedVariant: toHex(scheme.onSecondaryFixedVariant),

    tertiary: toHex(scheme.tertiary),
    onTertiary: toHex(scheme.onTertiary),
    tertiaryContainer: toHex(scheme.tertiaryContainer),
    onTertiaryContainer: toHex(scheme.onTertiaryContainer),
    tertiaryFixed: toHex(scheme.tertiaryFixed),
    tertiaryFixedDim: toHex(scheme.tertiaryFixedDim),
    onTertiaryFixed: toHex(scheme.onTertiaryFixed),
    onTertiaryFixedVariant: toHex(scheme.onTertiaryFixedVariant),

    error: toHex(scheme.error),
    onError: toHex(scheme.onError),
    errorContainer: toHex(scheme.errorContainer),
    onErrorContainer: toHex(scheme.onErrorContainer),

    background: toHex(scheme.background),
    onBackground: toHex(scheme.onBackground),
    surface: toHex(scheme.surface),
    surfaceDim: toHex(scheme.surfaceDim),
    surfaceBright: toHex(scheme.surfaceBright),
    surfaceContainerLowest: toHex(scheme.surfaceContainerLowest),
    surfaceContainerLow: toHex(scheme.surfaceContainerLow),
    surfaceContainer: toHex(scheme.surfaceContainer),
    surfaceContainerHigh: toHex(scheme.surfaceContainerHigh),
    surfaceContainerHighest: toHex(scheme.surfaceContainerHighest),
    onSurface: toHex(scheme.onSurface),
    surfaceVariant: toHex(scheme.surfaceVariant),
    onSurfaceVariant: toHex(scheme.onSurfaceVariant),
    outline: toHex(scheme.outline),
    outlineVariant: toHex(scheme.outlineVariant),
    inverseSurface: toHex(scheme.inverseSurface),
    inverseOnSurface: toHex(scheme.inverseOnSurface),
    scrim: toHex(scheme.scrim),
    shadow: toHex(scheme.shadow),
    surfaceTint: toHex(scheme.surfaceTint),
  };
}

/**
 * Build M3 roles from a seed hex.
 * @param {string} seedHex
 * @param {boolean} [isDark]
 * @param {{ variant?: 'tonalSpot' | 'neutral', contrastLevel?: number, pinPrimary?: boolean }} [opts]
 */
export function materialRolesFromSeed(seedHex, isDark = false, opts = {}) {
  const variant = opts.variant || 'tonalSpot';
  const scheme = createMaterialScheme(
    seedHex,
    isDark,
    variant,
    opts.contrastLevel ?? 0,
  );
  const roles = materialRolesFromScheme(scheme);
  const seed = (normalizeHex(seedHex) || seedHex).toLowerCase();

  // Keep playground Primary identical to the adjusted seed (Harmony marker).
  if (opts.pinPrimary !== false) {
    roles.primary = seed;
    roles.onPrimary = bestOnColor(seed).hex.toLowerCase();
  }

  return { scheme, roles, seed };
}
