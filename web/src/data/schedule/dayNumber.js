/**
 * School Day #N indexing from Calendar session days.
 */

import { addDaysIso, parseIsoDate, toIsoDate } from '../calendar/calendarModel';
import {
  countSessionDaysInclusive,
  isSessionDay,
} from '../calendar/sessionDays';

/**
 * 1-based session-day index for an ISO date, or null if not a session day.
 * Day #1 = first session day on/after academic.startDate.
 *
 * @param {string} iso
 * @param {object} academic
 * @param {object[]} [closures]
 * @param {{ anchorSessionDay?: number }} [dayNumbering] — offset so Day #anchor aligns to first session day
 */
export function sessionDayNumber(iso, academic, closures = [], dayNumbering = {}) {
  if (!iso || !academic?.startDate) return null;
  if (!isSessionDay(iso, academic, closures)) return null;
  const count = countSessionDaysInclusive(
    academic.startDate,
    iso,
    academic,
    closures,
  );
  if (count <= 0) return null;
  const anchor = Math.max(1, Math.round(Number(dayNumbering.anchorSessionDay)) || 1);
  // anchorSessionDay=1 → Day #count; higher anchors shift the label up
  return count + (anchor - 1);
}

/**
 * ISO date for a given Day #N, or null if beyond the year.
 */
export function isoForSessionDayNumber(
  dayNumber,
  academic,
  closures = [],
  dayNumbering = {},
) {
  const target = Math.round(Number(dayNumber));
  if (!Number.isFinite(target) || target < 1 || !academic?.startDate) return null;
  const anchor = Math.max(1, Math.round(Number(dayNumbering.anchorSessionDay)) || 1);
  const sessionIndex = target - (anchor - 1); // 1-based index among session days
  if (sessionIndex < 1) return null;

  let n = 0;
  let cur = academic.startDate;
  const end = academic.endDate || cur;
  while (cur && cur <= end) {
    if (isSessionDay(cur, academic, closures)) {
      n += 1;
      if (n === sessionIndex) return cur;
    }
    cur = addDaysIso(cur, 1);
    if (!cur) break;
  }
  return null;
}

/**
 * Today’s Day #N (or null if today is not a session day).
 */
export function todaySessionDayNumber(
  academic,
  closures = [],
  dayNumbering = {},
  now = new Date(),
) {
  return sessionDayNumber(toIsoDate(now), academic, closures, dayNumbering);
}

/**
 * Next session day on or after `fromIso` (inclusive).
 */
export function nextSessionDayIso(fromIso, academic, closures = []) {
  if (!fromIso || !parseIsoDate(fromIso)) return null;
  let cur = fromIso;
  const end = academic?.endDate || addDaysIso(fromIso, 400);
  for (let i = 0; i < 500; i += 1) {
    if (isSessionDay(cur, academic, closures)) return cur;
    cur = addDaysIso(cur, 1);
    if (!cur || cur > end) break;
  }
  return null;
}
