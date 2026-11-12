/**
 * Writing Buddy teacher prefs (localStorage).
 */

const KEY = 'eduHub.writingBuddy.settings';
export const WRITING_BUDDY_SETTINGS_EVENT = 'eduHub.writingBuddy.settings';

/** @typedef {{ allowCustomBuddyPhotos: boolean }} WritingBuddySettings */

function defaults() {
  return {
    allowCustomBuddyPhotos: true,
  };
}

function readRaw() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @returns {WritingBuddySettings}
 */
export function readWritingBuddySettings() {
  const raw = readRaw();
  return {
    allowCustomBuddyPhotos: raw.allowCustomBuddyPhotos !== false,
  };
}

/**
 * @param {Partial<WritingBuddySettings>} patch
 * @returns {WritingBuddySettings}
 */
export function writeWritingBuddySettings(patch) {
  const next = {
    ...readWritingBuddySettings(),
    ...(patch && typeof patch === 'object' ? patch : {}),
  };
  next.allowCustomBuddyPhotos = Boolean(next.allowCustomBuddyPhotos);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WRITING_BUDDY_SETTINGS_EVENT, { detail: next }),
    );
  }
  return next;
}

export function readAllowCustomBuddyPhotos() {
  return readWritingBuddySettings().allowCustomBuddyPhotos;
}

export function writeAllowCustomBuddyPhotos(on) {
  return writeWritingBuddySettings({ allowCustomBuddyPhotos: Boolean(on) })
    .allowCustomBuddyPhotos;
}
