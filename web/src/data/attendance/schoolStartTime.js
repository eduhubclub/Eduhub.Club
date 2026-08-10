/**
 * School start time preference for Attendance.
 * After this local time on the active day, unmarked students become tardy.
 */

export const SCHOOL_START_STORAGE_KEY = 'eduHub.attendance.schoolStartTime';
export const SCHOOL_START_UPDATED_EVENT = 'eduHub.attendance.schoolStartTime.updated';

/** @returns {string|null} "HH:mm" or null when unset / invalid */
export function readSchoolStartTime() {
  try {
    const raw = localStorage.getItem(SCHOOL_START_STORAGE_KEY);
    return normalizeSchoolStartTime(raw);
  } catch {
    return null;
  }
}

/** @param {string|null|undefined} value */
export function writeSchoolStartTime(value) {
  const next = normalizeSchoolStartTime(value);
  try {
    if (!next) localStorage.removeItem(SCHOOL_START_STORAGE_KEY);
    else localStorage.setItem(SCHOOL_START_STORAGE_KEY, next);
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SCHOOL_START_UPDATED_EVENT, { detail: { schoolStartTime: next } }),
    );
  }
  return next;
}

/** @returns {string|null} */
export function normalizeSchoolStartTime(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
}

/**
 * @param {string|null|undefined} startTime
 * @param {Date} [now]
 */
export function isPastSchoolStart(startTime, now = new Date()) {
  const normalized = normalizeSchoolStartTime(startTime);
  if (!normalized) return false;
  const [h, min] = normalized.split(':').map(Number);
  const startMinutes = h * 60 + min;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= startMinutes;
}

/**
 * Mark every roster student without a status as tardy.
 * No-op when start time unset, before start, wrong day, or already submitted.
 *
 * @param {object} day
 * @param {Array<{id: string|number}>} roster
 * @param {{ startTime?: string|null, now?: Date, dayKey?: string, todayKey?: string }} opts
 */
export function applySchoolStartTardy(day, roster, opts = {}) {
  const startTime = opts.startTime;
  const now = opts.now instanceof Date ? opts.now : new Date();
  const todayKey = opts.todayKey;
  const dayKey = opts.dayKey;

  if (!normalizeSchoolStartTime(startTime)) return day;
  if (!day || typeof day !== 'object') return day;
  if (day.submitted) return day;
  if (todayKey != null && dayKey != null && dayKey !== todayKey) return day;
  if (!isPastSchoolStart(startTime, now)) return day;

  const marks = { ...(day.marks || {}) };
  let changed = false;
  for (const student of roster || []) {
    const id = String(student.id);
    if (!marks[id]) {
      marks[id] = 'tardy';
      changed = true;
    }
  }
  if (!changed) return day;
  return { ...day, marks, submitted: false };
}
