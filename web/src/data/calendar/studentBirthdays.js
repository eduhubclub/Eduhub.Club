/**
 * Student birthday overlays for Edu.Calendar (month/day match, not school closures).
 */

import { addDaysIso, parseIsoDate } from './calendarModel';
import { studentDisplayName } from '../students/displayName';

export const BIRTHDAY_COLOR = '#ec4899';

/**
 * Parse MM/DD/YYYY, M/D/YY, or YYYY-MM-DD into month/day (1-based month).
 * @returns {{ month: number, day: number } | null}
 */
export function parseBirthMonthDay(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day };
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day };
  }
  return null;
}

/** Feb 29 → Feb 28 on non-leap years. */
function birthdayIsoForYear(year, month, day) {
  if (month === 2 && day === 29) {
    const leap =
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (!leap) return `${year}-02-28`;
  }
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Expand roster birthdays into calendar occurrences for a date range.
 *
 * @param {{
 *   rangeStart: string,
 *   rangeEnd: string,
 *   classBundles: Array<{ classId: string, className: string, students: object[] }>,
 * }} args
 */
export function expandStudentBirthdays({
  rangeStart,
  rangeEnd,
  classBundles = [],
}) {
  if (!parseIsoDate(rangeStart) || !parseIsoDate(rangeEnd) || rangeStart > rangeEnd) {
    return [];
  }

  const startY = parseIsoDate(rangeStart).getFullYear();
  const endY = parseIsoDate(rangeEnd).getFullYear();
  const rows = [];

  for (const bundle of classBundles) {
    const classId = String(bundle.classId || '');
    const className = bundle.className || 'Class';
    const students = Array.isArray(bundle.students) ? bundle.students : [];

    for (const student of students) {
      const md = parseBirthMonthDay(student?.birthdate);
      if (!md) continue;
      const name = studentDisplayName(student);

      for (let year = startY; year <= endY; year += 1) {
        const iso = birthdayIsoForYear(year, md.month, md.day);
        if (!iso || iso < rangeStart || iso > rangeEnd) continue;
        rows.push({
          id: `bday-${classId}-${student.id || name}-${iso}`,
          date: iso,
          title: name,
          color: BIRTHDAY_COLOR,
          classId,
          className,
          layerId: 'birthdays',
          layerName: 'Birthdays',
          kind: 'birthday',
          notes: 'Birthday',
          studentId: student.id != null ? String(student.id) : '',
        });
      }
    }
  }

  rows.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return String(a.title).localeCompare(String(b.title));
  });
  return rows;
}

/** Walk inclusive ISO range (for tests / callers). */
export function eachIsoInRange(startIso, endIso) {
  const out = [];
  if (!startIso || !endIso || startIso > endIso) return out;
  let cur = startIso;
  while (cur <= endIso) {
    out.push(cur);
    cur = addDaysIso(cur, 1);
    if (!cur) break;
  }
  return out;
}
