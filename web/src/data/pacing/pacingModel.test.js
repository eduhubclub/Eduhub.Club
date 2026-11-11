import { describe, expect, it } from 'vitest';
import {
  buildDistrictPlacements,
  createPacingFromOnboarding,
  isInstructionalDay,
  nextInstructionalDay,
  paceLagDays,
  rollOpenPlacements,
  toIsoDate,
} from './pacingModel';
import {
  availableMinutesByContent,
  getGradeSchedule,
  totalInstructionalMinutes,
} from './schoolSeed';

describe('schoolSeed TES', () => {
  it('loads 3rd grade with instructional minutes', () => {
    const g3 = getGradeSchedule('tes', 'g3');
    expect(g3.label).toBe('3rd');
    expect(totalInstructionalMinutes(g3)).toBeGreaterThan(200);
    const blocks = availableMinutesByContent(g3);
    expect(blocks.some((b) => b.contentKey === 'a-and-l')).toBe(true);
    expect(blocks.some((b) => b.contentKey === 'math')).toBe(true);
  });
});

describe('pacingModel calendar', () => {
  it('skips weekends and block-outs', () => {
    // 2026-11-06 is Friday
    expect(isInstructionalDay('2026-11-06')).toBe(true);
    expect(isInstructionalDay('2026-11-07')).toBe(false);
    expect(nextInstructionalDay('2026-11-06')).toBe('2026-11-09');
    expect(nextInstructionalDay('2026-11-06', new Set(['2026-11-09']))).toBe(
      '2026-11-10',
    );
  });

  it('builds district placements for onboarded pacing', () => {
    const pacing = createPacingFromOnboarding({
      title: 'A & L',
      contentKey: 'a-and-l',
      averageLessonMinutes: 60,
      unitLessonCounts: [2, 1],
      startDate: '2026-11-09',
    });
    expect(pacing.units).toHaveLength(2);
    const placements = buildDistrictPlacements(pacing, []);
    expect(placements).toHaveLength(3);
    expect(placements[0].date).toBe('2026-11-09');
    expect(placements[1].date).toBe('2026-11-10');
    expect(placements[2].date).toBe('2026-11-11');
  });

  it('rolls open teacher placements to next instructional day', () => {
    const next = rollOpenPlacements(
      [
        {
          id: 'a',
          pacingId: 'p',
          slotId: 's',
          date: '2026-11-09',
          contentKey: 'math',
          status: 'open',
          source: 'teacher',
          minutesPlanned: 45,
          notes: '',
        },
        {
          id: 'b',
          pacingId: 'p',
          slotId: 's2',
          date: '2026-11-09',
          contentKey: 'math',
          status: 'done',
          source: 'teacher',
          minutesPlanned: 45,
          notes: '',
        },
      ],
      '2026-11-09',
      [],
    );
    expect(next.find((p) => p.id === 'a').date).toBe('2026-11-10');
    expect(next.find((p) => p.id === 'b').date).toBe('2026-11-09');
  });

  it('reports pace lag', () => {
    const store = {
      pacings: [
        {
          id: 'p1',
          title: 'Math',
          contentKey: 'math',
          averageLessonMinutes: 45,
          units: [],
          startDate: '2026-11-02',
        },
      ],
      districtPlacements: [
        {
          id: 'd1',
          pacingId: 'p1',
          slotId: 's1',
          date: '2026-11-09',
          contentKey: 'math',
          status: 'open',
          source: 'district',
          minutesPlanned: 45,
          notes: '',
        },
      ],
      teacherPlacements: [
        {
          id: 't1',
          pacingId: 'p1',
          slotId: 's1',
          date: '2026-11-02',
          contentKey: 'math',
          status: 'open',
          source: 'teacher',
          minutesPlanned: 45,
          notes: '',
        },
      ],
      blockOutDates: [],
    };
    const lag = paceLagDays(store, '2026-11-09', []);
    expect(lag).toBeGreaterThanOrEqual(5);
    expect(toIsoDate(new Date('2026-11-09T12:00:00'))).toMatch(/2026-11-09/);
  });
});
