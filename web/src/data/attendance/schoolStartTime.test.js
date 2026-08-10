import { describe, expect, it } from 'vitest';
import {
  applySchoolStartTardy,
  isPastSchoolStart,
  normalizeSchoolStartTime,
} from './schoolStartTime';

describe('normalizeSchoolStartTime', () => {
  it('normalizes valid times', () => {
    expect(normalizeSchoolStartTime('8:30')).toBe('08:30');
    expect(normalizeSchoolStartTime('08:05')).toBe('08:05');
    expect(normalizeSchoolStartTime('23:59')).toBe('23:59');
  });

  it('rejects invalid values', () => {
    expect(normalizeSchoolStartTime('')).toBe(null);
    expect(normalizeSchoolStartTime(null)).toBe(null);
    expect(normalizeSchoolStartTime('25:00')).toBe(null);
    expect(normalizeSchoolStartTime('8')).toBe(null);
  });
});

describe('isPastSchoolStart', () => {
  it('is true at and after start', () => {
    const at = new Date(2026, 7, 7, 8, 30, 0);
    const after = new Date(2026, 7, 7, 9, 0, 0);
    expect(isPastSchoolStart('08:30', at)).toBe(true);
    expect(isPastSchoolStart('08:30', after)).toBe(true);
  });

  it('is false before start', () => {
    const before = new Date(2026, 7, 7, 8, 29, 0);
    expect(isPastSchoolStart('08:30', before)).toBe(false);
  });
});

describe('applySchoolStartTardy', () => {
  const roster = [{ id: 1 }, { id: 2 }, { id: '3' }];
  const now = new Date(2026, 7, 7, 9, 0, 0);

  it('marks unmarked students tardy after start', () => {
    const day = {
      submitted: false,
      marks: { '1': 'present' },
      lunch: {},
    };
    const next = applySchoolStartTardy(day, roster, {
      startTime: '08:00',
      now,
      dayKey: '2026-08-07',
      todayKey: '2026-08-07',
    });
    expect(next.marks).toEqual({
      '1': 'present',
      '2': 'tardy',
      '3': 'tardy',
    });
  });

  it('no-ops before start, when unset, submitted, or wrong day', () => {
    const day = { submitted: false, marks: {}, lunch: {} };
    expect(
      applySchoolStartTardy(day, roster, {
        startTime: '10:00',
        now,
        dayKey: '2026-08-07',
        todayKey: '2026-08-07',
      }),
    ).toBe(day);
    expect(
      applySchoolStartTardy(day, roster, {
        startTime: null,
        now,
        dayKey: '2026-08-07',
        todayKey: '2026-08-07',
      }),
    ).toBe(day);
    expect(
      applySchoolStartTardy(
        { ...day, submitted: true },
        roster,
        {
          startTime: '08:00',
          now,
          dayKey: '2026-08-07',
          todayKey: '2026-08-07',
        },
      ),
    ).toEqual({ ...day, submitted: true });
    expect(
      applySchoolStartTardy(day, roster, {
        startTime: '08:00',
        now,
        dayKey: '2026-08-06',
        todayKey: '2026-08-07',
      }),
    ).toBe(day);
  });
});
