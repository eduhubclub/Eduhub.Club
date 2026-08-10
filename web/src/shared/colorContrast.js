/**
 * WCAG 2.x contrast helpers — foreground/background luminance ratios.
 * @see https://www.w3.org/TR/WCAG21/#contrast-minimum
 */

const ON_LIGHT = '#0f172a'; // slate-900 — default on-color for light fills
const ON_DARK = '#ffffff';

/** WCAG contrast thresholds (normal text unless noted). */
export const WCAG = {
  textAA: 4.5,
  textAALarge: 3,
  textAAA: 7,
  textAAALarge: 4.5,
  nonTextAA: 3,
};

/**
 * @param {string} hex — #rgb or #rrggbb
 */
export function relativeLuminance(hex) {
  const n = hex.replace('#', '');
  const full =
    n.length === 3
      ? n
          .split('')
          .map((c) => c + c)
          .join('')
      : n;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Contrast ratio between two sRGB colors (1–21).
 * @param {string} foreground
 * @param {string} background
 */
export function contrastRatio(foreground, background) {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * @param {number} ratio
 * @param {{ large?: boolean }} [opts]
 */
export function wcagTextPasses(ratio, { large = false } = {}) {
  return ratio >= (large ? WCAG.textAALarge : WCAG.textAA);
}

/** @param {number} ratio */
export function wcagNonTextPasses(ratio) {
  return ratio >= WCAG.nonTextAA;
}

/**
 * Pick light or dark foreground for a background.
 * @param {string} backgroundHex
 * @param {{ light?: string, dark?: string }} [opts]
 */
export function bestOnColor(backgroundHex, opts = {}) {
  const light = opts.light ?? ON_LIGHT;
  const dark = opts.dark ?? ON_DARK;
  const onLight = contrastRatio(light, backgroundHex);
  const onDark = contrastRatio(dark, backgroundHex);
  const useDark = onDark >= onLight;
  return {
    hex: useDark ? dark : light,
    token: useDark ? 'white' : 'slate-900',
    ratio: useDark ? onDark : onLight,
    passesAA: wcagTextPasses(useDark ? onDark : onLight),
    passesAALarge: wcagTextPasses(useDark ? onDark : onLight, { large: true }),
  };
}

/**
 * @param {number} ratio
 */
export function formatContrastRatio(ratio) {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * @param {number} ratio
 * @param {{ large?: boolean }} [opts]
 */
export function wcagTextLabel(ratio, { large = false } = {}) {
  const aa = wcagTextPasses(ratio, { large });
  const aaa = ratio >= (large ? WCAG.textAAALarge : WCAG.textAAA);
  if (aaa) return 'AAA';
  if (aa) return 'AA';
  if (wcagTextPasses(ratio, { large: true })) return 'AA large';
  return 'Fail';
}
