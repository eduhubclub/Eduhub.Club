/**
 * Rolling-month attendance history for Demo Class (`demo-3rd-grade`).
 * Regenerates when the calendar day changes so “today” is always free to practice.
 */

import { SEED_CLASSES } from '../classes/seed';
import {
  CHECK_IN_DEADLINE,
  dateKey,
  emptyDayRecord,
  normalizeClassRecord,
  normalizeDayRecord,
  normalizeGoals,
} from './attendanceModel';

export const DEMO_ATTENDANCE_CLASS_ID = 'demo-3rd-grade';

/** Look back this many calendar days (weekends skipped) for sample history. */
const ROLLING_CALENDAR_DAYS = 35;

function hashString(value) {
  let h = 2166136261;
  const s = String(value);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function parseDateKey(key) {
  const [y, m, d] = String(key)
    .split('-')
    .map((n) => Number(n));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null;
  }
  return new Date(y, m - 1, d);
}

function addDays(date, delta) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + delta);
  return next;
}

function isWeekday(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function getDemoAttendanceRoster() {
  const cls = SEED_CLASSES.find((c) => c.id === DEMO_ATTENDANCE_CLASS_ID);
  return cls?.studentList || [];
}

/**
 * Deterministic status for a student on a past school day.
 * Roughly: mostly present, some tardy / absent / excused.
 */
export function demoStatusFor(studentId, dayKeyStr) {
  const bucket = hashString(`${studentId}|${dayKeyStr}|status`) % 100;
  if (bucket < 78) return 'present';
  if (bucket < 88) return 'tardy';
  if (bucket < 95) return 'absent';
  return 'excused';
}

function demoLunchFor(studentId, dayKeyStr, status) {
  if (status !== 'present' && status !== 'tardy') return null;
  return hashString(`${studentId}|${dayKeyStr}|lunch`) % 100 < 55
    ? 'school'
    : 'home';
}

/** HH:mm before or after the check-in shout-out deadline. */
function demoCheckInFor(studentId, dayKeyStr, status) {
  if (status !== 'present' && status !== 'tardy') return null;
  const early = hashString(`${studentId}|${dayKeyStr}|checkin`) % 100 < 70;
  if (early) {
    const minute = hashString(`${studentId}|${dayKeyStr}|min`) % 50;
    return `08:${String(minute).padStart(2, '0')}`;
  }
  // After deadline — still checked in, but not Check In Champion material.
  const [h, m] = CHECK_IN_DEADLINE.split(':').map(Number);
  const afterMin = m + 5 + (hashString(`${studentId}|${dayKeyStr}|late`) % 40);
  const hour = h + Math.floor(afterMin / 60);
  const minute = afterMin % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function buildSubmittedDay(roster, dayKeyStr) {
  const marks = {};
  const lunch = {};
  const checkIns = {};
  for (const student of roster || []) {
    const id = String(student.id);
    const status = demoStatusFor(id, dayKeyStr);
    marks[id] = status;
    const lunchChoice = demoLunchFor(id, dayKeyStr, status);
    if (lunchChoice) lunch[id] = lunchChoice;
    const checkIn = demoCheckInFor(id, dayKeyStr, status);
    if (checkIn) checkIns[id] = checkIn;
  }
  return normalizeDayRecord({
    submitted: true,
    marks,
    lunch,
    checkIns,
  });
}

/**
 * Build a class attendance record with weekday history ending yesterday,
 * plus an empty “today” for live practice.
 *
 * @param {Array<{id: string|number}>} roster
 * @param {string} todayKey YYYY-MM-DD
 * @param {{ goals?: object }} [opts]
 */
export function buildRollingMonthDemoAttendance(roster, todayKey, opts = {}) {
  const today = parseDateKey(todayKey) || new Date();
  const todayStr = dateKey(today);
  const days = {};

  for (let back = 1; back <= ROLLING_CALENDAR_DAYS; back += 1) {
    const date = addDays(today, -back);
    if (!isWeekday(date)) continue;
    const key = dateKey(date);
    days[key] = buildSubmittedDay(roster, key);
  }

  // Practice day — unmarked / unsubmitted so Daily Attendance stays interactive.
  days[todayStr] = emptyDayRecord();

  return normalizeClassRecord({
    days,
    goals: normalizeGoals(opts.goals),
    demoSeedAsOf: todayStr,
  });
}

/**
 * Refresh demo attendance when the calendar day advances.
 * Preserves in-progress marks on today if the teacher already started.
 *
 * @returns {{ record: object, didWrite: boolean }}
 */
export function ensureDemoAttendanceRecord(classId, existing, now = new Date()) {
  if (String(classId) !== DEMO_ATTENDANCE_CLASS_ID) {
    return { record: normalizeClassRecord(existing), didWrite: false };
  }

  const today = dateKey(now);
  const current = normalizeClassRecord(existing);
  if (current.demoSeedAsOf === today) {
    return { record: current, didWrite: false };
  }

  const roster = getDemoAttendanceRoster();
  const built = buildRollingMonthDemoAttendance(roster, today, {
    goals: current.goals,
  });

  const todayExisting = current.days[today];
  if (
    todayExisting &&
    (Object.keys(todayExisting.marks || {}).length > 0 || todayExisting.submitted)
  ) {
    built.days[today] = normalizeDayRecord(todayExisting);
  }

  return { record: built, didWrite: true };
}
