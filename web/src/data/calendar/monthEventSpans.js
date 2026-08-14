/**
 * Build continuous multi-day event bars for a month grid (per week-row segments).
 */

/**
 * @param {object} row
 * @returns {boolean}
 */
export function isMultiDayOccurrence(row) {
  if (!row || row.kind !== 'event') return false;
  const start = row.eventStart || row.startDate;
  const end = row.eventEnd || row.endDate;
  return Boolean(start && end && start < end);
}

/**
 * Unique multi-day events from expanded day occurrences.
 * @param {object[]} occurrences
 */
export function uniqueMultiDayEvents(occurrences) {
  const map = new Map();
  for (const row of occurrences || []) {
    if (!isMultiDayOccurrence(row)) continue;
    const key = `${row.classId}:${row.sourceEventId || row.id}`;
    if (map.has(key)) continue;
    map.set(key, {
      ...row,
      eventStart: row.eventStart || row.startDate,
      eventEnd: row.eventEnd || row.endDate,
    });
  }
  return [...map.values()];
}

function overlaps(a, b) {
  return a.startCol <= b.endCol && b.startCol <= a.endCol;
}

/**
 * Greedy lane packing so overlapping segments stack vertically.
 * @param {Array<{ startCol: number, endCol: number }>} segments
 */
export function packSpanLanes(segments) {
  const sorted = [...segments].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return b.endCol - b.startCol - (a.endCol - a.startCol);
  });
  const laneEnds = [];
  for (const seg of sorted) {
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] >= seg.startCol) {
      lane += 1;
    }
    seg.lane = lane;
    laneEnds[lane] = seg.endCol;
  }
  return sorted;
}

/**
 * @param {string[]} days - flat 42-day month grid (ISO)
 * @param {object[]} occurrences - expanded rows including multi-day events
 * @returns {{
 *   weeks: Array<{
 *     weekIndex: number,
 *     days: string[],
 *     spans: Array<object>,
 *     laneCount: number,
 *   }>
 * }}
 */
export function buildMonthWeekSpans(days, occurrences) {
  const multi = uniqueMultiDayEvents(occurrences);
  const weeks = [];
  const n = days?.length || 0;

  for (let w = 0; w * 7 < n; w += 1) {
    const weekDays = days.slice(w * 7, w * 7 + 7);
    const weekStart = weekDays[0];
    const weekEnd = weekDays[weekDays.length - 1];
    const raw = [];

    for (const event of multi) {
      const start = event.eventStart;
      const end = event.eventEnd;
      if (!start || !end || end < weekStart || start > weekEnd) continue;
      const segStart = start < weekStart ? weekStart : start;
      const segEnd = end > weekEnd ? weekEnd : end;
      const startCol = weekDays.indexOf(segStart);
      const endCol = weekDays.indexOf(segEnd);
      if (startCol < 0 || endCol < 0 || endCol < startCol) continue;
      raw.push({
        id: `span-${event.classId}-${event.sourceEventId || event.id}-w${w}`,
        weekIndex: w,
        startCol,
        endCol,
        continuesBefore: start < weekStart,
        continuesAfter: end > weekEnd,
        title: event.title,
        color: event.color,
        className: event.className,
        classId: event.classId,
        layerName: event.layerName,
        sourceEventId: event.sourceEventId,
        eventStart: start,
        eventEnd: end,
        kind: 'event',
        date: segStart,
        notes: event.notes,
        startTime: event.startTime,
        endTime: event.endTime,
      });
    }

    const spans = packSpanLanes(raw);
    const laneCount = spans.reduce((max, s) => Math.max(max, (s.lane || 0) + 1), 0);
    weeks.push({ weekIndex: w, days: weekDays, spans, laneCount });
  }

  return { weeks };
}
