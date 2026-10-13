import { describe, expect, it } from 'vitest';
import {
  formatDayLabel,
  normalizeSchedule,
  normalizeTemplate,
  templateForDate,
} from './scheduleModel.js';

describe('normalizeSchedule', () => {
  it('seeds a regular-day template when empty', () => {
    const s = normalizeSchedule(null);
    expect(s.mode).toBe('daySlots');
    expect(s.templates.length).toBe(1);
    expect(s.templates[0].slots.length).toBeGreaterThanOrEqual(3);
  });

  it('preserves periods mode', () => {
    const s = normalizeSchedule({
      mode: 'periods',
      templates: [
        {
          name: 'Bell',
          slots: [
            { label: 'P1', startTime: '08:00', endTime: '08:45', order: 0 },
            { label: 'P2', startTime: '08:50', endTime: '09:35', order: 1 },
          ],
        },
      ],
    });
    expect(s.mode).toBe('periods');
    expect(s.templates[0].slots[0].startTime).toBe('08:00');
  });
});

describe('templateForDate', () => {
  it('uses weekday override when set', () => {
    const early = normalizeTemplate({
      id: 'early',
      name: 'Early',
      slots: [{ label: 'Math', order: 0 }],
    });
    const regular = normalizeTemplate({
      id: 'reg',
      name: 'Regular',
      slots: [{ label: 'Reading', order: 0 }],
    });
    const schedule = normalizeSchedule({
      templates: [regular, early],
      weekdayTemplateIds: { 5: 'early' }, // Friday
    });
    expect(templateForDate(schedule, '2026-09-04')?.id).toBe('early'); // Fri
    expect(templateForDate(schedule, '2026-09-03')?.id).toBe('reg'); // Thu
  });
});

describe('formatDayLabel', () => {
  it('formats Day #N', () => {
    expect(formatDayLabel(23)).toBe('Day #23');
    expect(formatDayLabel(1, 'Session')).toBe('Session #1');
  });
});
