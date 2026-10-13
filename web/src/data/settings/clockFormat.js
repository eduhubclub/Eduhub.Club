/**
 * Workspace clock display: 12-hour (default) or military / 24-hour.
 */

export const CLOCK_FORMAT_STORAGE_KEY = 'eduHub.clock.useMilitaryTime';
export const CLOCK_FORMAT_UPDATED_EVENT = 'eduHub.clock.format.updated';

export function readUseMilitaryTime() {
  try {
    return localStorage.getItem(CLOCK_FORMAT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeUseMilitaryTime(value) {
  const next = Boolean(value);
  try {
    localStorage.setItem(CLOCK_FORMAT_STORAGE_KEY, next ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CLOCK_FORMAT_UPDATED_EVENT, {
        detail: { useMilitaryTime: next },
      }),
    );
  }
  return next;
}

/**
 * Format "HH:MM" or "HH:MM:SS" for display.
 * @param {string} value
 * @param {{ useMilitaryTime?: boolean }} [opts]
 */
export function formatClockTime(value, opts = {}) {
  if (!value) return '';
  const [hourRaw, minuteRaw] = String(value).slice(0, 5).split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';
  const useMilitary =
    opts.useMilitaryTime != null
      ? Boolean(opts.useMilitaryTime)
      : readUseMilitaryTime();
  if (useMilitary) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  const hour12 = hour % 12 || 12;
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/**
 * Format minutes-from-midnight for display.
 * @param {number} minutes
 * @param {{ useMilitaryTime?: boolean }} [opts]
 */
export function formatMinutesAsClock(minutes, opts = {}) {
  const total = Math.round(Number(minutes));
  if (!Number.isFinite(total)) return '';
  const h24 = ((Math.floor(total / 60) % 24) + 24) % 24;
  const min = ((total % 60) + 60) % 60;
  return formatClockTime(
    `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
    opts,
  );
}

/** Range like "9:10 AM – 9:25 AM" or "09:10 – 09:25". */
export function formatClockRange(start, end, opts = {}) {
  const a = formatClockTime(start, opts);
  const b = formatClockTime(end, opts);
  if (a && b) return `${a} – ${b}`;
  return a || b || '';
}
