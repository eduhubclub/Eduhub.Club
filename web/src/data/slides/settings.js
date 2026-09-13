/**
 * Edu.Slides settings.
 */

import {
  DEFAULT_SLIDES_SETTINGS,
  SLIDES_SETTINGS_UPDATED_EVENT,
  SLIDES_UPDATED_EVENT,
  normalizeSlidesSettings,
} from './types';

const SETTINGS_KEY = 'eduHub.slides.settings';

export function readSlidesSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    return normalizeSlidesSettings(raw);
  } catch {
    return { ...DEFAULT_SLIDES_SETTINGS };
  }
}

/**
 * @param {Partial<typeof DEFAULT_SLIDES_SETTINGS>} patch
 */
export function writeSlidesSettings(patch) {
  const next = normalizeSlidesSettings({
    ...readSlidesSettings(),
    ...(patch && typeof patch === 'object' ? patch : {}),
  });
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SLIDES_SETTINGS_UPDATED_EVENT, { detail: { settings: next } }),
    );
    window.dispatchEvent(new CustomEvent(SLIDES_UPDATED_EVENT));
  }
  return next;
}
