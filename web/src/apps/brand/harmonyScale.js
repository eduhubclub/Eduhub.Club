/**
 * Harmony row scales — same HCT generator as Color Test; circle marks recommendedLevel.
 * Primary (isSeed) pins the exact seed hex on the recommended step so it matches the picker.
 */

import { bestOnColor } from '../../shared/colorContrast';
import { generateScale } from './colorScaleGenerator';

/**
 * @param {{ seedHex?: string, hex: string, recommendedLevel?: string, isSeed?: boolean }} color
 */
export function generateHarmonyScale(color) {
  const hex = (color.seedHex || color.hex || '').toLowerCase();
  const scale = generateScale(hex);
  const recommendedLevel =
    color.recommendedLevel ||
    scale.find((s) => s.isSeed)?.level ||
    '500';

  return scale.map((swatch) => {
    const isRecommended = swatch.level === recommendedLevel;
    // Keep Primary marker identical to the Color Test seed (incl. after Adjust).
    const pinnedHex =
      color.isSeed && isRecommended && hex ? hex : swatch.hex;
    const on =
      pinnedHex !== swatch.hex ? bestOnColor(pinnedHex) : null;
    return {
      ...swatch,
      hex: pinnedHex,
      onHex: on?.hex ?? swatch.onHex,
      onDark: on ? on.token === 'white' : swatch.onDark,
      contrast: on?.ratio ?? swatch.contrast,
      passesAA: on?.passesAA ?? swatch.passesAA,
      isRecommended,
    };
  });
}
