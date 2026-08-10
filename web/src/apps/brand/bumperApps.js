import { primaryPalettes } from '../../shared/theme';

/**
 * HubBrand Overview bumper words.
 * Opens on Edu.Hub (Blue), rolls a blue-first rainbow through the apps,
 * then lands on BrandGuidelines (Pink).
 * Names must be unique — React keys the reel by `name`.
 */

/**
 * Roll order — Hub first (product blue), then spectrum:
 * Blue → Indigo → Purple → Brown → Red → Orange → Amber → Emerald,
 * with remaining apps after the first pass. Pink reserved for the finale.
 */
const BUMPER_ROLL = [
  { name: 'Hub', primaryKey: 'Blue' },
  { name: 'Students', primaryKey: 'Indigo' },
  { name: 'Randomizer', primaryKey: 'Purple' },
  { name: 'TieBreaker', primaryKey: 'Brown' },
  { name: 'Attendance', primaryKey: 'Red' },
  { name: 'Groups', primaryKey: 'Orange' },
  { name: 'NoiseMeter', primaryKey: 'Amber' },
  { name: 'Classes', primaryKey: 'Emerald' },
  { name: 'Dashboard', primaryKey: 'Blue' },
  { name: 'Timer', primaryKey: 'Emerald' },
  { name: 'Bank', primaryKey: 'Red' },
  { name: 'MathTools', primaryKey: 'Blue' },
];

export const BUMPER_APPS = BUMPER_ROLL.map(({ name, primaryKey }) => ({
  name,
  primaryKey,
  colorClass: primaryPalettes[primaryKey].text,
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
