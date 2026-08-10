import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DATE_VIEW,
  dayOrdinal,
  formatAttendanceDateLabel,
  normalizeDateView,
} from './dateView';

describe('attendance date mode', () => {
  it('normalizes unknown and legacy values', () => {
    expect(normalizeDateView('nope')).toBe(DEFAULT_DATE_VIEW);
    expect(normalizeDateView('numeric')).toBe('numericShort');
    expect(normalizeDateView('monthDay')).toBe('monthDayLong');
    expect(normalizeDateView('weekdayLongYear')).toBe('weekdayLongYear');
  });

  it('builds ordinals', () => {
    expect(dayOrdinal(1)).toBe('1st');
    expect(dayOrdinal(2)).toBe('2nd');
    expect(dayOrdinal(3)).toBe('3rd');
    expect(dayOrdinal(7)).toBe('7th');
    expect(dayOrdinal(11)).toBe('11th');
    expect(dayOrdinal(22)).toBe('22nd');
  });

  it('formats the date modes', () => {
    expect(formatAttendanceDateLabel('2026-08-07', 'numericShort')).toBe(
      '8/7/26',
    );
    expect(formatAttendanceDateLabel('2026-08-07', 'weekdayLong')).toBe(
      'Friday, August 7th',
    );
    expect(formatAttendanceDateLabel('2026-08-07', 'weekdayLongYear')).toBe(
      'Friday, August 7th, 2026',
    );
    expect(formatAttendanceDateLabel('2026-08-07', 'monthDayLong')).toBe(
      'August 7th',
    );
  });
});
