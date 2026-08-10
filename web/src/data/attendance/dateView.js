/**
 * Daily Attendance date label format preference (“date mode”).
 */

export const DATE_VIEW_STORAGE_KEY = 'eduHub.attendance.dateView';
export const DATE_VIEW_UPDATED_EVENT = 'eduHub.attendance.dateView.updated';

export const DATE_VIEW_OPTIONS = [
  {
    id: 'numericShort',
    label: 'Numeric',
    example: '8/7/26',
  },
  {
    id: 'weekdayLong',
    label: 'Weekday',
    example: 'Friday, August 7th',
  },
  {
    id: 'weekdayLongYear',
    label: 'Weekday + year',
    example: 'Friday, August 7th, 2026',
  },
  {
    id: 'monthDayLong',
    label: 'Month day',
    example: 'August 7th',
  },
];

export const DEFAULT_DATE_VIEW = 'weekdayLong';

/** Older stored ids → current ids. */
const LEGACY_DATE_VIEW = {
  weekdayShort: 'weekdayLong',
  monthDay: 'monthDayLong',
  numeric: 'numericShort',
};

const DATE_VIEW_IDS = new Set(DATE_VIEW_OPTIONS.map((o) => o.id));

export function dayOrdinal(day) {
  const n = Number(day);
  if (!Number.isFinite(n)) return '';
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function normalizeDateView(value) {
  const mapped = LEGACY_DATE_VIEW[value] || value;
  return DATE_VIEW_IDS.has(mapped) ? mapped : DEFAULT_DATE_VIEW;
}

export function readDateView() {
  try {
    return normalizeDateView(localStorage.getItem(DATE_VIEW_STORAGE_KEY));
  } catch {
    return DEFAULT_DATE_VIEW;
  }
}

export function writeDateView(value) {
  const next = normalizeDateView(value);
  try {
    localStorage.setItem(DATE_VIEW_STORAGE_KEY, next);
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(DATE_VIEW_UPDATED_EVENT, { detail: { dateView: next } }),
    );
  }
  return next;
}

/** Format a YYYY-MM-DD key for the Daily summary bar. */
export function formatAttendanceDateLabel(dateKeyStr, dateView = DEFAULT_DATE_VIEW) {
  const [y, m, d] = String(dateKeyStr || '')
    .split('-')
    .map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  const view = normalizeDateView(dateView);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const ordinal = dayOrdinal(d);

  if (view === 'numericShort') {
    return `${m}/${d}/${String(y).slice(-2)}`;
  }
  if (view === 'monthDayLong') {
    return `${month} ${ordinal}`;
  }
  if (view === 'weekdayLongYear') {
    return `${weekday}, ${month} ${ordinal}, ${y}`;
  }
  return `${weekday}, ${month} ${ordinal}`;
}
