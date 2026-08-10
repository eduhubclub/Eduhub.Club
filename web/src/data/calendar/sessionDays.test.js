import { describe, expect, it } from 'vitest';
import { normalizeLayer, toIsoDate, addDaysIso } from './calendarModel.js';
import {
  isSessionDay,
  rotationIndexForDate,
  rotationSlotForDate,
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
