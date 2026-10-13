import { describe, expect, it } from 'vitest';
import { normalizeSchedule, templateForDate } from './scheduleModel.js';
import { demoClassScheduleSeed } from './demoScheduleSeed.js';

describe('demoClassScheduleSeed', () => {
  it('uses periods mode with M–Th and Friday templates', () => {
    const s = normalizeSchedule(demoClassScheduleSeed());
    expect(s.mode).toBe('periods');
    expect(s.templates).toHaveLength(2);
    expect(s.templates[0].name).toBe('Monday–Thursday');
    expect(s.templates[1].name).toBe('Friday');
    expect(s.templates[0].slots.some((x) => x.label === 'Math')).toBe(true);
    expect(s.templates[0].slots.find((x) => x.label === 'Math')?.startTime).toBe(
      '12:50',
    );
  });

  it('maps weekdays to the correct template', () => {
    const s = normalizeSchedule(demoClassScheduleSeed());
    // 2026-10-05 = Monday
    expect(templateForDate(s, '2026-10-05')?.name).toBe('Monday–Thursday');
    // 2026-10-09 = Friday
    expect(templateForDate(s, '2026-10-09')?.name).toBe('Friday');
  });

  it('gives Friday its own shorter day blocks', () => {
    const s = normalizeSchedule(demoClassScheduleSeed());
    const fri = s.templates.find((t) => t.id === 'demo-tmpl-fri');
    expect(fri.slots.find((x) => x.label === 'Math')?.startTime).toBe('12:40');
    expect(fri.slots.find((x) => x.label === 'Dismissal')?.startTime).toBe(
      '14:10',
    );
    expect(fri.slots.some((x) => x.label === 'Science / SEL / PDR')).toBe(true);
  });
});
