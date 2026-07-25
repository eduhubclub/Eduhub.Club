import { PRIMARY_KEYS, primaryPalettes } from '../../shared/theme';

/**
 * HubBrand Overview bumper words.
 * Rolls through each Settings primary theme, then lands on BrandGuidelines (Pink).
 */

const APP_NAMES = ['Hub', 'Classes', 'Groups', 'Students', 'Games', 'Timer'];

/** All primaries except Pink — saved for the final BrandGuidelines lockup. */
const ROTATE_KEYS = PRIMARY_KEYS.filter((key) => key !== 'Pink');

export const BUMPER_APPS = ROTATE_KEYS.map((key, i) => ({
  name: APP_NAMES[i % APP_NAMES.length],
  primaryKey: key,
  colorClass: primaryPalettes[key].text,
}));

export const BUMPER_FINAL = {
  name: 'BrandGuidelines',
  primaryKey: 'Pink',
  colorClass: primaryPalettes.Pink.text,
};

export const BUMPER_WORDS = [...BUMPER_APPS, BUMPER_FINAL];

export const BUMPER_FINAL_INDEX = BUMPER_WORDS.length - 1;

/** Longest name drives the reel window width (ch). */
export const BUMPER_SLIDER_CHS =
  Math.max(...BUMPER_WORDS.map((a) => a.name.length)) + 0.5;
