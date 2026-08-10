/**
 * HCT tonal scale (Material) — seed lands on the nearest tone step (not always 500).
 * Primary light / dark are ~200–300 steps lighter / darker when on-scale.
 */

import {
  Hct,
  TonalPalette,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';
import { bestOnColor, contrastRatio, relativeLuminance } from '../../shared/colorContrast';

export const SCALE_LEVELS = [
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
  '950',
];

/** Tailwind level → Material HCT tone (0 = black, 100 = white). */
export const LEVEL_TO_TONE = {
  50: 95,
  100: 90,
  200: 80,
  300: 70,
  400: 60,
  500: 50,
  600: 40,
  700: 30,
  800: 20,
  900: 10,
  950: 5,
};

/** Prefer ±200 level numbers, fall back to ±300. */
const RELATIVE_DELTAS = [200, 300];

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeHex(input) {
  if (!input) return null;
  let h = String(input).trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return `#${h.toLowerCase()}`;
}

export function hexToRgb(hex) {
  const n = normalizeHex(hex)?.replace('#', '');
  if (!n) return null;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  const to = (v) =>
    clamp(Math.round(v), 0, 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function rgbToHsl(r, g, b) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
  else if (max === G) h = ((B - R) / d + 2) / 6;
  else h = ((R - G) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h, s, l) {
  const H = ((h % 360) + 360) % 360;
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;
  if (S === 0) {
    const v = L * 255;
    return { r: v, g: v, b: v };
  }
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const hk = H / 360;
  const t = (n) => {
    let x = n;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return {
    r: t(hk + 1 / 3) * 255,
    g: t(hk) * 255,
    b: t(hk - 1 / 3) * 255,
  };
}

export function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/** @param {number} tone HCT tone 0–100 */
export function toneToNearestLevel(tone) {
  let best = '500';
  let bestDist = Infinity;
  for (const level of SCALE_LEVELS) {
    const dist = Math.abs(tone - LEVEL_TO_TONE[level]);
    const tieBreak =
      dist === bestDist &&
      Math.abs(Number(level) - 500) < Math.abs(Number(best) - 500);
    if (dist < bestDist || tieBreak) {
      bestDist = dist;
      best = level;
    }
  }
  return best;
}

/**
 * Move ~200–300 lighter (toward 50) or darker (toward 950) by level number.
 * Prefers ±200 when that step exists, else ±300; clamps to scale ends.
 *
 * @param {string} level
 * @param {'lighter' | 'darker'} direction
 */
export function relativeLevel(level, direction) {
  const n = Number(level);
  if (!Number.isFinite(n)) return direction === 'lighter' ? '200' : '700';
  const sign = direction === 'lighter' ? -1 : 1;
  for (const delta of RELATIVE_DELTAS) {
    const target = String(n + sign * delta);
    if (SCALE_LEVELS.includes(target)) return target;
  }
  const idx = SCALE_LEVELS.indexOf(String(level));
  if (idx < 0) return direction === 'lighter' ? '200' : '700';
  if (direction === 'lighter') {
    return idx > 0 ? SCALE_LEVELS[Math.max(0, idx - 1)] : SCALE_LEVELS[0];
  }
  return idx < SCALE_LEVELS.length - 1
    ? SCALE_LEVELS[Math.min(SCALE_LEVELS.length - 1, idx + 1)]
    : SCALE_LEVELS[SCALE_LEVELS.length - 1];
}

/**
 * Move one step lighter / darker on the scale (gentler than ±200).
 * @param {string} level
 * @param {'lighter' | 'darker'} direction
 */
export function nudgeLevel(level, direction) {
  const idx = SCALE_LEVELS.indexOf(String(level));
  if (idx < 0) return level;
  if (direction === 'lighter') {
    return SCALE_LEVELS[Math.max(0, idx - 1)];
  }
  return SCALE_LEVELS[Math.min(SCALE_LEVELS.length - 1, idx + 1)];
}

/** @param {string} hex */
export function hexToHct(hex) {
  const n = normalizeHex(hex) || '#3b82f6';
  return Hct.fromInt(argbFromHex(n));
}

/**
 * @param {string} seedHex
 * @param {{ hue?: number, saturation?: number, temperature?: number }} [adj]
 */
export function adjustedSeedHct(seedHex, adj = {}) {
  const base = hexToHct(seedHex);
  const hueShift = adj.hue ?? 0;
  const satShift = adj.saturation ?? 0;
  const temp = adj.temperature ?? 0;
  // Temperature nudges toward warm (amber) or cool (cyan).
  const tempHue = temp * 0.18;
  const chroma = clamp(base.chroma + satShift * 0.45, 0, 120);
  return Hct.from(base.hue + hueShift + tempHue, chroma, base.tone);
}

/**
 * HCT tonal ramp. Seed hex sits at its natural tone step (isSeed).
 *
 * @param {string} seedHex
 * @param {{ hue?: number, saturation?: number, temperature?: number }} [adj]
 */
export function generateScale(seedHex, adj = {}) {
  const rawSeed = normalizeHex(seedHex) || '#3b82f6';
  const hct = adjustedSeedHct(rawSeed, adj);
  const hasAdj =
    (adj.hue ?? 0) !== 0 ||
    (adj.saturation ?? 0) !== 0 ||
    (adj.temperature ?? 0) !== 0;
  const seedHexOut = hasAdj ? hexFromArgb(hct.toInt()).toLowerCase() : rawSeed;
  const seedLevel = toneToNearestLevel(hct.tone);
  const palette = TonalPalette.fromHueAndChroma(hct.hue, hct.chroma);

  return SCALE_LEVELS.map((level) => {
    const tone = LEVEL_TO_TONE[level];
    let hex = hexFromArgb(palette.tone(tone)).toLowerCase();
    const isSeed = level === seedLevel;
    if (isSeed) hex = seedHexOut;
    const on = bestOnColor(hex);
    return {
      level,
      hex,
      onHex: on.hex,
      onDark: on.token === 'white',
      contrast: on.ratio,
      passesAA: on.passesAA,
      isSeed,
      tone,
    };
  });
}

/**
 * Primary family from a generated scale — light/dark ~200–300 from seed.
 * @param {{ level: string, hex: string, isSeed?: boolean }[]} scale
 */
export function primaryFamilyFromScale(scale) {
  const seed =
    scale.find((s) => s.isSeed) ||
    scale.find((s) => s.level === '500') ||
    scale[Math.floor(scale.length / 2)];
  const by = Object.fromEntries(scale.map((s) => [s.level, s.hex]));
  const seedLevel = seed.level;
  const lightLevel = relativeLevel(seedLevel, 'lighter');
  const darkLevel = relativeLevel(seedLevel, 'darker');
  return {
    seedLevel,
    lightLevel,
    darkLevel,
    primary: seed.hex,
    primaryLight: by[lightLevel] || seed.hex,
    primaryDark: by[darkLevel] || seed.hex,
  };
}

/** Pick hex at a scale level (falls back to seed, then 500). */
export function scaleHexAt(scale, level) {
  const row =
    scale.find((s) => s.level === level) ||
    scale.find((s) => s.isSeed) ||
    scale.find((s) => s.level === '500');
  return row?.hex || '#3b82f6';
}

/**
 * Build a lightweight theme-like object from a generated scale for live previews.
 */
export function themeFromScale(scale, isDarkMode = false) {
  const byLevel = Object.fromEntries(scale.map((s) => [s.level, s.hex]));
  const family = primaryFamilyFromScale(scale);
  const light = family.primaryLight;
  const mid = family.primary;
  const dark = family.primaryDark;
  const onLight = bestOnColor(light);
  const onMid = bestOnColor(mid);
  const onDark = bestOnColor(dark);

  const surfaces = isDarkMode
    ? {
        colorBackground: 'bg-slate-950',
        colorOnBackground: 'text-slate-100',
        colorSurface: 'bg-slate-900',
        colorOnSurface: 'text-slate-100',
        colorSurfaceVariant: 'bg-slate-800',
        colorOnSurfaceVariant: 'text-slate-400',
        colorOutline: 'border-slate-600',
        colorOutlineVariant: 'border-slate-700',
      }
    : {
        colorBackground: 'bg-slate-50',
        colorOnBackground: 'text-slate-900',
        colorSurface: 'bg-white',
        colorOnSurface: 'text-slate-900',
        colorSurfaceVariant: 'bg-slate-100',
        colorOnSurfaceVariant: 'text-slate-500',
        colorOutline: 'border-slate-300',
        colorOutlineVariant: 'border-slate-200',
      };

  return {
    ...surfaces,
    isDarkMode,
    hex: {
      ...byLevel,
      onLight: onLight.hex,
      onMid: onMid.hex,
      onDark: onDark.hex,
      on400: onLight.hex,
      on600: onMid.hex,
      on700: onDark.hex,
      link: dark,
    },
    colorPrimary: '',
    colorOnPrimary: '',
    colorPrimaryVariant: '',
    colorOnPrimaryVariant: '',
    colorPrimaryContainer: '',
    colorOnPrimaryContainer: '',
    text: '',
    bgMuted: '',
    ring: '',
  };
}

export function randomSeedHex() {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.random() * 35;
  const l = 48 + Math.random() * 12;
  return hslToHex(h, s, l);
}

export function exportScaleCss(name, scale) {
  const safe = (name || 'brand').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const lines = scale.map((s) => `  --color-${safe}-${s.level}: ${s.hex};`);
  return `:root {\n${lines.join('\n')}\n}`;
}

export function exportScaleTailwind(name, scale) {
  const safe = (name || 'brand').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const body = scale.map((s) => `        '${s.level}': '${s.hex}',`).join('\n');
  return `${safe}: {\n${body}\n      },`;
}

/** Contrast of each swatch vs white / slate-900 for the picker panel. */
export function scaleContrastSummary(scale) {
  return scale.map((s) => ({
    ...s,
    vsWhite: contrastRatio(s.hex, '#ffffff'),
    vsDark: contrastRatio(s.hex, '#0f172a'),
    luminance: relativeLuminance(s.hex),
  }));
}
