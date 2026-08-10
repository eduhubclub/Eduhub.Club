/**
 * Material HCT harmony — temperature hues + accessibility-aware recommended steps.
 * Recommended levels are dynamic (not always 500) for surface separation.
 */

import {
  TemperatureCache,
  TonalPalette,
  hexFromArgb,
} from '@material/material-color-utilities';
import { bestOnColor, contrastRatio } from '../../shared/colorContrast';
import {
  generateScale,
  hexToHct,
  normalizeHex,
  nudgeLevel,
  toneToNearestLevel,
} from './colorScaleGenerator';

export const HARMONY_MODES = ['complementary', 'analogous', 'triadic'];

export const HARMONY_MODE_META = {
  complementary: {
    id: 'complementary',
    label: 'Complementary',
    blurb: 'Opposite on the wheel — high contrast pairing.',
  },
  analogous: {
    id: 'analogous',
    label: 'Analogous',
    blurb: 'Neighbors on the wheel — soft, related accents.',
  },
  triadic: {
    id: 'triadic',
    label: 'Triadic',
    blurb: 'Evenly spaced hues — balanced three-way set.',
  },
};

/**
 * Pick a recommended scale step near the key tone.
 * Soft light/dark nudge for spread; prefers mid-light accents over deep darks.
 *
 * @param {{ level: string, hex: string, passesAA: boolean, contrast?: number, isSeed?: boolean }[]} scale
 * @param {{
 *   preferLevel?: string,
 *   primaryHex?: string,
 *   bias?: 'lighter' | 'darker' | 'mid',
 *   usedLevels?: Set<string>,
 * }} [opts]
 */
export function pickAccessibleLevel(scale, opts = {}) {
  const by = Object.fromEntries(scale.map((s) => [s.level, s]));
  const seed = scale.find((s) => s.isSeed);
  let start =
    opts.preferLevel && by[opts.preferLevel]
      ? opts.preferLevel
      : seed?.level || '400';

  // Soft nudge only — one step, not a full ±200/300 jump.
  if (opts.bias === 'lighter') {
    start = nudgeLevel(start, 'lighter');
  } else if (opts.bias === 'darker') {
    start = nudgeLevel(start, 'darker');
  }

  const used = opts.usedLevels || new Set();
  const primaryHex = opts.primaryHex;

  const scoreLevel = (level) => {
    const swatch = by[level];
    if (!swatch) return -Infinity;
    const n = Number(level);
    let score = 0;

    // AA is good, but don't chase max contrast into 800/900.
    if (swatch.passesAA) score += 18;
    else if ((swatch.contrast || 0) >= 3) score += 8;

    // Stay close to the key/start tone.
    score -= Math.abs(n - Number(start)) * 0.08;

    if (primaryHex) {
      const vsPrimary = contrastRatio(swatch.hex, primaryHex);
      // Enough separation from primary — don't reward extreme contrast.
      if (vsPrimary >= 1.4 && vsPrimary <= 4.5) score += 10;
      else if (vsPrimary > 4.5) score += 4;
    }

    if (used.has(level)) score -= 20;

    // Sweet spot: 200–500 (Google-style accent weights).
    if (n >= 200 && n <= 500) score += 16;
    else if (n === 600) score += 4;
    else if (n >= 700) score -= 14;
    if (n <= 100) score -= 6;
    if (n >= 900) score -= 18;

    return score;
  };

  const candidates = new Set([
    start,
    seed?.level,
    nudgeLevel(start, 'lighter'),
    nudgeLevel(start, 'darker'),
    nudgeLevel(nudgeLevel(start, 'lighter'), 'lighter'),
  ].filter(Boolean));

  let best = start;
  let bestScore = -Infinity;
  for (const level of candidates) {
    const score = scoreLevel(level);
    if (score > bestScore) {
      bestScore = score;
      best = level;
    }
  }
  return best;
}

/**
 * @param {string} hex
 * @param {{ id: string, label: string, isSeed?: boolean }} meta
 * @param {{ bias?: 'lighter' | 'darker' | 'mid', primaryHex?: string, usedLevels?: Set<string> }} [opts]
 */
function makeHarmonyColor(hex, meta, opts = {}) {
  const normalized = normalizeHex(hex) || hex;
  const scale = generateScale(normalized);
  const seed = scale.find((s) => s.isSeed);
  const recommendedLevel = meta.isSeed
    ? seed?.level || toneToNearestLevel(hexToHct(normalized).tone)
    : pickAccessibleLevel(scale, {
        preferLevel: seed?.level,
        primaryHex: opts.primaryHex,
        bias: opts.bias,
        usedLevels: opts.usedLevels,
      });
  const swatch = scale.find((s) => s.level === recommendedLevel) || seed;
  const on = bestOnColor(swatch?.hex || normalized);
  const hct = hexToHct(normalized);
  return {
    id: meta.id,
    label: meta.label,
    hex: (swatch?.hex || normalized).toLowerCase(),
    seedHex: normalized.toLowerCase(),
    hue: Math.round(hct.hue),
    tone: Math.round(hct.tone * 10) / 10,
    chroma: Math.round(hct.chroma * 10) / 10,
    recommendedLevel,
    onHex: on.hex,
    passesAA: on.passesAA,
    isSeed: Boolean(meta.isSeed),
  };
}

/**
 * @param {import('@material/material-color-utilities').Hct} primaryHct
 * @param {number} hue
 */
function partnerHexAtHue(primaryHct, hue) {
  const key = TonalPalette.fromHueAndChroma(hue, primaryHct.chroma).keyColor;
  return hexFromArgb(key.toInt()).toLowerCase();
}

/**
 * @param {string} seedHex
 * @param {'complementary' | 'analogous' | 'triadic'} [mode]
 * @returns {{ mode: string, colors: object[] }}
 */
export function generateHarmony(seedHex, mode = 'complementary') {
  const seed = normalizeHex(seedHex) || '#60a5fa';
  const seedHct = hexToHct(seed);
  const cache = new TemperatureCache(seedHct);
  const resolved = HARMONY_MODES.includes(mode) ? mode : 'complementary';
  const usedLevels = new Set();

  const push = (color) => {
    usedLevels.add(color.recommendedLevel);
    return color;
  };

  let colors;
  if (resolved === 'analogous') {
    const analogs = cache.analogous(3, 12);
    colors = [
      push(
        makeHarmonyColor(
          partnerHexAtHue(seedHct, analogs[0].hue),
          { id: 'analog-minus', label: 'Analog −' },
          { bias: 'darker', primaryHex: seed, usedLevels },
        ),
      ),
      push(
        makeHarmonyColor(seed, { id: 'primary', label: 'Primary', isSeed: true }),
      ),
      push(
        makeHarmonyColor(
          partnerHexAtHue(seedHct, analogs[2].hue),
          { id: 'analog-plus', label: 'Analog +' },
          { bias: 'lighter', primaryHex: seed, usedLevels },
        ),
      ),
    ];
  } else if (resolved === 'triadic') {
    colors = [
      push(
        makeHarmonyColor(seed, { id: 'primary', label: 'Primary', isSeed: true }),
      ),
      push(
        makeHarmonyColor(
          partnerHexAtHue(seedHct, (seedHct.hue + 120) % 360),
          { id: 'triad-a', label: 'Triad A' },
          { bias: 'lighter', primaryHex: seed, usedLevels },
        ),
      ),
      push(
        makeHarmonyColor(
          partnerHexAtHue(seedHct, (seedHct.hue + 240) % 360),
          { id: 'triad-b', label: 'Triad B' },
          { bias: 'darker', primaryHex: seed, usedLevels },
        ),
      ),
    ];
  } else {
    colors = [
      push(
        makeHarmonyColor(seed, { id: 'primary', label: 'Primary', isSeed: true }),
      ),
      push(
        makeHarmonyColor(
          partnerHexAtHue(seedHct, cache.complement.hue),
          { id: 'complement', label: 'Complement' },
          { bias: 'mid', primaryHex: seed, usedLevels },
        ),
      ),
    ];
  }

  return { mode: resolved, colors };
}

/** Recommended accent hexes for harmony partners (excludes primary). */
export function harmonyMarkerHexes(seedHex) {
  const markers = [];
  for (const mode of HARMONY_MODES) {
    const { colors } = generateHarmony(seedHex, mode);
    for (const color of colors) {
      if (!color.isSeed) markers.push(color.hex);
    }
  }
  return [...new Set(markers)];
}
