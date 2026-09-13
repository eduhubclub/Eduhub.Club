/**
 * Edu.Library settings (loan length, max books, self-checkout).
 */

import {
  DEFAULT_LIBRARY_SETTINGS,
  LIBRARY_UPDATED_EVENT,
  normalizeLibrarySettings,
} from './types';

const SETTINGS_KEY = 'eduHub.library.settings';

export const LIBRARY_SETTINGS_UPDATED_EVENT = 'eduHub.library.settings.updated';

export function readLibrarySettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    return normalizeLibrarySettings(raw);
  } catch {
    return { ...DEFAULT_LIBRARY_SETTINGS };
  }
}

/**
 * @param {Partial<typeof DEFAULT_LIBRARY_SETTINGS>} patch
 */
export function writeLibrarySettings(patch) {
  const next = normalizeLibrarySettings({
    ...readLibrarySettings(),
    ...(patch && typeof patch === 'object' ? patch : {}),
  });
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(LIBRARY_SETTINGS_UPDATED_EVENT, { detail: { settings: next } }),
    );
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT));
  }
  return next;
}
