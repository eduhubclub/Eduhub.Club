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

export function calendarDaysUntil(targetIso, fromIso = toIsoDate(new Date())) {
  const a = parseIsoDate(fromIso);
  const b = parseIsoDate(targetIso);
  if (!a || !b) return 0;
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.round(ms / 86400000));
}
