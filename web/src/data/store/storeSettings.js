/**
 * Edu.Store settings (Bank/Behavior connect + redeem modes).
 */

import {
  DEFAULT_STORE_SETTINGS,
  normalizeStoreSettings,
} from './storeModel';

export const STORE_SETTINGS_KEY = 'eduHub.store.settings';
export const STORE_SETTINGS_UPDATED_EVENT = 'eduHub.store.settings.updated';

export function readStoreSettings() {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_STORE_SETTINGS };
    return normalizeStoreSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_STORE_SETTINGS };
  }
}

export function writeStoreSettings(patch) {
  const next = normalizeStoreSettings({
    ...readStoreSettings(),
    ...(patch && typeof patch === 'object' ? patch : {}),
  });
  try {
    localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(STORE_SETTINGS_UPDATED_EVENT, {
        detail: { settings: next },
      }),
    );
  } catch {
    /* ignore */
  }
  return next;
}
