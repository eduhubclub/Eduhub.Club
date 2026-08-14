import { describe, expect, it } from 'vitest';
import { normalizeLayer, toIsoDate, addDaysIso } from './calendarModel.js';
import {
  isSessionDay,
  rotationIndexForDate,
  rotationSlotForDate,
  academicYearMarker,
  breakOn,
  breakWorkingDaysInYear,
  schoolDaysInYear,
  schoolDaysRemaining,
} from './sessionDays.js';

const academic = {
  startDate: '2026-09-01',
  endDate: '2027-06-15',
  workingDays: [1, 2, 3, 4, 5],
  breaks: [],
};

const layer = normalizeLayer({
  id: 'rot1',
  name: 'Specialists',
  type: 'rotation',
  anchorDate: '2026-09-01', // Tuesday
  slots: [
    { id: 's0', label: 'P.E.', color: '#0ea5e9' },
    { id: 's1', label: 'STEM', color: '#10b981' },
    { id: 's2', label: 'Art', color: '#f43f5e' },
  ],
});

describe('isSessionDay', () => {
  it('respects working days and closures', () => {
    expect(isSessionDay('2026-09-01', academic, [])).toBe(true); // Tue
    expect(isSessionDay('2026-09-05', academic, [])).toBe(false); // Sat
    expect(
      isSessionDay('2026-09-02', academic, [{ date: '2026-09-02', label: 'Snow' }]),
    ).toBe(false);
  });
});

describe('academicYearMarker', () => {
  it('labels First Day and Last Day from academic settings', () => {
    expect(academicYearMarker('2026-09-01', academic)?.label).toBe('First Day');
    expect(academicYearMarker('2027-06-15', academic)?.label).toBe('Last Day');
    expect(academicYearMarker('2026-09-02', academic)).toBe(null);
  });

  it('combines when start and end are the same date', () => {
    expect(
      academicYearMarker('2026-09-01', {
        ...academic,
        startDate: '2026-09-01',
        endDate: '2026-09-01',
      })?.label,
    ).toBe('First & Last Day');
  });
});

describe('defaultAcademicYear', () => {
  it('uses late-August through mid-June for the current cycle', async () => {
    const { defaultAcademicYear } = await import('./calendarModel.js');
    const y = defaultAcademicYear(new Date(2026, 7, 10)); // Aug 10, 2026
    expect(y.startDate).toBe('2026-08-26');
    expect(y.endDate).toBe('2027-06-16');
  });
});

describe('schoolDaysRemaining', () => {
  it('counts session days left through Last Day, inclusive of today', () => {
    // Short year: Mon–Fri Sep 1–5 2026 only (Tue–Fri = 4 session days; Sep 1 is Tue)
    const short = {
      ...academic,
      startDate: '2026-09-01',
      endDate: '2026-09-04', // Tue–Fri
    };
    expect(schoolDaysInYear(short, [])).toBe(4);
    expect(schoolDaysRemaining(short, [], '2026-09-01')).toBe(4);
    expect(schoolDaysRemaining(short, [], '2026-09-03')).toBe(2);
    expect(schoolDaysRemaining(short, [], '2026-09-05')).toBe(0);
  });

  it('before First Day returns the full year total', () => {
    expect(schoolDaysRemaining(academic, [], '2026-08-01')).toBe(
      schoolDaysInYear(academic, []),
    );
  });

  it('matches Demo Class dates with breaks and holidays', () => {
    const demo = {
      startDate: '2026-08-26',
      endDate: '2027-06-16',
      workingDays: [1, 2, 3, 4, 5],
      observeNationalHolidays: true,
      breaks: [
        {
          id: 'winter',
          name: 'Winter Break',
          startDate: '2026-12-21',
          endDate: '2027-01-01',
        },
        {
          id: 'mid',
          name: 'Mid Winter Break',
          startDate: '2027-02-15',
          endDate: '2027-02-19',
        },
        {
          id: 'spring',
          name: 'Spring Break',
          startDate: '2027-04-05',
          endDate: '2027-04-23',
        },
      ],
    };
    expect(schoolDaysInYear(demo, [])).toBe(174);
    expect(schoolDaysRemaining(demo, [], '2026-08-10')).toBe(174);
    expect(breakWorkingDaysInYear(demo)).toBeGreaterThan(0);
    expect(breakOn('2026-12-22', demo)?.label).toBe('Winter Break');
    expect(breakOn('2027-04-10', demo)?.label).toBe('Spring Break');
    expect(breakOn('2026-09-01', demo)).toBe(null);
  });
});

describe('rotation pause on snow day', () => {
  it('does not consume a slot on a snow day', () => {
    // Sep 1 Tue = index 0 PE
    expect(rotationIndexForDate('2026-09-01', layer, academic, [])).toBe(0);
    // Sep 2 Wed = index 1 STEM
    expect(rotationIndexForDate('2026-09-02', layer, academic, [])).toBe(1);

    const snow = [{ date: '2026-09-02', label: 'Snow' }];
    // Sep 2 not a session
    expect(rotationSlotForDate('2026-09-02', layer, academic, snow)).toBe(null);
    // Sep 3 Thu keeps STEM (same index Wed would have had)
    expect(rotationIndexForDate('2026-09-03', layer, academic, snow)).toBe(1);
    expect(rotationSlotForDate('2026-09-03', layer, academic, snow).slot.label).toBe(
      'STEM',
    );
  });
});

describe('toIsoDate helpers', () => {
  it('round-trips local dates', () => {
    const iso = toIsoDate(new Date(2026, 8, 8));
    expect(iso).toBe('2026-09-08');
    expect(addDaysIso(iso, 1)).toBe('2026-09-09');
  });
});
