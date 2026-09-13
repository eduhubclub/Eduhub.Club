import { isOfTheDayType, OF_THE_DAY_UPDATED_EVENT } from './types';

const PICKS_KEY = 'eduHub.ofTheDay.picks';
const SAVED_KEY = 'eduHub.ofTheDay.saved';
const ITEMS_KEY = 'eduHub.ofTheDay.teacherItems';

function readJson(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    return raw == null ? fallback : raw;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OF_THE_DAY_UPDATED_EVENT));
  }
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {string} dateKey
 * @returns {Record<string, string>}
 */
export function readDayPicks(dateKey) {
  const all = readJson(PICKS_KEY, {});
  const row = all && typeof all === 'object' ? all[String(dateKey)] : null;
  return row && typeof row === 'object' ? { ...row } : {};
}

/**
 * @param {string} dateKey
 * @param {string} type
 * @param {string} itemId
 */
export function setDayPick(dateKey, type, itemId) {
  const all = readJson(PICKS_KEY, {});
  const next = {
    ...all,
    [String(dateKey)]: {
      ...(all[String(dateKey)] || {}),
      [type]: String(itemId),
    },
  };
  writeJson(PICKS_KEY, next);
  return readDayPicks(dateKey);
}

/**
 * Apply a full pick map onto a date (Saved → today).
 * @param {string} dateKey
 * @param {Record<string, string>} picks
 */
export function writeDayPicks(dateKey, picks) {
  const all = readJson(PICKS_KEY, {});
  all[String(dateKey)] = { ...(picks || {}) };
  writeJson(PICKS_KEY, all);
  return readDayPicks(dateKey);
}

/**
 * @returns {Array<{ id: string, title: string, body: string, type: string, listenUrl?: string, source?: string }>}
 */
export function readTeacherItems() {
  const list = readJson(ITEMS_KEY, []);
  return Array.isArray(list) ? list : [];
}

/**
 * @param {{ type: string, title: string, body?: string, listenUrl?: string }} input
 */
export function addTeacherItem(input) {
  const type = String(input?.type || '');
  const title = String(input?.title || '').trim();
  const body = String(input?.body || '').trim();
  if (!isOfTheDayType(type) || type === 'word' || !title) return null;
  const item = {
    id: newId('custom'),
    type,
    title,
    body: body || title,
    listenUrl: String(input.listenUrl || '').trim(),
    source: 'Teacher',
    visibility: input.visibility === 'public' ? 'public' : 'private',
  };
  const next = [item, ...readTeacherItems()];
  writeJson(ITEMS_KEY, next);
  return item;
}

/**
 * @param {string} id
 */
export function deleteTeacherItem(id) {
  writeJson(
    ITEMS_KEY,
    readTeacherItems().filter((row) => row.id !== String(id)),
  );
}

/**
 * @param {string} id
 * @param {'public' | 'private'} visibility
 */
export function setTeacherItemVisibility(id, visibility) {
  const nextVis = visibility === 'public' ? 'public' : 'private';
  writeJson(
    ITEMS_KEY,
    readTeacherItems().map((row) =>
      row.id === String(id) ? { ...row, visibility: nextVis } : row,
    ),
  );
}

export function readCommunityItems() {
  return readTeacherItems().filter((row) => row.visibility === 'public');
}

/**
 * @returns {Array<{ id: string, label: string, createdAt: string, picks: Record<string, string> }>}
 */
export function readSavedSets() {
  const list = readJson(SAVED_KEY, []);
  return Array.isArray(list) ? list : [];
}

/**
 * @param {{ label?: string, picks: Record<string, string> }} input
 */
export function saveSet(input) {
  const picks = input?.picks && typeof input.picks === 'object' ? { ...input.picks } : {};
  const row = {
    id: newId('saved'),
    label: String(input?.label || 'Saved day').trim() || 'Saved day',
    createdAt: new Date().toISOString(),
    picks,
  };
  writeJson(SAVED_KEY, [row, ...readSavedSets()]);
  return row;
}

/**
 * @param {string} id
 */
export function deleteSavedSet(id) {
  writeJson(
    SAVED_KEY,
    readSavedSets().filter((row) => row.id !== String(id)),
  );
}

/**
 * @param {string} id
 */
export function getSavedSet(id) {
  return readSavedSets().find((row) => row.id === String(id)) || null;
}
