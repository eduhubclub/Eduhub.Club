import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  applySchoolCalendarProposals,
  parseSchoolCalendarText,
} from './parseSchoolCalendarPdf.js';

const dir = dirname(fileURLToPath(import.meta.url));
const tahomaText = readFileSync(
  join(dir, 'fixtures/tahoma-2026-27.txt'),
  'utf8',
);

describe('parseSchoolCalendarText (Tahoma 2026-27)', () => {
  it('finds first/last day and major breaks', () => {
    const { startYear, schoolYearLabel, items } = parseSchoolCalendarText(
      tahomaText,
    );
    expect(startYear).toBe(2026);
    expect(schoolYearLabel).toBe('2026–2027');

    const byKind = (k) => items.filter((i) => i.kind === k);
    const first = byKind('firstDay');
    const last = byKind('lastDay');
    expect(first.some((i) => i.startDate === '2026-08-26')).toBe(true);
    expect(last.some((i) => i.startDate === '2027-06-15')).toBe(true);

    const breaks = byKind('break');
    const labels = breaks.map((b) => b.label);
    expect(labels.some((l) => /Winter Break/i.test(l))).toBe(true);
    expect(labels.some((l) => /Mid Winter Break/i.test(l))).toBe(true);
    expect(labels.some((l) => /Spring Break/i.test(l))).toBe(true);

    const winter = breaks.find((b) => /Winter Break/i.test(b.label) && !/Mid/i.test(b.label));
    expect(winter?.startDate).toBe('2026-12-21');
    expect(winter?.endDate).toBe('2027-01-01');

    const spring = breaks.find((b) => /Spring Break/i.test(b.label));
    expect(spring?.startDate).toBe('2027-04-05');
    expect(spring?.endDate).toBe('2027-04-09');

    const mid = breaks.find((b) => /Mid Winter Break/i.test(b.label));
    expect(mid?.startDate).toBe('2027-02-16');
    expect(mid?.endDate).toBe('2027-02-19');
  });

  it('includes Labor Day and Thanksgiving as closures', () => {
    const { items } = parseSchoolCalendarText(tahomaText);
    const closures = items.filter((i) => i.kind === 'closure');
    expect(
      closures.some(
        (c) => c.startDate === '2026-09-07' && /Labor Day/i.test(c.label),
      ),
    ).toBe(true);
    expect(
      closures.some(
        (c) =>
          c.startDate === '2026-11-26' &&
          c.endDate === '2026-11-27' &&
          /Thanksgiving/i.test(c.label),
      ),
    ).toBe(true);
  });

  it('applies selected proposals into academic + closures', () => {
    const { items } = parseSchoolCalendarText(tahomaText);
    const result = applySchoolCalendarProposals(
      {
        startDate: '2026-09-01',
        endDate: '2027-06-15',
        workingDays: [1, 2, 3, 4, 5],
        breaks: [],
        observeNationalHolidays: true,
      },
      [],
      items,
    );
    expect(result.academic.startDate).toBe('2026-08-26');
    expect(result.academic.endDate).toBe('2027-06-15');
    expect(result.academic.breaks.length).toBeGreaterThanOrEqual(3);
    expect(result.closures.some((c) => c.date === '2026-10-09')).toBe(true);
  });
});

describe('parseSchoolCalendarText (Tahoma pdf.js reading order)', () => {
  it('still finds first/last/breaks from browser-like text', () => {
    const text = readFileSync(
      join(dir, 'fixtures/tahoma-2026-27-pdfjs.txt'),
      'utf8',
    );
    const { items } = parseSchoolCalendarText(text);
    expect(items.some((i) => i.kind === 'firstDay' && i.startDate === '2026-08-26')).toBe(true);
    expect(items.some((i) => i.kind === 'lastDay' && i.startDate === '2027-06-15')).toBe(true);
    expect(items.some((i) => /Spring Break/i.test(i.label) && i.startDate === '2027-04-05')).toBe(true);
    expect(items.some((i) => /Winter Break/i.test(i.label) && !/Mid/i.test(i.label) && i.startDate === '2026-12-21')).toBe(true);

    const winters = items.filter(
      (i) => /Winter Break/i.test(i.label) && !/Mid/i.test(i.label),
    );
    expect(winters).toHaveLength(1);
    expect(winters[0].endDate).toBe('2027-01-01');
    expect(
      items.every((i) => i.endDate >= i.startDate),
    ).toBe(true);
    expect(
      items
        .filter((i) => i.kind === 'firstDay')
        .every((i) => !/S M T W/i.test(i.label)),
    ).toBe(true);
  });
});
