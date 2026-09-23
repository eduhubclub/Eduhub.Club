/**
 * Edu.Headspace localStorage — pets, journal entries, and teacher requests.
 * Class-scoped maps keyed by classId + studentId.
 */

export const PETS_STORAGE_KEY = 'eduHub.headspace.pets';
export const ENTRIES_STORAGE_KEY = 'eduHub.headspace.entries';
export const REQUESTS_STORAGE_KEY = 'eduHub.headspace.requests';
export const HEADSPACE_UPDATED_EVENT = 'eduHub.headspace.updated';

export const ENTRY_STATUS = { private: 'private', shared: 'shared' };
export const REQUEST_STATUS = {
  pending: 'pending',
  fulfilled: 'fulfilled',
  declined: 'declined',
};

/** In-memory fallback for Node/tests when localStorage is unavailable. */
const memoryStores = {
  [PETS_STORAGE_KEY]: {},
  [ENTRIES_STORAGE_KEY]: {},
  [REQUESTS_STORAGE_KEY]: {},
};

function storage() {
  try {
    const root = typeof globalThis !== 'undefined' ? globalThis : null;
    if (root?.localStorage) return root.localStorage;
  } catch {
    /* ignore */
  }
  return null;
}

function readMap(key) {
  const store = storage();
  if (!store) return { ...(memoryStores[key] || {}) };
  try {
    const raw = store.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(key, map) {
  memoryStores[key] = map;
  const store = storage();
  if (store) {
    try {
      store.setItem(key, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(HEADSPACE_UPDATED_EVENT, { detail: { key } }));
    }
  } catch {
    /* ignore */
  }
}

function classBucket(map, classId) {
  const key = String(classId || 'local');
  if (!map[key] || typeof map[key] !== 'object' || Array.isArray(map[key])) {
    map[key] = {};
  }
  return map[key];
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Test helper — clear all headspace stores. */
export function clearHeadspaceStorage() {
  for (const key of [PETS_STORAGE_KEY, ENTRIES_STORAGE_KEY, REQUESTS_STORAGE_KEY]) {
    memoryStores[key] = {};
    try {
      storage()?.removeItem?.(key);
    } catch {
      /* ignore */
    }
  }
}

function normalizeEye(eye) {
  if (!eye || typeof eye !== 'object') return null;
  const x = Number(eye.x);
  const y = Number(eye.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

function normalizeStrokes(strokes) {
  if (!Array.isArray(strokes)) return [];
  return strokes
    .filter((s) => s && Array.isArray(s.points) && s.points.length > 1)
    .map((s) => ({
      type: s.type === 'highlight' ? 'highlight' : 'pen',
      color: String(s.color || '#0f172a'),
      size: Math.max(1, Number(s.size) || 4),
      points: s.points
        .map((p) => ({
          x: Math.max(0, Math.min(1, Number(p.x) || 0)),
          y: Math.max(0, Math.min(1, Number(p.y) || 0)),
        }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    }))
    .filter((s) => s.points.length > 1);
}

/**
 * @returns {{ rockId: string, name: string, eyes: {x:number,y:number}[], strokes: object[], updatedAt: number } | null}
 */
export function getPet(classId, studentId) {
  if (!studentId) return null;
  const pet = readMap(PETS_STORAGE_KEY)?.[String(classId || 'local')]?.[String(studentId)];
  if (!pet || typeof pet !== 'object') return null;
  return {
    rockId: String(pet.rockId || ''),
    name: String(pet.name || '').trim(),
    eyes: (Array.isArray(pet.eyes) ? pet.eyes : []).map(normalizeEye).filter(Boolean).slice(0, 2),
    strokes: normalizeStrokes(pet.strokes),
    updatedAt: Number(pet.updatedAt) || 0,
  };
}

/**
 * Create or replace a student's pet rock.
 * @returns {object} saved pet
 */
export function savePet(classId, studentId, pet) {
  if (!studentId) throw new Error('studentId is required');
  const map = readMap(PETS_STORAGE_KEY);
  const bucket = classBucket(map, classId);
  const eyes = (Array.isArray(pet?.eyes) ? pet.eyes : [])
    .map(normalizeEye)
    .filter(Boolean)
    .slice(0, 2);
  const next = {
    rockId: String(pet?.rockId || ''),
    name: String(pet?.name || '').trim(),
    eyes,
    strokes: normalizeStrokes(pet?.strokes),
    updatedAt: Date.now(),
  };
  bucket[String(studentId)] = next;
  writeMap(PETS_STORAGE_KEY, map);
  return next;
}

export function listPets(classId) {
  const bucket = readMap(PETS_STORAGE_KEY)?.[String(classId || 'local')] || {};
  return Object.entries(bucket).map(([studentId, pet]) => ({
    studentId,
    pet: getPet(classId, studentId) || pet,
  }));
}

/**
 * @returns {Array<{ id, dateISO, mood, body, status, sharedAt?, requestId?, createdAt }>}
 */
export function listEntries(classId, studentId) {
  if (!studentId) return [];
  const list = readMap(ENTRIES_STORAGE_KEY)?.[String(classId || 'local')]?.[String(studentId)];
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e === 'object')
    .map((e) => ({
      id: String(e.id),
      dateISO: String(e.dateISO || ''),
      mood: String(e.mood || ''),
      body: String(e.body || ''),
      status: e.status === ENTRY_STATUS.shared ? ENTRY_STATUS.shared : ENTRY_STATUS.private,
      sharedAt: e.sharedAt ? Number(e.sharedAt) : undefined,
      requestId: e.requestId ? String(e.requestId) : undefined,
      createdAt: Number(e.createdAt) || 0,
    }))
    .sort((a, b) => b.createdAt - a.createdAt || b.dateISO.localeCompare(a.dateISO));
}

/**
 * Add a journal entry. Defaults to private.
 * @param {{ mood: string, body: string, dateISO?: string, status?: 'private'|'shared', requestId?: string }} payload
 */
export function addEntry(classId, studentId, payload) {
  if (!studentId) throw new Error('studentId is required');
  const mood = String(payload?.mood || '');
  const body = String(payload?.body || '').trim();
  if (!mood) throw new Error('mood is required');
  if (!body) throw new Error('body is required');

  const map = readMap(ENTRIES_STORAGE_KEY);
  const bucket = classBucket(map, classId);
  const sid = String(studentId);
  const list = Array.isArray(bucket[sid]) ? [...bucket[sid]] : [];
  const status =
    payload?.status === ENTRY_STATUS.shared ? ENTRY_STATUS.shared : ENTRY_STATUS.private;
  const entry = {
    id: newId('entry'),
    dateISO: String(payload?.dateISO || todayISO()),
    mood,
    body,
    status,
    sharedAt: status === ENTRY_STATUS.shared ? Date.now() : undefined,
    requestId: payload?.requestId ? String(payload.requestId) : undefined,
    createdAt: Date.now(),
  };
  list.unshift(entry);
  bucket[sid] = list.slice(0, 200);
  writeMap(ENTRIES_STORAGE_KEY, map);
  return entry;
}

/** Mark an existing entry as shared with the teacher. */
export function shareEntry(classId, studentId, entryId, requestId) {
  if (!studentId || !entryId) return null;
  const map = readMap(ENTRIES_STORAGE_KEY);
  const bucket = classBucket(map, classId);
  const sid = String(studentId);
  const list = Array.isArray(bucket[sid]) ? [...bucket[sid]] : [];
  const idx = list.findIndex((e) => String(e?.id) === String(entryId));
  if (idx < 0) return null;
  const next = {
    ...list[idx],
    status: ENTRY_STATUS.shared,
    sharedAt: Date.now(),
    requestId: requestId ? String(requestId) : list[idx].requestId,
  };
  list[idx] = next;
  bucket[sid] = list;
  writeMap(ENTRIES_STORAGE_KEY, map);
  return next;
}

/** All shared entries for a class (teacher inbox). */
export function listSharedEntries(classId) {
  const bucket = readMap(ENTRIES_STORAGE_KEY)?.[String(classId || 'local')] || {};
  const rows = [];
  for (const [studentId, list] of Object.entries(bucket)) {
    if (!Array.isArray(list)) continue;
    for (const e of list) {
      if (e?.status !== ENTRY_STATUS.shared) continue;
      rows.push({
        studentId,
        entry: {
          id: String(e.id),
          dateISO: String(e.dateISO || ''),
          mood: String(e.mood || ''),
          body: String(e.body || ''),
          status: ENTRY_STATUS.shared,
          sharedAt: Number(e.sharedAt) || 0,
          requestId: e.requestId ? String(e.requestId) : undefined,
          createdAt: Number(e.createdAt) || 0,
        },
      });
    }
  }
  rows.sort(
    (a, b) =>
      (b.entry.sharedAt || b.entry.createdAt) - (a.entry.sharedAt || a.entry.createdAt),
  );
  return rows;
}

export function getRequest(classId, studentId) {
  if (!studentId) return null;
  const req = readMap(REQUESTS_STORAGE_KEY)?.[String(classId || 'local')]?.[String(studentId)];
  if (!req || typeof req !== 'object') return null;
  return {
    id: String(req.id),
    requestedAt: Number(req.requestedAt) || 0,
    note: req.note ? String(req.note) : '',
    status: Object.values(REQUEST_STATUS).includes(req.status)
      ? req.status
      : REQUEST_STATUS.pending,
  };
}

export function listRequests(classId, statusFilter) {
  const bucket = readMap(REQUESTS_STORAGE_KEY)?.[String(classId || 'local')] || {};
  return Object.entries(bucket)
    .map(([studentId, req]) => ({
      studentId,
      request: getRequest(classId, studentId) || req,
    }))
    .filter((row) => (statusFilter ? row.request?.status === statusFilter : true))
    .sort((a, b) => (b.request?.requestedAt || 0) - (a.request?.requestedAt || 0));
}

/** Teacher requests a journal entry from a student. */
export function createRequest(classId, studentId, note = '') {
  if (!studentId) throw new Error('studentId is required');
  const map = readMap(REQUESTS_STORAGE_KEY);
  const bucket = classBucket(map, classId);
  const next = {
    id: newId('req'),
    requestedAt: Date.now(),
    note: String(note || '').trim(),
    status: REQUEST_STATUS.pending,
  };
  bucket[String(studentId)] = next;
  writeMap(REQUESTS_STORAGE_KEY, map);
  return next;
}

export function cancelRequest(classId, studentId) {
  if (!studentId) return false;
  const map = readMap(REQUESTS_STORAGE_KEY);
  const bucket = classBucket(map, classId);
  const sid = String(studentId);
  if (!bucket[sid]) return false;
  delete bucket[sid];
  writeMap(REQUESTS_STORAGE_KEY, map);
  return true;
}

export function setRequestStatus(classId, studentId, status) {
  if (!studentId) return null;
  if (!Object.values(REQUEST_STATUS).includes(status)) return null;
  const map = readMap(REQUESTS_STORAGE_KEY);
  const bucket = classBucket(map, classId);
  const sid = String(studentId);
  const prev = bucket[sid];
  if (!prev) return null;
  const next = { ...prev, status };
  bucket[sid] = next;
  writeMap(REQUESTS_STORAGE_KEY, map);
  return next;
}

/**
 * Save a private or shared entry; if shared and a pending request exists, fulfill it.
 */
export function submitEntry(classId, studentId, { mood, body, share, dateISO }) {
  const pending = getRequest(classId, studentId);
  const requestId =
    share && pending?.status === REQUEST_STATUS.pending ? pending.id : undefined;
  const entry = addEntry(classId, studentId, {
    mood,
    body,
    dateISO,
    status: share ? ENTRY_STATUS.shared : ENTRY_STATUS.private,
    requestId,
  });
  if (requestId) {
    setRequestStatus(classId, studentId, REQUEST_STATUS.fulfilled);
  }
  return entry;
}

export function declineRequest(classId, studentId) {
  return setRequestStatus(classId, studentId, REQUEST_STATUS.declined);
}

export { todayISO };
