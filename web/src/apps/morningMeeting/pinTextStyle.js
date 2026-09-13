/**
 * Per-pin text size + font for Morning Meeting cards.
 */

import { ACCESSIBLE_FONTS } from '../../data/settings/AccessibilityPreferencesContext';

export const PIN_TEXT_SIZES = [
  { id: 'sm', label: 'S', title: 'Smaller text', scale: 0.88 },
  { id: 'md', label: 'M', title: 'Default text', scale: 1 },
  { id: 'lg', label: 'L', title: 'Larger text', scale: 1.18 },
];

/** Default + a11y fonts + serif / mono for classroom variety. */
export const PIN_FONTS = [
  ...ACCESSIBLE_FONTS.map((f) => ({
    id: f.id,
    label: f.label,
    cssFamily: f.cssFamily,
    googleFamily: f.googleFamily || '',
  })),
  {
    id: 'serif',
    label: 'Serif',
    cssFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    googleFamily: '',
  },
  {
    id: 'mono',
    label: 'Mono',
    cssFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    googleFamily: '',
  },
];

const TEXT_SIZE_IDS = new Set(PIN_TEXT_SIZES.map((s) => s.id));
const FONT_IDS = new Set(PIN_FONTS.map((f) => f.id));

const GOOGLE_LINK_ID = 'edu-hub-mm-pin-fonts';

/**
 * @param {string} [id]
 */
export function normalizePinTextSize(id) {
  return TEXT_SIZE_IDS.has(id) ? id : 'md';
}

/**
 * @param {string} [id]
 */
export function normalizePinFont(id) {
  return FONT_IDS.has(id) ? id : 'default';
}

/**
 * @param {string} [textSize]
 * @param {string} [font]
 */
export function pinTextStyle(textSize, font) {
  const size = PIN_TEXT_SIZES.find((s) => s.id === normalizePinTextSize(textSize));
  const face = PIN_FONTS.find((f) => f.id === normalizePinFont(font));
  if (face?.googleFamily) ensurePinGoogleFonts();
  /** @type {Record<string, string | number>} */
  const style = {};
  if (face?.cssFamily) style.fontFamily = face.cssFamily;
  if (size && size.scale !== 1) style.zoom = size.scale;
  return style;
}

function ensurePinGoogleFonts() {
  if (typeof document === 'undefined') return;
  const families = PIN_FONTS.map((f) => f.googleFamily).filter(Boolean);
  if (!families.length) return;
  let link = document.getElementById(GOOGLE_LINK_ID);
  if (!link) {
    link = document.createElement('link');
    link.id = GOOGLE_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${f}`)
    .join('&')}&display=swap`;
}
