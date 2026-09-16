export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function dayPhrase(weekdays) {
  const days = [...new Set((weekdays || []).map(Number))]
    .filter((day) => day >= 0 && day <= 6)
    .sort((a, b) => a - b);
  const key = days.join(',');
  if (key === '1,2,3,4,5') return 'weekdays';
  if (key === '0,6') return 'weekends';
  if (key === '0,1,2,3,4,5,6') return 'every day';
  if (days.length === 0) return 'no days';
  const names = days.map((day) => WEEKDAY_NAMES[day]);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export function clockLabel(value) {
  if (!value) return '';
  const [hourRaw, minuteRaw] = String(value).slice(0, 5).split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';
  const hour12 = hour % 12 || 12;
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** Same sentence the database uses in the student lock dialog. */
export function scheduleLabel(weekdays, windowStart, windowEnd) {
  const days = dayPhrase(weekdays);
  const start = clockLabel(windowStart);
  const end = clockLabel(windowEnd);
  if (start && end) return `${start}–${end} on ${days}`;
  return days;
}

export function opensDetail(weekdays, windowStart, windowEnd) {
  return `Opens ${scheduleLabel(weekdays, windowStart, windowEnd)}.`;
}

export function timeInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

export function canEnterApp(status) {
  return Boolean(status?.open);
}
