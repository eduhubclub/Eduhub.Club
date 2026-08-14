/**
 * Session-day resolution: academic year + working days + breaks + snow closures
 * + optional US national holidays. Non-session days pause rotation sequences.
 */

import { parseIsoDate, toIsoDate, addDaysIso } from './calendarModel';
import { lookupNationalHoliday } from './nationalHolidays';

function dateInRange(iso, startIso, endIso) {
  return iso >= startIso && iso <= endIso;
}

/**
 * @param {string} iso YYYY-MM-DD
 * @param {{ startDate: string, endDate: string, workingDays: number[], breaks: object[], observeNationalHolidays?: boolean }} academic
 * @param {{ date: string }[]} closures
 */
export function isSessionDay(iso, academic, closures = []) {
  if (!iso || !academic) return false;
  if (!dateInRange(iso, academic.startDate, academic.endDate)) return false;

  const d = parseIsoDate(iso);
  if (!d) return false;
  const dow = d.getDay(); // 0 Sun … 6 Sat
  if (!(academic.workingDays || []).includes(dow)) return false;

  for (const br of academic.breaks || []) {
    if (dateInRange(iso, br.startDate, br.endDate)) return false;
  }
  for (const c of closures || []) {
    if (c.date === iso) return false;
  }
  if (academic.observeNationalHolidays !== false) {
    if (lookupNationalHoliday(iso)) return false;
  }
  return true;
}

/** Holiday label when observe is on and date matches, else null. */
export function sessionDayHoliday(iso, academic) {
  if (!iso || !academic || academic.observeNationalHolidays === false) {
    return null;
  }
  if (!dateInRange(iso, academic.startDate, academic.endDate)) return null;
  return lookupNationalHoliday(iso);
}

/**
 * First Day / Last Day markers from Academic year start/end settings.
 * Always display-only (not gated on national-holiday observe).
 * @returns {{ id: string, label: string } | null}
 */
export function academicYearMarker(iso, academic) {
  if (!iso || !academic) return null;
  const start = String(academic.startDate || '').trim();
  const end = String(academic.endDate || '').trim();
  if (!parseIsoDate(start) || !parseIsoDate(end)) return null;
  const isStart = iso === start;
  const isEnd = iso === end;
  if (isStart && isEnd) {
    return { id: 'first-last-day', label: 'First & Last Day' };
  }
  if (isStart) return { id: 'first-day', label: 'First Day' };
  if (isEnd) return { id: 'last-day', label: 'Last Day' };
  return null;
}

/**
 * Break covering this date, if any (display + session pause).
 * @returns {{ id: string, label: string, startDate: string, endDate: string } | null}
 */
export function breakOn(iso, academic) {
  if (!iso || !academic) return null;
  for (const br of academic.breaks || []) {
    const start = String(br.startDate || '').trim();
    const end = String(br.endDate || start).trim();
    if (!parseIsoDate(start) || !parseIsoDate(end)) continue;
    if (dateInRange(iso, start, end)) {
      return {
        id: String(br.id || `${start}-${end}`),
        label: String(br.name || 'Break').trim() || 'Break',
        startDate: start,
        endDate: end,
      };
    }
  }
  return null;
}

/**
 * Working days that fall inside breaks within the academic year
 * (weekends in a break range are not counted).
 */
export function breakWorkingDaysInYear(academic) {
  if (
    !academic?.startDate ||
    !academic?.endDate ||
    !parseIsoDate(academic.startDate) ||
    !parseIsoDate(academic.endDate) ||
    academic.startDate > academic.endDate
  ) {
    return 0;
  }
  const working = new Set(academic.workingDays || []);
  let n = 0;
  let cur = academic.startDate;
  while (cur && cur <= academic.endDate) {
    if (breakOn(cur, academic)) {
      const d = parseIsoDate(cur);
      if (d && working.has(d.getDay())) n += 1;
    }
    cur = addDaysIso(cur, 1);
  }
  return n;
}

/**
 * Count session days in [fromIso, toIso] inclusive.
 */
export function countSessionDaysInclusive(fromIso, toIso, academic, closures) {
  if (!fromIso || !toIso || fromIso > toIso) return 0;
  let n = 0;
  let cur = fromIso;
  while (cur <= toIso) {
    if (isSessionDay(cur, academic, closures)) n += 1;
    cur = addDaysIso(cur, 1);
    if (!cur) break;
  }
  return n;
}

/**
 * 0-based rotation index for a session day, or null if not a session day / no slots.
 * Snow/break days between anchor and target are skipped (pause).
 */
export function rotationIndexForDate(iso, layer, academic, closures) {
  if (!layer?.slots?.length) return null;
  if (!isSessionDay(iso, academic, closures)) return null;
  const anchor = layer.anchorDate || iso;
  if (iso < anchor) return null;
  const count = countSessionDaysInclusive(anchor, iso, academic, closures);
  if (count <= 0) return null;
  return (count - 1) % layer.slots.length;
}

export function rotationSlotForDate(iso, layer, academic, closures) {
  const index = rotationIndexForDate(iso, layer, academic, closures);
  if (index == null) return null;
  return { index, slot: layer.slots[index] };
}

/** School days remaining from tomorrow through target (inclusive if session). */
export function schoolDaysUntil(targetIso, academic, closures, fromIso = toIsoDate(new Date())) {
  if (!targetIso || targetIso < fromIso) return 0;
  const start = addDaysIso(fromIso, 1);
  if (!start || start > targetIso) {
    return isSessionDay(targetIso, academic, closures) && targetIso === fromIso
      ? 0
      : targetIso === fromIso
        ? 0
        : 0;
  }
  return countSessionDaysInclusive(start, targetIso, academic, closures);
}

/**
 * Session days left in the academic year from `fromIso` through Last Day (inclusive).
 * Before First Day, counts the full year.
 */
export function schoolDaysRemaining(
  academic,
  closures = [],
  fromIso = toIsoDate(new Date()),
) {
  if (!academic?.endDate || !parseIsoDate(academic.endDate)) return 0;
  if (fromIso > academic.endDate) return 0;
  const start =
    academic.startDate && fromIso < academic.startDate
      ? academic.startDate
      : fromIso;
  if (!parseIsoDate(start) || start > academic.endDate) return 0;
  return countSessionDaysInclusive(start, academic.endDate, academic, closures);
}

/** Total session days in the academic year (First Day through Last Day). */
export function schoolDaysInYear(academic, closures = []) {
  if (
    !academic?.startDate ||
    !academic?.endDate ||
    !parseIsoDate(academic.startDate) ||
    !parseIsoDate(academic.endDate) ||
    academic.startDate > academic.endDate
  ) {
    return 0;
  }
  return countSessionDaysInclusive(
    academic.startDate,
    academic.endDate,
    academic,
    closures,
  );
}

export function calendarDaysUntil(targetIso, fromIso = toIsoDate(new Date())) {
  const a = parseIsoDate(fromIso);
  const b = parseIsoDate(targetIso);
  if (!a || !b) return 0;
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.round(ms / 86400000));
}
