/**
 * Write helpers for Morning Meeting student self check-in / lunch.
 * Mirrors AttendanceContext setMark / setLunch against todayPresence storage.
 */

import {
  dateKey,
  emptyDayRecord,
  formatCheckInNow,
  normalizeClassRecord,
  normalizeDayRecord,
  normalizeLunch,
  syncDayWithRoster,
} from '../../data/attendance/attendanceModel';
import {
  dispatchAttendanceUpdated,
  getClassAttendanceRecord,
  getDayRecord,
  writeClassAttendanceRecord,
} from '../../data/attendance/todayPresence';

/**
 * @param {string} classId
 * @param {string} dayKey
 * @param {(day: object) => object} updater
 * @param {unknown[]} [roster]
 */
function patchToday(classId, dayKey, updater, roster = []) {
  if (!classId) return null;
  const record = normalizeClassRecord(getClassAttendanceRecord(classId));
  const current = syncDayWithRoster(
    record.days[dayKey] || emptyDayRecord(),
    roster,
  );
  const updated = normalizeDayRecord(updater(current));
  const next = {
    ...record,
    days: {
      ...record.days,
      [dayKey]: updated,
    },
  };
  writeClassAttendanceRecord(classId, next);
  dispatchAttendanceUpdated(classId, dayKey);
  return updated;
}

/**
 * Student taps to check in as present (or clear if already present).
 * @param {string} classId
 * @param {string} studentId
 * @param {unknown[]} [roster]
 */
export function toggleStudentPresent(classId, studentId, roster = []) {
  const dayKey = dateKey();
  const id = String(studentId);
  return patchToday(
    classId,
    dayKey,
    (d) => {
      if (d.submitted) return d;
      const marks = { ...d.marks };
      const lunch = { ...d.lunch };
      const checkIns = { ...(d.checkIns || {}) };
      const current = marks[id] || null;
      if (current === 'present') {
        delete marks[id];
        delete checkIns[id];
      } else {
        marks[id] = 'present';
        if (!checkIns[id]) checkIns[id] = formatCheckInNow();
      }
      return { ...d, marks, lunch, checkIns, submitted: false };
    },
    roster,
  );
}

/**
 * Set school / home lunch (clears when same choice tapped again).
 * Absent students cannot choose lunch.
 * @param {string} classId
 * @param {string} studentId
 * @param {'school' | 'home' | null} choice
 * @param {unknown[]} [roster]
 */
export function setStudentLunch(classId, studentId, choice, roster = []) {
  const dayKey = dateKey();
  const id = String(studentId);
  return patchToday(
    classId,
    dayKey,
    (d) => {
      if (d.submitted) return d;
      if (d.marks[id] === 'absent') return d;
      const nextChoice = choice === null ? null : normalizeLunch(choice);
      const lunch = { ...d.lunch };
      if (!nextChoice) delete lunch[id];
      else lunch[id] = nextChoice;
      // Checking lunch also counts as here if unmarked.
      const marks = { ...d.marks };
      const checkIns = { ...(d.checkIns || {}) };
      if (nextChoice && !marks[id]) {
        marks[id] = 'present';
        if (!checkIns[id]) checkIns[id] = formatCheckInNow();
      }
      return { ...d, marks, lunch, checkIns, submitted: false };
    },
    roster,
  );
}

export function readTodayDay(classId, roster = []) {
  const day = getDayRecord(classId, dateKey());
  return syncDayWithRoster(day, roster);
}

export { dateKey };
