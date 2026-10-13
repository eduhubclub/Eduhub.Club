/**
 * Weekly block-view layout helpers (times × days).
 */

import { addDaysIso, parseIsoDate, toIsoDate } from '../calendar/calendarModel';
import { formatMinutesAsClock } from '../settings/clockFormat';
import { templateForDate } from './scheduleModel';

/** @param {string} hhmm */
export function timeToMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** @param {number} minutes @param {{ useMilitaryTime?: boolean }} [opts] */
export function minutesToTimeLabel(minutes, opts = {}) {
  return formatMinutesAsClock(minutes, opts);
}

/** Monday (or weekStartsOn) ISO for the week containing `iso`. */
export function startOfWeekIso(iso, weekStartsOn = 1) {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toIsoDate(d);
}

/**
 * Pack overlapping intervals into lanes (0-based).
 * @param {{ startMin: number, endMin: number }[]} items
 */
export function packLanes(items) {
  const sorted = items
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const laneEnds = [];
  const laneByIndex = new Array(items.length).fill(0);
  for (const item of sorted) {
    let lane = laneEnds.findIndex((end) => end <= item.startMin);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(item.endMin);
    } else {
      laneEnds[lane] = item.endMin;
    }
    laneByIndex[item.index] = lane;
  }
  return { laneByIndex, laneCount: Math.max(1, laneEnds.length) };
}

/**
 * @param {object} schedule
 * @param {string[]} dayIsos — column dates
 * @param {{ defaultDurationMin?: number, pxPerMin?: number }} [opts]
 */
/** Floor scale; may rise so the shortest block stays readable without overlapping. */
export const DEFAULT_PX_PER_MIN = 3.2;

/** Shortest block target height (keeps hour ratio: one px/min for the whole grid). */
export const MIN_BLOCK_HEIGHT_PX = 32;

/**
 * Pick px/min so every block is at least MIN_BLOCK_HEIGHT_PX tall,
 * without faking duration (hour ratio stays constant across the day).
 */
export function resolvePxPerMin(shortestDurationMin, override) {
  if (override != null && Number.isFinite(Number(override))) {
    return Math.max(0.5, Number(override));
  }
  const shortest = Math.max(1, Number(shortestDurationMin) || 15);
  return Math.max(DEFAULT_PX_PER_MIN, MIN_BLOCK_HEIGHT_PX / shortest);
}

export function buildWeekBlockLayout(schedule, dayIsos, opts = {}) {
  const defaultDurationMin = opts.defaultDurationMin ?? 30;
  // Full-width day columns — do not split into side-by-side lanes.
  const days = (dayIsos || []).map((iso) => {
    const d = parseIsoDate(iso);
    const template = templateForDate(schedule, iso);
    const rawSlots = (template?.slots || []).map((slot) => {
      let startMin = timeToMinutes(slot.startTime);
      let endMin = timeToMinutes(slot.endTime);
      if (startMin == null && schedule?.mode !== 'periods') {
        // Untimed daySlots: stack by order
        startMin = null;
        endMin = null;
      }
      if (startMin != null && (endMin == null || endMin <= startMin)) {
        endMin = startMin + defaultDurationMin;
      }
      return {
        id: slot.id,
        label: slot.label,
        color: slot.color,
        startMin,
        endMin,
        startTime: slot.startTime || '',
        endTime: slot.endTime || '',
        order: slot.order,
      };
    });

    const timed = rawSlots.filter((s) => s.startMin != null);
    const untimed = rawSlots.filter((s) => s.startMin == null);

    // Place untimed after last timed (or from 9:00)
    let cursor =
      timed.length > 0
        ? Math.max(...timed.map((s) => s.endMin))
        : 9 * 60;
    for (const s of untimed) {
      s.startMin = cursor;
      s.endMin = cursor + defaultDurationMin;
      cursor = s.endMin;
    }

    const slots = [...timed, ...untimed].sort(
      (a, b) => a.startMin - b.startMin || a.order - b.order,
    );
    // One column per day: later-starting blocks paint above true overlaps.
    const blocks = slots.map((s, i) => ({
      ...s,
      lane: 0,
      laneCount: 1,
      zIndex: i + 1,
    }));

    return {
      iso,
      weekday: d ? d.getDay() : null,
      label: d
        ? d.toLocaleDateString(undefined, { weekday: 'short' })
        : iso,
      dateLabel: d
        ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '',
      templateName: template?.name || '',
      blocks,
    };
  });

  const allStarts = days.flatMap((d) => d.blocks.map((b) => b.startMin));
  const allEnds = days.flatMap((d) => d.blocks.map((b) => b.endMin));
  let rangeStart = allStarts.length ? Math.min(...allStarts) : 8 * 60;
  let rangeEnd = allEnds.length ? Math.max(...allEnds) : 16 * 60;
  // Pad to nearest 15 / add breathing room
  rangeStart = Math.floor(rangeStart / 15) * 15 - 15;
  rangeEnd = Math.ceil(rangeEnd / 15) * 15 + 15;
  if (rangeStart < 0) rangeStart = 0;
  if (rangeEnd <= rangeStart) rangeEnd = rangeStart + 60;

  const hourMarks = [];
  const firstHour = Math.ceil(rangeStart / 60) * 60;
  for (let t = firstHour; t <= rangeEnd; t += 60) {
    hourMarks.push(t);
  }

  const durations = days.flatMap((d) =>
    d.blocks.map((b) => Math.max(1, b.endMin - b.startMin)),
  );
  const shortestDurationMin = durations.length ? Math.min(...durations) : 15;
  const pxPerMin = resolvePxPerMin(shortestDurationMin, opts.pxPerMin);

  const totalMin = rangeEnd - rangeStart;
  const heightPx = Math.max(480, Math.round(totalMin * pxPerMin));

  return {
    days,
    rangeStart,
    rangeEnd,
    hourMarks,
    pxPerMin,
    heightPx,
    totalMin,
    shortestDurationMin,
  };
}

/** Mon–Fri ISO dates for the week of `focusIso` (or today). */
export function weekDayIsos(focusIso = toIsoDate(new Date()), count = 5) {
  const monday = startOfWeekIso(focusIso, 1);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(addDaysIso(monday, i));
  }
  return out;
}
