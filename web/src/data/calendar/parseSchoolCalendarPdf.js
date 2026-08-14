/**
 * Parse district school-calendar PDF text into Important Dates proposals.
 * Tuned for layouts like Tahoma SD (month + day/range + label columns).
 */

import { newCalendarId } from './calendarModel';

const MONTHS = {
  january: 1,
  jan: 1,
  'jan.': 1,
  february: 2,
  feb: 2,
  'feb.': 2,
  march: 3,
  mar: 3,
  'mar.': 3,
  april: 4,
  apr: 4,
  'apr.': 4,
  may: 5,
  june: 6,
  jun: 6,
  'jun.': 6,
  july: 7,
  jul: 7,
  'jul.': 7,
  august: 8,
  aug: 8,
  'aug.': 8,
  september: 9,
  sep: 9,
  'sep.': 9,
  sept: 9,
  'sept.': 9,
  october: 10,
  oct: 10,
  'oct.': 10,
  november: 11,
  nov: 11,
  'nov.': 11,
  december: 12,
  dec: 12,
  'dec.': 12,
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoDate(year, month, day) {
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** School-year year for a month (Aug–Dec → startYear, Jan–Jul → startYear+1). */
function yearForMonth(startYear, month) {
  return month >= 8 ? startYear : startYear + 1;
}

function detectStartYear(text) {
  const m =
    text.match(
      /\b(20\d{2})\s*[–\-—\/]\s*(20\d{2})\s+SCHOOL\s+CALENDAR\b/i,
    ) ||
    text.match(/\b(20\d{2})\s*[–\-—\/]\s*(20\d{2})\b/);
  if (m) return Number(m[1]);
  const y = new Date().getFullYear();
  const month = new Date().getMonth();
  return month < 7 ? y - 1 : y;
}

function normalizeLabel(raw) {
  let s = String(raw || '')
    .replace(/\s+/g, ' ')
    .replace(/^[\-–—:\s]+/, '')
    .trim();
  // Drop calendar-grid chrome that pdf.js often appends on the same line.
  s = s.replace(
    /\s+(?:S\s+M\s+T\s+W\s+T\s+F\s+S)(?:\s.*)?$/i,
    '',
  );
  s = s.replace(/\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}\s*$/i, '');
  s = s.replace(/(?:\s+\d{1,2}){3,}\s*$/g, '');
  s = s.replace(/\s+\d{1,2}(?:\s+\d{1,2}){2,}\s*$/g, '');
  s = s.replace(/\s+\d{1,2}\s*$/g, '');
  return s.trim();
}

function classifyLabel(label) {
  const s = label.toLowerCase();
  if (/^first day of school\b/.test(s) && !/kindergarten|preschool|transition/.test(s)) {
    return 'firstDay';
  }
  if (/^last day of school\b/.test(s)) return 'lastDay';
  if (/\bbreak\b/.test(s)) return 'break';
  if (/half\s*day|early\s*release/.test(s)) return 'halfDay';
  if (/no school|teacher workshop|in[- ]service|non[- ]student/.test(s)) {
    return 'closure';
  }
  if (/first day of/.test(s)) return 'other';
  return 'other';
}

function defaultSelected(kind, label) {
  if (kind === 'firstDay' || kind === 'lastDay' || kind === 'break') return true;
  if (kind === 'closure') {
    // Make-up / tentative days off by default
    if (/make\s*up/i.test(label)) return false;
    return true;
  }
  return false;
}

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   startDate: string,
 *   endDate: string,
 *   kind: 'firstDay'|'lastDay'|'break'|'closure'|'halfDay'|'other',
 *   selected: boolean,
 * }} SchoolCalendarProposal
 */

/**
 * @param {string} text
 * @returns {{
 *   startYear: number,
 *   schoolYearLabel: string,
 *   items: SchoolCalendarProposal[],
 * }}
 */
export function parseSchoolCalendarText(text) {
  const raw = String(text || '');
  const startYear = detectStartYear(raw);
  const schoolYearLabel = `${startYear}–${startYear + 1}`;

  // Flatten whitespace for pattern matching while keeping newlines as spaces
  const flat = raw.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

  /** @type {SchoolCalendarProposal[]} */
  const items = [];
  const seen = new Set();

  const push = (label, startDate, endDate, kindHint) => {
    const clean = normalizeLabel(label);
    if (!clean || !startDate) return;
    if (clean.length < 4) return;
    if (!/[A-Za-z]{3,}/.test(clean)) return;
    let end = endDate || startDate;
    if (end < startDate) {
      // Invalid range (pdf.js crosstalk) — keep as single day
      end = startDate;
    }
    const kind = kindHint || classifyLabel(clean);
    // Prefer the cleanest label for a given date+kind
    const key = `${kind}|${startDate}|${end}`;
    const existing = items.find(
      (i) => i.kind === kind && i.startDate === startDate && i.endDate === end,
    );
    if (existing) {
      if (clean.length < existing.label.length) existing.label = clean;
      return;
    }
    if (seen.has(key + '|' + clean.toLowerCase())) return;
    seen.add(key + '|' + clean.toLowerCase());
    items.push({
      id: newCalendarId('imp'),
      label: clean,
      startDate,
      endDate: end,
      kind,
      selected: defaultSelected(kind, clean),
    });
  };

  // "Dec. - Jan. 21-1 Winter Break" / "Dec - Jan\n21-1\nWinter Break"
  const crossYear =
    /(?:Dec\.?|December)\s*[–\-—]\s*(?:Jan\.?|January)\s*\n?\s*(\d{1,2})\s*[–\-—]\s*(\d{1,2})\s*\n?\s*((?:Winter\s+)?Break|[A-Za-z][^\n]{2,80})/gi;
  for (const m of flat.matchAll(crossYear)) {
    const startDay = Number(m[1]);
    const endDay = Number(m[2]);
    const label = m[3];
    if (!/break|no school|holiday/i.test(label)) continue;
    const start = isoDate(startYear, 12, startDay);
    const end = isoDate(startYear + 1, 1, endDay);
    push(label, start, end, classifyLabel(label));
  }

  // "November 18-19 Half Day..." or "February 16-19 No School - Mid Winter Break"
  const sameMonthRange =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Sept\.?|Oct\.?|Nov\.?|Dec\.?)\s+(\d{1,2})\s*[–\-—]\s*(\d{1,2})\s*\n?\s*([A-Za-z][^\n]{2,90})/gi;
  for (const m of flat.matchAll(sameMonthRange)) {
    // Avoid eating "Dec. - Jan. 21-1 Winter Break" as a same-month Jan range.
    const preceding = flat.slice(Math.max(0, m.index - 12), m.index);
    if (/Dec\.?\s*[–\-—]\s*$/i.test(preceding)) continue;
    const startDay = Number(m[2]);
    const endDay = Number(m[3]);
    if (endDay < startDay) continue;
    const month = MONTHS[m[1].toLowerCase()];
    if (!month) continue;
    const y = yearForMonth(startYear, month);
    const start = isoDate(y, month, startDay);
    const end = isoDate(y, month, endDay);
    push(m[4], start, end);
  }

  // "April\n5-9\nNo School - Spring Break" (month on its own line)
  const monthThenRange =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s*\n\s*(\d{1,2})\s*[–\-—]\s*(\d{1,2})\s*\n\s*([A-Za-z][^\n]{2,90})/gi;
  for (const m of flat.matchAll(monthThenRange)) {
    const month = MONTHS[m[1].toLowerCase()];
    if (!month) continue;
    const y = yearForMonth(startYear, month);
    push(
      m[4],
      isoDate(y, month, Number(m[2])),
      isoDate(y, month, Number(m[3])),
    );
  }

  // Single day: "August\n26\nFirst Day of School" / "September\n7\nNo School - Labor Day"
  const singleDay =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s*\n\s*(\d{1,2})\s*\n\s*([A-Za-z][^\n]{2,90})/gi;
  for (const m of flat.matchAll(singleDay)) {
    const month = MONTHS[m[1].toLowerCase()];
    if (!month) continue;
    const label = normalizeLabel(m[3]);
    // Skip calendar chrome that snuck in
    if (/^(S|M|T|W|F)$/i.test(label)) continue;
    if (/^(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(label) && label.length < 20) {
      continue;
    }
    const y = yearForMonth(startYear, month);
    const date = isoDate(y, month, Number(m[2]));
    push(label, date, date);
  }

  // Same-line fallback (pdf.js reading order): "August 26 First Day of School"
  const singleDayInline =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Sept\.?|Oct\.?|Nov\.?|Dec\.?)\s+(\d{1,2})\s+([A-Za-z][^\n]{2,90})/gi;
  for (const m of flat.matchAll(singleDayInline)) {
    const month = MONTHS[m[1].toLowerCase()];
    if (!month) continue;
    const label = normalizeLabel(m[3]);
    if (!/first day|last day|no school|break|half day|workshop|holiday|conference/i.test(label)) {
      continue;
    }
    const y = yearForMonth(startYear, month);
    push(label, isoDate(y, month, Number(m[2])), isoDate(y, month, Number(m[2])));
  }

  // Prefer a stable Important Dates order by date
  items.sort((a, b) => {
    const byDate = a.startDate.localeCompare(b.startDate);
    if (byDate) return byDate;
    return a.label.localeCompare(b.label);
  });

  return { startYear, schoolYearLabel, items };
}

/**
 * Apply selected proposals onto academic + closures.
 * @param {object} academic
 * @param {object[]} closures
 * @param {SchoolCalendarProposal[]} items
 */
export function applySchoolCalendarProposals(academic, closures, items) {
  const selected = (items || []).filter((i) => i.selected);
  const nextAcademic = {
    ...academic,
    breaks: [...(academic.breaks || [])],
  };
  let nextClosures = [...(closures || [])];

  const first = selected.find((i) => i.kind === 'firstDay');
  const last = selected.find((i) => i.kind === 'lastDay');
  if (first?.startDate) nextAcademic.startDate = first.startDate;
  if (last?.endDate || last?.startDate) {
    nextAcademic.endDate = last.endDate || last.startDate;
  }

  const breakItems = selected.filter((i) => i.kind === 'break');
  if (breakItems.length) {
    // Replace existing breaks when importing a full district calendar
    nextAcademic.breaks = breakItems.map((b) => ({
      id: newCalendarId('break'),
      name: b.label.replace(/^No School\s*[-–—]\s*/i, '').trim() || b.label,
      startDate: b.startDate,
      endDate: b.endDate || b.startDate,
    }));
  }

  const closureKinds = new Set(['closure', 'halfDay']);
  for (const item of selected.filter((i) => closureKinds.has(i.kind))) {
    // Multi-day closures → expand to each day as closures, or treat as break if already break
    let cur = item.startDate;
    const end = item.endDate || item.startDate;
    while (cur && cur <= end) {
      const exists = nextClosures.some((c) => c.date === cur);
      if (!exists) {
        nextClosures.push({
          id: newCalendarId('closure'),
          date: cur,
          label: item.label,
        });
      }
      // advance
      const [y, m, d] = cur.split('-').map(Number);
      const dt = new Date(y, m - 1, d + 1);
      cur = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
    }
  }

  nextClosures.sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return { academic: nextAcademic, closures: nextClosures };
}
