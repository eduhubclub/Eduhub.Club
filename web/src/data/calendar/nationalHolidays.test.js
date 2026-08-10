import { describe, expect, it } from 'vitest';
import {
  lookupNationalHoliday,
  nationalHolidaysForYear,
  nationalHolidaysInRange,
} from './nationalHolidays.js';
import { isSessionDay, rotationIndexForDate } from './sessionDays.js';
import { normalizeLayer } from './calendarModel.js';

describe('nationalHolidaysForYear', () => {
  it('computes Labor Day and Thanksgiving for 2026', () => {
    const list = nationalHolidaysForYear(2026);
    expect(list.find((h) => h.id === 'labor-2026')?.date).toBe('2026-09-07');
    expect(list.find((h) => h.id === 'thanksgiving-2026')?.date).toBe(
      '2026-11-26',
    );
    expect(list.find((h) => h.id === 'thanksgiving-fri-2026')?.date).toBe(
      '2026-11-27',
    );
    expect(list.find((h) => h.id === 'mlk-2026')?.date).toBe('2026-01-19');
  });

  it('observes fixed holidays that fall on weekends', () => {
    // 2021-12-25 was Saturday → observed Friday Dec 24
    expect(lookupNationalHoliday('2021-12-24')?.label).toBe('Christmas Day');
    // 2022-01-01 was Saturday → observed Friday Dec 31 2021
    expect(lookupNationalHoliday('2021-12-31')?.label).toBe("New Year's Day");
  });
});

describe('national holidays close session days', () => {
  const academic = {
    startDate: '2026-09-01',
    endDate: '2027-06-15',
    workingDays: [1, 2, 3, 4, 5],
    breaks: [],
    observeNationalHolidays: true,
  };

  const layer = normalizeLayer({
    id: 'rot1',
    name: 'Specialists',
    type: 'rotation',
    anchorDate: '2026-09-01',
    slots: [
      { id: 's0', label: 'P.E.', color: '#0ea5e9' },
      { id: 's1', label: 'STEM', color: '#10b981' },
    ],
  });

  it('marks Labor Day as non-session and pauses rotation', () => {
    expect(isSessionDay('2026-09-07', academic, [])).toBe(false); // Labor Day Mon
    expect(isSessionDay('2026-09-08', academic, [])).toBe(true);
    // Sep 1 Tue = 0, Sep 2 Wed = 1, Sep 3 Thu = 0, Sep 4 Fri = 1,
    // Sep 7 holiday skipped, Sep 8 Tue continues as next index after Sep 4
    expect(rotationIndexForDate('2026-09-04', layer, academic, [])).toBe(1);
    expect(rotationIndexForDate('2026-09-08', layer, academic, [])).toBe(0);
  });

  it('can be disabled per academic settings', () => {
    expect(
      isSessionDay('2026-09-07', { ...academic, observeNationalHolidays: false }, []),
    ).toBe(true);
  });

  it('lists holidays inside the academic year range', () => {
    const inYear = nationalHolidaysInRange('2026-09-01', '2027-06-15');
    expect(inYear.some((h) => h.label === 'Labor Day')).toBe(true);
    expect(inYear.some((h) => h.label === 'Thanksgiving')).toBe(true);
    expect(inYear.some((h) => h.label === 'Memorial Day')).toBe(true);
    expect(inYear.some((h) => h.label === 'Independence Day')).toBe(false);
  });
});
