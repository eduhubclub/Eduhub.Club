import { describe, expect, it } from 'vitest';
import {
  buildMonthWeekSpans,
  isMultiDayOccurrence,
  packSpanLanes,
  uniqueMultiDayEvents,
} from './monthEventSpans.js';

describe('isMultiDayOccurrence', () => {
  it('detects ranged events', () => {
    expect(
      isMultiDayOccurrence({
        kind: 'event',
        eventStart: '2026-03-09',
        eventEnd: '2026-03-12',
      }),
    ).toBe(true);
  });

  it('ignores single-day and birthdays', () => {
    expect(
      isMultiDayOccurrence({
        kind: 'event',
        eventStart: '2026-03-09',
        eventEnd: '2026-03-09',
      }),
    ).toBe(false);
    expect(
      isMultiDayOccurrence({
        kind: 'birthday',
        eventStart: '2026-03-09',
        eventEnd: '2026-03-12',
      }),
    ).toBe(false);
  });
});

describe('packSpanLanes', () => {
  it('stacks overlapping segments', () => {
    const packed = packSpanLanes([
      { startCol: 0, endCol: 3 },
      { startCol: 2, endCol: 4 },
      { startCol: 5, endCol: 6 },
    ]);
    const byRange = Object.fromEntries(
      packed.map((s) => [`${s.startCol}-${s.endCol}`, s.lane]),
    );
    expect(byRange['0-3']).toBe(0);
    expect(byRange['2-4']).toBe(1);
    expect(byRange['5-6']).toBe(0);
  });
});

describe('buildMonthWeekSpans', () => {
  it('draws one bar across days in a week', () => {
    const days = [
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
    ];
    const occurrences = [
      {
        id: 'evt-1-2026-03-09',
        kind: 'event',
        classId: 'c1',
        sourceEventId: 'golf',
        title: 'Golf Tournament',
        color: '#6366f1',
        eventStart: '2026-03-09',
        eventEnd: '2026-03-12',
        date: '2026-03-09',
      },
      {
        id: 'evt-1-2026-03-10',
        kind: 'event',
        classId: 'c1',
        sourceEventId: 'golf',
        title: 'Golf Tournament',
        color: '#6366f1',
        eventStart: '2026-03-09',
        eventEnd: '2026-03-12',
        date: '2026-03-10',
      },
    ];
    const { weeks } = buildMonthWeekSpans(days, occurrences);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].spans).toHaveLength(1);
    expect(weeks[0].spans[0].startCol).toBe(1);
    expect(weeks[0].spans[0].endCol).toBe(4);
    expect(weeks[0].laneCount).toBe(1);
  });

  it('dedupes uniqueMultiDayEvents', () => {
    const list = uniqueMultiDayEvents([
      {
        kind: 'event',
        classId: 'c1',
        sourceEventId: 'golf',
        eventStart: '2026-03-09',
        eventEnd: '2026-03-12',
      },
      {
        kind: 'event',
        classId: 'c1',
        sourceEventId: 'golf',
        eventStart: '2026-03-09',
        eventEnd: '2026-03-12',
      },
    ]);
    expect(list).toHaveLength(1);
  });
});
