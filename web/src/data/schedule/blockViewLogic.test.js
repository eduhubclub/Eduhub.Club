import { describe, expect, it } from 'vitest';
import { normalizeSchedule } from './scheduleModel.js';
import { demoClassScheduleSeed } from './demoScheduleSeed.js';
import {
  buildWeekBlockLayout,
  MIN_BLOCK_HEIGHT_PX,
  minutesToTimeLabel,
  packLanes,
  resolvePxPerMin,
  startOfWeekIso,
  timeToMinutes,
  weekDayIsos,
} from './blockViewLogic.js';

describe('time helpers', () => {
  it('parses HH:MM', () => {
    expect(timeToMinutes('09:10')).toBe(9 * 60 + 10);
    expect(timeToMinutes('13:50')).toBe(13 * 60 + 50);
    expect(timeToMinutes('bad')).toBe(null);
  });

  it('formats minutes', () => {
    expect(minutesToTimeLabel(9 * 60 + 10)).toBe('9:10 AM');
    expect(minutesToTimeLabel(14 * 60 + 10)).toBe('2:10 PM');
  });
});

describe('packLanes', () => {
  it('puts overlapping blocks in separate lanes', () => {
    const { laneByIndex, laneCount } = packLanes([
      { startMin: 100, endMin: 120 },
      { startMin: 110, endMin: 130 },
      { startMin: 130, endMin: 140 },
    ]);
    expect(laneCount).toBe(2);
    expect(laneByIndex[0]).toBe(0);
    expect(laneByIndex[1]).toBe(1);
    expect(laneByIndex[2]).toBe(0);
  });
});

describe('buildWeekBlockLayout', () => {
  it('lays out demo M–Th and Friday across the week', () => {
    const schedule = normalizeSchedule(demoClassScheduleSeed());
    // Week of Mon 2026-10-05
    const days = weekDayIsos('2026-10-05', 5);
    expect(startOfWeekIso('2026-10-07', 1)).toBe('2026-10-05');
    const layout = buildWeekBlockLayout(schedule, days);
    expect(layout.days).toHaveLength(5);
    expect(layout.days[0].templateName).toBe('Monday–Thursday');
    expect(layout.days[4].templateName).toBe('Friday');
    const mathMon = layout.days[0].blocks.find((b) => b.label === 'Math');
    const mathFri = layout.days[4].blocks.find((b) => b.label === 'Math');
    expect(mathMon.startMin).toBe(timeToMinutes('12:50'));
    expect(mathFri.startMin).toBe(timeToMinutes('12:40'));
    expect(layout.heightPx).toBeGreaterThan(1000);
    // Full-width day columns (no side-by-side lanes)
    expect(mathMon.laneCount).toBe(1);
    expect(layout.days[0].blocks.every((b) => b.laneCount === 1)).toBe(true);
    // Shortest demo block is 5 min → scale so it is at least MIN_BLOCK_HEIGHT_PX
    expect(layout.shortestDurationMin).toBe(5);
    expect(layout.pxPerMin).toBe(resolvePxPerMin(5));
    expect(layout.pxPerMin * 5).toBeGreaterThanOrEqual(MIN_BLOCK_HEIGHT_PX);
  });
});

describe('resolvePxPerMin', () => {
  it('raises scale for short blocks without breaking a constant hour ratio', () => {
    expect(resolvePxPerMin(5)).toBe(MIN_BLOCK_HEIGHT_PX / 5);
    expect(resolvePxPerMin(60)).toBeGreaterThanOrEqual(3.2);
  });
});
