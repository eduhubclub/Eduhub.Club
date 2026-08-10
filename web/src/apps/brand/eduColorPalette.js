/**
 * Edu Color Palette — spot / print specs for HubBrand Color.
 * HEX matches PRIMARY_SOLID_HEX + BOARD_NEUTRAL_HEX; RGB/CMYK derived;
 * PMS is an approximate coated match until official Pantone bridges are locked.
 */

import {
  BOARD_NEUTRAL_HEX,
  PRIMARY_KEYS,
  PRIMARY_SOLID_HEX,
} from '../../shared/theme';
import { hexToRgb } from './colorScaleGenerator';

/** @type {Record<string, string>} */
const PMS_APPROX = {
  Red: '1775 C',
  Orange: '1495 C',
  Amber: '1235 C',
  Emerald: '3395 C',
  Blue: '2925 C',
  Indigo: '2725 C',
  Purple: '2655 C',
  Pink: '1777 C',
  Brown: '174 C',
  Slate: '7544 C',
  White: 'White',
  Black: 'Black C',
};

const NEUTRALS = [
  { name: 'Slate', hex: BOARD_NEUTRAL_HEX.slate },
  { name: 'White', hex: BOARD_NEUTRAL_HEX.white },
  { name: 'Black', hex: BOARD_NEUTRAL_HEX.black },
];

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
export function rgbToCmyk(r, g, b) {
  if (r === 0 && g === 0 && b === 0) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const k = 1 - Math.max(R, G, B);
  const denom = 1 - k;
  return {
    c: Math.round(((1 - R - k) / denom) * 100),
    m: Math.round(((1 - G - k) / denom) * 100),
    y: Math.round(((1 - B - k) / denom) * 100),
    k: Math.round(k * 100),
  };
}

/**
 * @param {string} name
 * @param {string} hexRaw
 */
function paletteEntry(name, hexRaw) {
  const hex = (hexRaw || '#000000').toLowerCase();
  const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  return {
    name,
    hex: hex.toUpperCase(),
    pms: PMS_APPROX[name] || '—',
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    cmyk: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`,
  };
}

/**
 * @returns {{
 *   name: string,
 *   hex: string,
 *   pms: string,
 *   rgb: string,
 *   cmyk: string,
 * }[]}
 */
export function getEduColorPalette() {
  const primaries = PRIMARY_KEYS.map((name) =>
    paletteEntry(name, PRIMARY_SOLID_HEX[name]),
  );
  const neutrals = NEUTRALS.map(({ name, hex }) => paletteEntry(name, hex));
  return [...primaries, ...neutrals];
}
