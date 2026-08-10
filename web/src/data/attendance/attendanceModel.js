/**
 * Attendance domain helpers — statuses, day records, goals math.
 */

export const ATTENDANCE_STATUSES = ['present', 'absent', 'tardy', 'excused'];

export const STATUS_META = {
  present: { label: 'Present', tone: 'emerald' },
  absent: { label: 'Absent', tone: 'rose' },
  tardy: { label: 'Tardy', tone: 'amber' },
  excused: { label: 'Excused', tone: 'sky' },
};

export const LUNCH_CHOICES = ['school', 'home'];

export const DEFAULT_GOALS = {
  yearlyPercent: 95,
  monthlyPercent: 95,
  schoolDays: 180,
};

/** Local calendar date key YYYY-MM-DD. */
export function dateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isHereStatus(status) {
  return status === 'present' || status === 'tardy';
}

export function countsTowardPercent(status) {
  return status === 'present' || status === 'tardy';
}

/** Excused is marked but excluded from % denominator. */
export function inPercentDenominator(status) {
  return status === 'present' || status === 'tardy' || status === 'absent';
}

export function emptyDayRecord() {
  return {
    submitted: false,
    marks: {},
    lunch: {},
    checkIns: {},
  };
}

export function emptyClassRecord() {
  return {
    days: {},
    goals: { ...DEFAULT_GOALS },
    demoSeedAsOf: null,
  };
}

export function normalizeStatus(value) {
  return ATTENDANCE_STATUSES.includes(value) ? value : null;
}

export function normalizeLunch(value) {
  return LUNCH_CHOICES.includes(value) ? value : null;
}

export function normalizeDayRecord(raw) {
  const base = emptyDayRecord();
  if (!raw || typeof raw !== 'object') return base;
  const marks = {};
  for (const [id, status] of Object.entries(raw.marks || {})) {
    const s = normalizeStatus(status);
    if (s) marks[String(id)] = s;
  }
  const lunch = {};
  for (const [id, choice] of Object.entries(raw.lunch || {})) {
    const c = normalizeLunch(choice);
    if (c) lunch[String(id)] = c;
  }
  const checkIns = {};
  for (const [id, time] of Object.entries(raw.checkIns || {})) {
    const t = normalizeCheckInTime(time);
    if (t) checkIns[String(id)] = t;
  }
  return {
    submitted: Boolean(raw.submitted),
    marks,
    lunch,
    checkIns,
  };
}

/** Local HH:mm for check-in shout-outs. */
export function normalizeCheckInTime(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
}

export function formatCheckInNow(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Default check-in shout-out cutoff (inclusive before). */
export const CHECK_IN_DEADLINE = '09:10';

export function isEarlyCheckIn(time, deadline = CHECK_IN_DEADLINE) {
  const t = normalizeCheckInTime(time);
  const d = normalizeCheckInTime(deadline);
  if (!t || !d) return false;
  return t < d;
}

export function normalizeGoals(raw) {
  const g = raw && typeof raw === 'object' ? raw : {};
  return {
    yearlyPercent: clampPercent(g.yearlyPercent ?? DEFAULT_GOALS.yearlyPercent),
    monthlyPercent: clampPercent(
      g.monthlyPercent ?? DEFAULT_GOALS.monthlyPercent,
    ),
    schoolDays: Math.max(
      1,
      Math.min(366, Number(g.schoolDays) || DEFAULT_GOALS.schoolDays),
    ),
  };
}

function clampPercent(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 95;
  return Math.max(50, Math.min(100, Math.round(v)));
}

export function normalizeClassRecord(raw) {
  const base = emptyClassRecord();
  if (!raw || typeof raw !== 'object') return base;
  const days = {};
  for (const [key, day] of Object.entries(raw.days || {})) {
    days[key] = normalizeDayRecord(day);
  }
  const asOf =
    typeof raw.demoSeedAsOf === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw.demoSeedAsOf)
      ? raw.demoSeedAsOf
      : null;
  return {
    days,
    goals: normalizeGoals(raw.goals),
    demoSeedAsOf: asOf,
  };
}

/** Drop marks/lunch/checkIns for students no longer on the roster. */
export function syncDayWithRoster(day, roster) {
  const ids = new Set((roster || []).map((s) => String(s.id)));
  const next = normalizeDayRecord(day);
  const marks = {};
  const lunch = {};
  const checkIns = {};
  for (const [id, status] of Object.entries(next.marks)) {
    if (ids.has(id)) marks[id] = status;
  }
  for (const [id, choice] of Object.entries(next.lunch)) {
    if (ids.has(id)) lunch[id] = choice;
  }
  for (const [id, time] of Object.entries(next.checkIns)) {
    if (ids.has(id)) checkIns[id] = time;
  }
  return { ...next, marks, lunch, checkIns };
}

export function countMarks(day, roster) {
  const d = normalizeDayRecord(day);
  const counts = {
    present: 0,
    absent: 0,
    tardy: 0,
    excused: 0,
    unmarked: 0,
    total: (roster || []).length,
  };
  for (const s of roster || []) {
    const status = d.marks[String(s.id)] || null;
    if (!status) counts.unmarked += 1;
    else if (counts[status] != null) counts[status] += 1;
  }
  return counts;
}

/**
 * Class attendance % for a set of day records.
 * present+tardy / (present+tardy+absent); excused excluded from denominator.
 */
export function classAttendancePercent(daysMap, roster, predicate) {
  let attending = 0;
  let denom = 0;
  for (const [key, day] of Object.entries(daysMap || {})) {
    if (predicate && !predicate(key, day)) continue;
    if (!day?.submitted) continue;
    for (const s of roster || []) {
      const status = day.marks?.[String(s.id)];
      if (!status || !inPercentDenominator(status)) continue;
      denom += 1;
      if (countsTowardPercent(status)) attending += 1;
    }
  }
  if (!denom) return 0;
  return Math.round((attending / denom) * 1000) / 10;
}

export function monthKeyParts(dateKeyStr) {
  const [y, m] = String(dateKeyStr).split('-').map(Number);
  return { year: y, month: m }; // month 1-12
}

export function isInMonth(dateKeyStr, year, monthIndex0) {
  const { year: y, month: m } = monthKeyParts(dateKeyStr);
  return y === year && m === monthIndex0 + 1;
}

/** Per-student present+tardy day counts for submitted days in a month. */
export function studentAttendingDays(daysMap, roster, year, monthIndex0) {
  const out = {};
  for (const s of roster || []) out[String(s.id)] = 0;
  for (const [key, day] of Object.entries(daysMap || {})) {
    if (!day?.submitted || !isInMonth(key, year, monthIndex0)) continue;
    for (const s of roster || []) {
      const id = String(s.id);
      const status = day.marks?.[id];
      if (countsTowardPercent(status)) out[id] = (out[id] || 0) + 1;
    }
  }
  return out;
}

/** Per-student early check-in day counts (before deadline) for submitted days in a month. */
export function studentEarlyCheckInDays(
  daysMap,
  roster,
  year,
  monthIndex0,
  deadline = CHECK_IN_DEADLINE,
) {
  const out = {};
  for (const s of roster || []) out[String(s.id)] = 0;
  for (const [key, day] of Object.entries(daysMap || {})) {
    if (!day?.submitted || !isInMonth(key, year, monthIndex0)) continue;
    for (const s of roster || []) {
      const id = String(s.id);
      const status = day.marks?.[id];
      if (!countsTowardPercent(status)) continue;
      if (isEarlyCheckIn(day.checkIns?.[id], deadline)) {
        out[id] = (out[id] || 0) + 1;
      }
    }
  }
  return out;
}

/**
 * Pick the student with the highest day count.
 * Ties rotate daily so a different tied student is featured each calendar day.
 *
 * @param {Array} roster
 * @param {Record<string, number>} attendingById
 * @param {string} [rotateDayKey] YYYY-MM-DD (defaults to today)
 * @param {string} [rotateSalt] keeps Attendance vs Check In rotation independent when sets match
 */
export function pickChampion(
  roster,
  attendingById,
  rotateDayKey = dateKey(),
  rotateSalt = '',
) {
  let bestCount = 0;
  const tied = [];
  for (const s of roster || []) {
    const n = attendingById[String(s.id)] || 0;
    if (n <= 0) continue;
    if (n > bestCount) {
      bestCount = n;
      tied.length = 0;
      tied.push(s);
    } else if (n === bestCount) {
      tied.push(s);
    }
  }
  if (!tied.length || bestCount <= 0) return null;
  tied.sort((a, b) =>
    studentSortKey(a).localeCompare(studentSortKey(b)),
  );
  const index = dailyRotateIndex(rotateDayKey, rotateSalt, tied.length);
  return { student: tied[index], days: bestCount };
}

/** Stable day-based index into a sorted tie list (0 … length-1). */
export function dailyRotateIndex(dayKeyStr, salt, length) {
  const len = Math.max(0, Number(length) || 0);
  if (len <= 1) return 0;
  const parts = String(dayKeyStr || '')
    .split('-')
    .map((p) => Number(p));
  const [y, m, d] = parts;
  const hasDate =
    Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d);
  // UTC day serial so consecutive calendar days advance by 1.
  const daySerial = hasDate
    ? Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
    : 0;
  let saltHash = 0;
  const saltStr = String(salt || '');
  for (let i = 0; i < saltStr.length; i += 1) {
    saltHash = (saltHash * 31 + saltStr.charCodeAt(i)) >>> 0;
  }
  return ((daySerial + saltHash) % len + len) % len;
}

/** Top N students by present+tardy days (descending). */
export function pickTopAttenders(roster, attendingById, limit = 5) {
  return (roster || [])
    .map((student) => ({
      student,
      days: attendingById[String(student.id)] || 0,
    }))
    .filter((row) => row.days > 0)
    .sort((a, b) => b.days - a.days || studentSortKey(a.student).localeCompare(studentSortKey(b.student)))
    .slice(0, Math.max(1, limit));
}

function studentSortKey(student) {
  return String(student?.name || student?.id || '');
}

/** Submit: unmarked → absent; clear lunch for absents; set submitted. */
export function submitDay(day, roster) {
  const next = normalizeDayRecord(day);
  const marks = { ...next.marks };
  const lunch = { ...next.lunch };
  for (const s of roster || []) {
    const id = String(s.id);
    if (!marks[id]) marks[id] = 'absent';
    if (marks[id] === 'absent') delete lunch[id];
  }
  return { ...next, marks, lunch, submitted: true };
}
