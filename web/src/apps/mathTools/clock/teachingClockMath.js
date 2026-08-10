/** Degrees per minute tick on the face (360 / 60). */
export const DEGREES_PER_MINUTE = 6;
/** Degrees per second tick (same spacing as minutes). */
export const DEGREES_PER_SECOND = 6;
/** Degrees per hour mark (360 / 12). */
export const DEGREES_PER_HOUR = 30;
/** Hour-hand degrees advanced per minute (30 / 60). */
export const HOUR_DEGREES_PER_MINUTE = 0.5;
/** Minutes in a 12-hour hand circle. */
export const MINUTES_PER_HALF_DAY = 12 * 60;
/** Minutes in a full day (24h digital). */
export const MINUTES_PER_DAY = 24 * 60;

export function normalizeDegrees(deg) {
  return ((deg % 360) + 360) % 360;
}

/** Normalize to a full day so geared drags can cross noon/midnight. */
export function normalizeDayMinutes(totalMinutes) {
  return ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** @deprecated Prefer normalizeDayMinutes — kept for half-day face math. */
export function normalizeTotalMinutes(totalMinutes) {
  return normalizeDayMinutes(totalMinutes) % MINUTES_PER_HALF_DAY;
}

/** Clock angle (0° at 12, clockwise) from SVG/client point relative to center. */
export function angleFromPointer(cx, cy, x, y) {
  const rad = Math.atan2(x - cx, cy - y);
  return normalizeDegrees((rad * 180) / Math.PI);
}

/** Shortest signed delta from → to in degrees (−180, 180]. */
export function shortestAngleDelta(from, to) {
  let d = normalizeDegrees(to) - normalizeDegrees(from);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export function minuteAngleFromTotalMinutes(totalMinutes) {
  return (normalizeDayMinutes(totalMinutes) % 60) * DEGREES_PER_MINUTE;
}

export function secondAngleFromSeconds(seconds = 0) {
  const s = ((Math.round(seconds) % 60) + 60) % 60;
  return s * DEGREES_PER_SECOND;
}

export function hourAngleFromTotalMinutes(totalMinutes) {
  const withinHalf =
    normalizeDayMinutes(totalMinutes) % MINUTES_PER_HALF_DAY;
  return normalizeDegrees(withinHalf * HOUR_DEGREES_PER_MINUTE);
}

export function minutesFromMinuteAngle(angle) {
  return Math.round(normalizeDegrees(angle) / DEGREES_PER_MINUTE) % 60;
}

export function secondsFromSecondAngle(angle) {
  return Math.round(normalizeDegrees(angle) / DEGREES_PER_SECOND) % 60;
}

/** Snap pointer angle to nearest minute tick (degrees). */
export function snapMinuteAngle(angle) {
  const m = minutesFromMinuteAngle(angle);
  return m * DEGREES_PER_MINUTE;
}

/** Snap pointer angle to nearest second tick (degrees). */
export function snapSecondAngle(angle) {
  return secondsFromSecondAngle(angle) * DEGREES_PER_SECOND;
}

/** Geared: snap to whole minutes within a day. */
export function snapDayMinutes(totalMinutes) {
  return Math.round(normalizeDayMinutes(totalMinutes));
}

/**
 * Free → Geared: keep minute hand; keep hour numeral from hour hand;
 * preserve AM/PM half from previous day minutes.
 */
export function totalMinutesFromFreeAngles(
  hourAngle,
  minuteAngle,
  previousTotalMinutes = 0,
) {
  const minutes = minutesFromMinuteAngle(minuteAngle);
  const hours = Math.floor(normalizeDegrees(hourAngle) / DEGREES_PER_HOUR) % 12;
  const period = Math.floor(
    normalizeDayMinutes(previousTotalMinutes) / MINUTES_PER_HALF_DAY,
  );
  return period * MINUTES_PER_HALF_DAY + hours * 60 + minutes;
}

export function anglesFromTotalMinutes(totalMinutes) {
  return {
    minuteAngle: minuteAngleFromTotalMinutes(totalMinutes),
    hourAngle: hourAngleFromTotalMinutes(totalMinutes),
  };
}

/**
 * Board digital readout.
 * 12h: 12:00 … 11:59 (no AM/PM in the string — use clockMeridiem).
 * 24h: 00:00 … 23:59.
 * Free mode uses hand angles for the 12h face position and the geared
 * day-minutes period for the 0–11 vs 12–23 half.
 */
export function formatDigital({
  hour24 = false,
  mode = 'geared',
  totalMinutes = 0,
  hourAngle = 0,
  minuteAngle = 0,
  seconds = 0,
  showSeconds = false,
} = {}) {
  const sec = ((Math.round(seconds) % 60) + 60) % 60;
  const secPart = showSeconds ? `:${String(sec).padStart(2, '0')}` : '';

  if (mode === 'free') {
    const minutes = minutesFromMinuteAngle(minuteAngle);
    const faceHours =
      Math.floor(normalizeDegrees(hourAngle) / DEGREES_PER_HOUR) % 12;
    if (hour24) {
      const period = Math.floor(
        normalizeDayMinutes(totalMinutes) / MINUTES_PER_HALF_DAY,
      );
      const hours = period * 12 + faceHours;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${secPart}`;
    }
    const hours = faceHours === 0 ? 12 : faceHours;
    return `${hours}:${String(minutes).padStart(2, '0')}${secPart}`;
  }

  const day = normalizeDayMinutes(totalMinutes);
  const minutes = day % 60;
  if (hour24) {
    const hours = Math.floor(day / 60) % 24;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${secPart}`;
  }
  let hours = Math.floor(day / 60) % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(minutes).padStart(2, '0')}${secPart}`;
}

/** AM / PM from day-minutes period (works in geared and free). */
export function clockMeridiem(totalMinutes = 0) {
  const day = normalizeDayMinutes(totalMinutes);
  return day < MINUTES_PER_HALF_DAY ? 'AM' : 'PM';
}

/** Split day-minutes into hour/minute fields for the set-time keypad. */
export function clockPartsFromDayMinutes(totalMinutes = 0, { hour24 = false } = {}) {
  const day = normalizeDayMinutes(totalMinutes);
  const minutes = day % 60;
  const hours24 = Math.floor(day / 60) % 24;
  if (hour24) {
    return {
      hours: hours24,
      minutes,
      meridiem: hours24 < 12 ? 'AM' : 'PM',
    };
  }
  let hours = hours24 % 12;
  if (hours === 0) hours = 12;
  return {
    hours,
    minutes,
    meridiem: hours24 < 12 ? 'AM' : 'PM',
  };
}

/** Build day-minutes from keypad hour/minute (+ AM/PM in 12h). */
export function dayMinutesFromClockParts({
  hour24 = false,
  hours = 0,
  minutes = 0,
  meridiem = 'AM',
} = {}) {
  const m = Math.max(0, Math.min(59, Math.round(Number(minutes) || 0)));
  let h;
  if (hour24) {
    h = Math.round(Number(hours) || 0);
    h = ((h % 24) + 24) % 24;
  } else {
    let face = Math.round(Number(hours) || 0);
    if (face <= 0) face = 12;
    if (face > 12) face = 12;
    const isPm = String(meridiem).toUpperCase() === 'PM';
    if (face === 12) h = isPm ? 12 : 0;
    else h = isPm ? face + 12 : face;
  }
  return snapDayMinutes(h * 60 + m);
}

/** Clamp seconds for keypad / digital. */
export function clampSeconds(seconds = 0) {
  const s = Math.round(Number(seconds) || 0);
  return ((s % 60) + 60) % 60;
}

/** Apply second-hand drag — returns { seconds, minuteDelta }. */
export function secondsAfterSecondAngle(prevSeconds, nextSecondAngle) {
  const current = secondAngleFromSeconds(prevSeconds);
  const snapped = snapSecondAngle(nextSecondAngle);
  const deltaSec = shortestAngleDelta(current, snapped) / DEGREES_PER_SECOND;
  const raw = prevSeconds + deltaSec;
  const minuteDelta = Math.floor(raw / 60);
  let next = Math.round(raw % 60);
  if (next < 0) next += 60;
  return { seconds: next, minuteDelta };
}

/** Apply minute-hand drag in geared mode (delta along shortest arc). */
export function gearedTotalAfterMinuteAngle(totalMinutes, nextMinuteAngle) {
  const current = minuteAngleFromTotalMinutes(totalMinutes);
  const snapped = snapMinuteAngle(nextMinuteAngle);
  const deltaMinutes = shortestAngleDelta(current, snapped) / DEGREES_PER_MINUTE;
  return snapDayMinutes(totalMinutes + deltaMinutes);
}

/** Apply hour-hand drag in geared mode (1-minute resolution; can cross noon). */
export function gearedTotalAfterHourAngle(totalMinutes, nextHourAngle) {
  const currentHourAngle = hourAngleFromTotalMinutes(totalMinutes);
  const snapped = normalizeDegrees(Math.round(nextHourAngle / 0.5) * 0.5);
  const deltaMinutes =
    shortestAngleDelta(currentHourAngle, snapped) / HOUR_DEGREES_PER_MINUTE;
  return snapDayMinutes(totalMinutes + deltaMinutes);
}

/**
 * Free-mode hour moves don't carry day minutes; bump ±12h when the hand
 * crosses 12 so 24h digital can show 12–23 (and wrap past midnight).
 */
export function dayMinutesAfterFreeHourMove(
  totalMinutes,
  prevHourAngle,
  nextHourAngle,
) {
  const prev = normalizeDegrees(prevHourAngle);
  const next = normalizeDegrees(nextHourAngle);
  const delta = shortestAngleDelta(prev, next);
  let crossed = 0;
  if (delta > 0 && next < prev) crossed = 1;
  else if (delta < 0 && next > prev) crossed = -1;
  if (crossed === 0) return normalizeDayMinutes(totalMinutes);
  return snapDayMinutes(totalMinutes + crossed * MINUTES_PER_HALF_DAY);
}

/** Clock polar point: 0° at 12, clockwise (matches hand angles). */
export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(rad),
    y: cy - r * Math.cos(rad),
  };
}

/**
 * Annular wedge path (ring segment) from startAngle → endAngle clockwise.
 * Angles in degrees, 0° at 12.
 */
export function annularArcPath(cx, cy, rInner, rOuter, startAngle, endAngle) {
  let sweep = normalizeDegrees(endAngle - startAngle);
  if (sweep < 0.5) sweep = 0.5;
  const end = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = polarToCartesian(cx, cy, rOuter, startAngle);
  const outerEnd = polarToCartesian(cx, cy, rOuter, end);
  const innerEnd = polarToCartesian(cx, cy, rInner, end);
  const innerStart = polarToCartesian(cx, cy, rInner, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/** Mid-angle of a clockwise sweep (for wedge labels). */
export function arcMidAngle(startAngle, endAngle) {
  let sweep = normalizeDegrees(endAngle - startAngle);
  if (sweep < 0.5) sweep = 0.5;
  return normalizeDegrees(startAngle + sweep / 2);
}

/** Minute chip sweep in degrees (1 min → 6°). */
export function minuteChipSweep(minutes) {
  return minutes * DEGREES_PER_MINUTE;
}

/** Hour chip sweep in degrees (1 hour → 30°). */
export function hourChipSweep(hours = 1) {
  return hours * DEGREES_PER_HOUR;
}
