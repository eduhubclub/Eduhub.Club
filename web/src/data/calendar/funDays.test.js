import { describe, expect, it } from 'vitest';
import {
  FUN_DAYS,
  expandFunDays,
  funDayOptionsOn,
} from './funDays.js';

describe('FUN_DAYS catalog', () => {
  it('covers every calendar day including leap day', () => {
    expect(FUN_DAYS).toHaveLength(366);
    expect(FUN_DAYS.some((e) => e.month === 2 && e.day === 29)).toBe(true);
    for (const entry of FUN_DAYS) {
      expect(entry.options.length).toBeGreaterThanOrEqual(1);
      expect(entry.options.length).toBeLessThanOrEqual(2);
    }
  });

  it('keeps V-J Day and Hot Sauce Day; applies school-safe swaps', () => {
    const labels = (m, d) =>
      FUN_DAYS.find((e) => e.month === m && e.day === d).options.map(
        (o) => o.label,
      );

    expect(labels(1, 22)).toContain('Hot Sauce Day');
    expect(labels(9, 2)).toContain('V-J Day');
    expect(labels(9, 11)).toContain('Patriot Day');
    expect(labels(7, 14)).toContain('Bastille Day');

    expect(labels(1, 12)).toEqual([
      'Marzipan Day',
      'National Clean Off Your Desk Day',
    ]);
    expect(labels(1, 26)).toEqual(['Australia Day', 'Have Fun At Work Day']);
    expect(labels(6, 4)).toContain('National Cheese Day');
    expect(labels(6, 4)).not.toContain('Cognac Day');
    expect(labels(6, 14)).toContain('National Strawberry Shortcake Day');
    expect(labels(7, 2)).toContain('National I Forgot Day');
    expect(labels(7, 5)).toContain('National Graham Cracker Day');
    expect(labels(7, 6)).toContain('National Hand Roll Day');
    expect(labels(7, 10)).toContain('National French Fry Day');
    expect(labels(7, 19)).toContain('National Play Day');
    expect(labels(7, 24)).toContain('National Cousins Day');
    expect(labels(8, 5)).toEqual([
      'Work Like a Dog Day',
      'International Traffic Light Day',
    ]);
  });

  it('includes global observances', () => {
    const globals = FUN_DAYS.flatMap((e) =>
      e.options.filter((o) => o.kind === 'global').map((o) => o.label),
    );
    expect(globals).toEqual(
      expect.arrayContaining([
        'World Read Aloud Day',
        'Canada Day',
        'Australia Day',
        'International Women\'s Day',
        'World Water Day',
        'Bastille Day',
      ]),
    );
  });
});

describe('expandFunDays', () => {
  it('expands options inside a range and skips Feb 29 on non-leap years', () => {
    const rows = expandFunDays({
      rangeStart: '2025-02-28',
      rangeEnd: '2025-03-01',
    });
    expect(rows.some((r) => r.date === '2025-02-29')).toBe(false);

    const leap = expandFunDays({
      rangeStart: '2024-02-28',
      rangeEnd: '2024-03-01',
    });
    expect(leap.some((r) => r.date === '2024-02-29')).toBe(true);
  });

  it('can filter by kind', () => {
    const rows = expandFunDays({
      rangeStart: '2026-07-01',
      rangeEnd: '2026-07-01',
      kinds: ['global'],
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.kind === 'global')).toBe(true);
  });
});

describe('funDayOptionsOn', () => {
  it('returns options for an ISO date', () => {
    const opts = funDayOptionsOn('2026-09-11');
    expect(opts.map((o) => o.label)).toContain('Patriot Day');
  });
});
