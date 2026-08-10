/**
 * Shared “who is here today” API for Randomizer, Groups, and future widgets.
 * Reads eduHub.attendance.byClass from localStorage.
 */

import {
  dateKey as makeDateKey,
  isHereStatus,
  normalizeClassRecord,
  normalizeDayRecord,
} from './attendanceModel';
import {
  DEMO_ATTENDANCE_CLASS_ID,
  ensureDemoAttendanceRecord,
} from './demoAttendanceSeed';

export const ATTENDANCE_STORAGE_KEY = 'eduHub.attendance.byClass';
export const ATTENDANCE_UPDATED_EVENT = 'eduHub.attendance.updated';

function readMap() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistMapEntry(classId, record) {
  const all = readMap();
  all[String(classId)] = normalizeClassRecord(record);
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function getClassAttendanceRecord(classId) {
  if (!classId) return normalizeClassRecord(null);
  const id = String(classId);
  const raw = readMap()[id];
  if (id === DEMO_ATTENDANCE_CLASS_ID) {
    const { record, didWrite } = ensureDemoAttendanceRecord(id, raw);
    if (didWrite) {
      persistMapEntry(id, record);
      dispatchAttendanceUpdated(id);
    }
    return record;
  }
  return normalizeClassRecord(raw);
}

export function getDayRecord(classId, dayKey = makeDateKey()) {
  const rec = getClassAttendanceRecord(classId);
  return normalizeDayRecord(rec.days?.[dayKey] || null);
}

/**
 * After submit: present|tardy → here; absent|excused → out.
 * Before submit: everyone treated as available (don’t empty Randomizer mid-take).
 */
export function isStudentHere(classId, studentId, dayKey = makeDateKey()) {
  const day = getDayRecord(classId, dayKey);
  if (!day.submitted) return true;
  const status = day.marks[String(studentId)];
  return isHereStatus(status);
}

export function filterHereToday(roster, classId, dayKey = makeDateKey()) {
  const list = roster || [];
  if (!classId) return list;
  const day = getDayRecord(classId, dayKey);
  if (!day.submitted) return list;
  return list.filter((s) => isHereStatus(day.marks[String(s.id)]));
}

export function getAttendanceSummary(
  classId,
  dayKey = makeDateKey(),
  roster = [],
) {
  const day = getDayRecord(classId, dayKey);
  const counts = {
    present: 0,
    absent: 0,
    tardy: 0,
    excused: 0,
    unmarked: 0,
    here: 0,
    out: 0,
    submitted: day.submitted,
    total: (roster || []).length,
  };
  for (const s of roster || []) {
    const status = day.marks[String(s.id)] || null;
    if (!status) {
      counts.unmarked += 1;
      if (!day.submitted) counts.here += 1;
      else counts.out += 1;
      continue;
    }
    if (counts[status] != null) counts[status] += 1;
    if (isHereStatus(status)) counts.here += 1;
    else counts.out += 1;
  }
  return counts;
}

export function dispatchAttendanceUpdated(classId, dayKey) {
  try {
    window.dispatchEvent(
      new CustomEvent(ATTENDANCE_UPDATED_EVENT, {
        detail: {
          classId: classId ? String(classId) : null,
          dateKey: dayKey || makeDateKey(),
        },
      }),
    );
  } catch {
    /* ignore */
  }
}

/** Write helper used by AttendanceContext. */
export function writeClassAttendanceRecord(classId, record) {
  if (!classId) return;
  persistMapEntry(classId, record);
}
