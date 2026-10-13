import { describe, expect, it } from 'vitest';
import {
  isoForSessionDayNumber,
  sessionDayNumber,
  todaySessionDayNumber,
} from './dayNumber.js';

const academic = {
  startDate: '2026-09-01', // Tue
  endDate: '2026-09-18',
  workingDays: [1, 2, 3, 4, 5],
  breaks: [],
  observeNationalHolidays: false,
};

describe('sessionDayNumber', () => {
  it('numbers the first session day as Day #1', () => {
    expect(sessionDayNumber('2026-09-01', academic, [])).toBe(1);
    expect(sessionDayNumber('2026-09-02', academic, [])).toBe(2);
  });

  it('skips weekends and closures', () => {
    // Fri Sep 4 = day 4; Mon Sep 7 = day 5
    expect(sessionDayNumber('2026-09-04', academic, [])).toBe(4);
    expect(sessionDayNumber('2026-09-05', academic, [])).toBe(null); // Sat
    expect(sessionDayNumber('2026-09-07', academic, [])).toBe(5);
    expect(
      sessionDayNumber('2026-09-02', academic, [
        { date: '2026-09-02', label: 'Snow' },
      ]),
    ).toBe(null);
    expect(
      sessionDayNumber('2026-09-03', academic, [
        { date: '2026-09-02', label: 'Snow' },
      ]),
    ).toBe(2); // Wed becomes day 2 after snow Tue
  });

  it('applies anchorSessionDay offset', () => {
    expect(
      sessionDayNumber('2026-09-01', academic, [], { anchorSessionDay: 23 }),
    ).toBe(23);
    expect(
      sessionDayNumber('2026-09-02', academic, [], { anchorSessionDay: 23 }),
    ).toBe(24);
  });
});

describe('isoForSessionDayNumber', () => {
  it('round-trips Day #N to an ISO date', () => {
    expect(isoForSessionDayNumber(1, academic, [])).toBe('2026-09-01');
    expect(isoForSessionDayNumber(5, academic, [])).toBe('2026-09-07');
    expect(
      isoForSessionDayNumber(23, academic, [], { anchorSessionDay: 23 }),
    ).toBe('2026-09-01');
  });
});

describe('todaySessionDayNumber', () => {
  it('uses the provided now date', () => {
    expect(
      todaySessionDayNumber(academic, [], {}, new Date(2026, 8, 3)),
    ).toBe(3);
  });
});
