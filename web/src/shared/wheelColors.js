/**
 * Wheel of Names segment + SVG chrome colors.
 *
 * Segments use three light tones of the active primary. Adjacent slices
 * (including the wrap-around seam) never share a tone — see wheelSegmentToneIndex.
 */
import { PRIMARY_KEYS, primaryPalettes } from './theme';

/**
 * Three light tones per primary palette (lighter → light → soft mid).
 * Kept airy so solid colorPrimary CTAs stay the emphasis; steps still
 * read as a clear 1-2-3 when all three are used.
 */
const PRIMARY_TONES = {
  Red: ['#fef2f2', '#fecaca', '#fca5a5'],
  Orange: ['#fff7ed', '#fed7aa', '#fdba74'],
  Amber: ['#fffbeb', '#fde68a', '#fcd34d'],
  Emerald: ['#ecfdf5', '#a7f3d0', '#6ee7b7'],
  Blue: ['#eff6ff', '#bfdbfe', '#93c5fd'],
  Indigo: ['#eef2ff', '#c7d2fe', '#a5b4fc'],
  Purple: ['#faf5ff', '#e9d5ff', '#d8b4fe'],
  Pink: ['#fff1f2', '#fecdd3', '#fda4af'],
  Brown: ['#fffbeb', '#fde68a', '#fbbf24'],
};

/** SVG fills aligned with surfaceSchemes (Tailwind slate). */
export function wheelSvgChrome(isDarkMode) {
  return isDarkMode
    ? {
        surface: '#0f172a',
        surfaceVariant: '#1e293b',
        avatarWell: '#334155',
        onSurface: '#f1f5f9',
        onSurfaceMuted: '#e2e8f0',
        segmentStroke: 'rgba(255,255,255,0.12)',
        label: '#ffffff',
      }
    : {
        surface: '#ffffff',
        surfaceVariant: '#f1f5f9',
        avatarWell: '#e2e8f0',
        onSurface: '#0f172a',
        onSurfaceMuted: '#0f172a',
        segmentStroke: 'rgba(0,0,0,0.08)',
        label: '#0f172a',
      };
}

/**
 * Resolve theme → PRIMARY_KEYS entry via token / colorPrimary class.
 * @param {Record<string, string>} theme
 */
export function primaryKeyFromTheme(theme) {
  if (!theme) return 'Purple';
  const token = theme.primary;
  const bg = theme.colorPrimary;
  for (const key of PRIMARY_KEYS) {
    const p = primaryPalettes[key];
    if (p.primary === token || p.colorPrimary === bg) return key;
  }
  return 'Purple';
}

/**
 * Three tones of the active primary.
 * @param {Record<string, string>} theme
 * @returns {[string, string, string]}
 */
export function getWheelSegmentColors(theme) {
  const key = primaryKeyFromTheme(theme);
  return PRIMARY_TONES[key] || PRIMARY_TONES.Purple;
}

/**
 * Tone index so no two adjacent slices (including first↔last) match.
 *
 * Cycle-graph coloring:
 * - Even count → alternate tones 0 and 1
 * - Odd count → alternate 0 and 1, last slice uses tone 2
 *
 * @param {number} segmentCount
 * @param {number} index
 * @returns {0 | 1 | 2}
 */
export function wheelSegmentToneIndex(segmentCount, index) {
  if (segmentCount <= 1) return 0;
  if (segmentCount % 2 === 0) return index % 2;
  if (index === segmentCount - 1) return 2;
  return index % 2;
}

/**
 * Segment fill at index for a wheel with `segmentCount` slices.
 * @param {Record<string, string>} theme
 * @param {number} index
 * @param {number} segmentCount
 */
export function wheelSegmentFill(theme, index, segmentCount) {
  const tones = getWheelSegmentColors(theme);
  return tones[wheelSegmentToneIndex(segmentCount, index)];
}

/** Near-full opacity — tones are already light. */
export const WHEEL_SEGMENT_OPACITY = 0.95;
