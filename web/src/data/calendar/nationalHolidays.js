/**
 * US national / federal holidays that typically close schools.
 * Observed-date rules: Saturday → Friday, Sunday → Monday (when applicable).
 */

import { parseIsoDate, toIsoDate } from './calendarModel';

/** nth weekday of month (n = 1..5). weekday: 0 Sun … 6 Sat. */
function nthWeekdayOfMonth(year, monthIndex, weekday, n) {
  const first = new Date(year, monthIndex, 1);
  const firstDow = first.getDay();
  const offset = (weekday - firstDow + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(year, monthIndex, day);
}

/** Last weekday of month. */
function lastWeekdayOfMonth(year, monthIndex, weekday) {
  const last = new Date(year, monthIndex + 1, 0);
  const lastDow = last.getDay();
  const offset = (lastDow - weekday + 7) % 7;
  return new Date(year, monthIndex + 1, -offset);
}

/** Fixed calendar date with weekend observed shift. */
function observedFixed(year, monthIndex, day) {
  const d = new Date(year, monthIndex, day);
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() + 1); // Sun → Mon
  else if (dow === 6) d.setDate(d.getDate() - 1); // Sat → Fri
  return d;
}

/**
 * Federal / common school-closure holidays for a calendar year.
 * @returns {{ date: string, label: string, id: string }[]}
 */
export function nationalHolidaysForYear(year) {
  const y = Number(year);
  if (!Number.isFinite(y)) return [];

  const thanksgiving = nthWeekdayOfMonth(y, 10, 4, 4); // Nov, Thursday
  const dayAfterThanksgiving = new Date(thanksgiving);
  dayAfterThanksgiving.setDate(dayAfterThanksgiving.getDate() + 1);

  const rows = [
    {
      id: `nyd-${y}`,
      label: "New Year's Day",
      date: toIsoDate(observedFixed(y, 0, 1)),
    },
    {
      id: `mlk-${y}`,
      label: 'Martin Luther King Jr. Day',
      date: toIsoDate(nthWeekdayOfMonth(y, 0, 1, 3)),
    },
    {
      id: `presidents-${y}`,
      label: "Presidents' Day",
      date: toIsoDate(nthWeekdayOfMonth(y, 1, 1, 3)),
    },
    {
      id: `memorial-${y}`,
      label: 'Memorial Day',
      date: toIsoDate(lastWeekdayOfMonth(y, 4, 1)),
    },
    {
      id: `juneteenth-${y}`,
      label: 'Juneteenth',
      date: toIsoDate(observedFixed(y, 5, 19)),
    },
    {
      id: `independence-${y}`,
      label: 'Independence Day',
      date: toIsoDate(observedFixed(y, 6, 4)),
    },
    {
      id: `labor-${y}`,
      label: 'Labor Day',
      date: toIsoDate(nthWeekdayOfMonth(y, 8, 1, 1)),
    },
    {
      id: `indigenous-${y}`,
      label: "Indigenous Peoples' Day",
      date: toIsoDate(nthWeekdayOfMonth(y, 9, 1, 2)),
    },
    {
      id: `veterans-${y}`,
      label: 'Veterans Day',
      date: toIsoDate(observedFixed(y, 10, 11)),
    },
    {
      id: `thanksgiving-${y}`,
      label: 'Thanksgiving',
      date: toIsoDate(thanksgiving),
    },
    {
      id: `thanksgiving-fri-${y}`,
      label: 'Day after Thanksgiving',
      date: toIsoDate(dayAfterThanksgiving),
    },
    {
      id: `christmas-${y}`,
      label: 'Christmas Day',
      date: toIsoDate(observedFixed(y, 11, 25)),
    },
  ];

  return rows.filter((r) => parseIsoDate(r.date));
}

/**
 * Holidays overlapping [startIso, endIso] (inclusive). Spans years as needed.
 */
export function nationalHolidaysInRange(startIso, endIso) {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (!start || !end || startIso > endIso) return [];

  const years = [];
  for (let y = start.getFullYear(); y <= end.getFullYear(); y += 1) {
    years.push(y);
  }
  // Observed New Year's for end year+1 can fall in range? rare. Include adjacent years.
  if (!years.includes(start.getFullYear() - 1)) years.unshift(start.getFullYear() - 1);
  if (!years.includes(end.getFullYear() + 1)) years.push(end.getFullYear() + 1);

  const byDate = new Map();
  for (const y of years) {
    for (const h of nationalHolidaysForYear(y)) {
      if (h.date >= startIso && h.date <= endIso) {
        byDate.set(h.date, h);
      }
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function nationalHolidayOn(iso, startIso, endIso) {
  if (!iso) return null;
  const rangeStart = startIso || iso;
  const rangeEnd = endIso || iso;
  return (
    nationalHolidaysInRange(rangeStart, rangeEnd).find((h) => h.date === iso) ||
    null
  );
}

/** Fast single-date lookup without full range scan of many years. */
export function lookupNationalHoliday(iso) {
  const d = parseIsoDate(iso);
  if (!d) return null;
  const y = d.getFullYear();
  return (
    nationalHolidaysForYear(y).find((h) => h.date === iso) ||
    nationalHolidaysForYear(y - 1).find((h) => h.date === iso) ||
    nationalHolidaysForYear(y + 1).find((h) => h.date === iso) ||
    null
  );
}
