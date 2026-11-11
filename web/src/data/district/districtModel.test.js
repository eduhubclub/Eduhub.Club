import { describe, expect, it } from 'vitest';
import {
  canEditDistrict,
  classMatchesSchool,
  classesAtSchool,
  resolveClassSchoolId,
  scheduleForSchool,
  schoolAccessMode,
  seedDistrictOrg,
  teacherSchoolIds,
  teachingSummary,
  withBlockPeriods,
  withPeriodPatch,
  normalizeBuildingSchedule,
} from './districtModel.js';

describe('seed building schedule', () => {
  it('seeds a literary district with 4 elementary, 1 middle, 1 high', () => {
    const org = seedDistrictOrg();
    expect(org.name).toBe('Storywell School District');
    expect(org.schools.map((s) => s.name)).toEqual([
      'Wayside Elementary',
      'Crunchem Hall Elementary',
      'Avonlea Elementary',
      'Lark Creek Elementary',
      'Sweet Valley Middle',
      'Hogwarts High',
    ]);
    const wayside = org.schools[0];
    expect(wayside.address).toMatch(/Wayside/);
    expect(wayside.phone).toMatch(/555/);
    expect(wayside.bannerUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
    const waysideTeachers = org.staff['sch-wayside'].filter((row) => row.classId);
    expect(waysideTeachers).toHaveLength(18); // K–5 × 3
    expect(org.staff['sch-sweet-valley'].filter((row) => row.classId)).toHaveLength(9); // 6–8 × 3
    expect(org.staff['sch-hogwarts'].filter((row) => row.classId)).toHaveLength(12); // 9–12 × 3
    const jewls = waysideTeachers.find((row) => row.classId === 'demo-3rd-grade');
    expect(jewls?.name).toMatch(/Jewls/);
  });

  it('counts instructional minutes and keeps literacy together at Wayside', () => {
    const org = seedDistrictOrg();
    const schedule = scheduleForSchool(org, 'sch-wayside');
    const summary = teachingSummary(schedule);
    expect(summary.teachingMin).toBe(300);
    expect(summary.nonTeachingMin).toBe(90);
    expect(summary.unassignedMin).toBe(0);
    expect(summary.byArea.find((area) => area.id === 'literacy')?.minutes).toBe(195);
    expect(summary.byArea.find((area) => area.id === 'math')?.minutes).toBe(60);
    expect(schedule.dayStart).toBe('08:00');
    expect(schedule.dayEnd).toBe('14:30');
  });
});

describe('period ownership', () => {
  it('gives a period to one block only', () => {
    const schedule = normalizeBuildingSchedule({
      periods: [
        { id: 'p1', label: 'Block', startTime: '08:00', endTime: '09:00', kind: 'instruction' },
      ],
      blocks: [
        { id: 'b1', label: 'Math', contentArea: 'math', periodIds: ['p1'], order: 0 },
        { id: 'b2', label: 'Literacy', contentArea: 'literacy', periodIds: ['p1'], order: 1 },
      ],
    });
    expect(schedule.blocks[0].periodIds).toEqual(['p1']);
    expect(schedule.blocks[1].periodIds).toEqual([]);
    expect(teachingSummary(schedule).teachingMin).toBe(60);
    expect(teachingSummary(schedule).byArea).toEqual([
      { id: 'math', label: 'Math', minutes: 60 },
    ]);
  });

  it('moves a period onto the block that claims it', () => {
    const start = normalizeBuildingSchedule({
      periods: [
        { id: 'p1', label: 'A', startTime: '08:00', endTime: '08:30', kind: 'instruction' },
      ],
      blocks: [
        { id: 'b1', label: 'Math', contentArea: 'math', periodIds: ['p1'], order: 0 },
        { id: 'b2', label: 'Literacy', contentArea: 'literacy', periodIds: [], order: 1 },
      ],
    });
    const next = withBlockPeriods(start, 'b2', ['p1']);
    expect(next.blocks.find((block) => block.id === 'b1')?.periodIds).toEqual([]);
    expect(next.blocks.find((block) => block.id === 'b2')?.periodIds).toEqual(['p1']);
    expect(teachingSummary(next).byArea[0]).toMatchObject({ id: 'literacy', minutes: 30 });
  });

  it('drops a period from content blocks when it is not teaching time', () => {
    const start = normalizeBuildingSchedule({
      periods: [
        { id: 'p1', label: 'A', startTime: '08:00', endTime: '09:00', kind: 'instruction' },
      ],
      blocks: [
        { id: 'b1', label: 'Math', contentArea: 'math', periodIds: ['p1'], order: 0 },
      ],
    });
    const next = withPeriodPatch(start, 'p1', { kind: 'nonInstruction' });
    expect(next.blocks[0].periodIds).toEqual([]);
    expect(teachingSummary(next).teachingMin).toBe(0);
    expect(teachingSummary(next).nonTeachingMin).toBe(60);
  });
});

describe('class school links', () => {
  const school = { id: 'sch-wayside', name: 'Wayside Elementary' };

  it('infers a class from student school names', () => {
    const org = seedDistrictOrg();
    const cls = {
      id: 'inferred-class',
      studentList: [{ id: 's1', school: 'Wayside Elementary' }],
    };
    expect(resolveClassSchoolId(cls, org)).toBeUndefined();
    expect(classMatchesSchool(cls, school, org)).toBe(true);
    expect(classesAtSchool([cls], school, org)).toHaveLength(1);
  });

  it('keeps an explicit unlink from snapping back to the student school', () => {
    const org = {
      ...seedDistrictOrg(),
      classSchools: { 'inferred-class': null },
    };
    const cls = {
      id: 'inferred-class',
      schoolId: null,
      studentList: [{ id: 's1', school: 'Wayside Elementary' }],
    };
    expect(resolveClassSchoolId(cls, org)).toBeNull();
    expect(classMatchesSchool(cls, school, org)).toBe(false);
  });

  it('uses a saved school id even when the roster name differs', () => {
    const org = {
      ...seedDistrictOrg(),
      classSchools: { c1: 'sch-wayside' },
    };
    const cls = { id: 'c1', studentList: [{ id: 's1', school: 'Other' }] };
    expect(classMatchesSchool(cls, school, org)).toBe(true);
  });
});

describe('teacher vs admin access', () => {
  it('lets only admin edit the district', () => {
    expect(canEditDistrict({ role: 'admin' })).toBe(true);
    expect(canEditDistrict({ role: 'teacher' })).toBe(false);
  });

  it('marks the teacher school as own and other schools as surface', () => {
    const org = seedDistrictOrg();
    const classes = [
      {
        id: 'inferred-class',
        studentList: [{ id: 's1', school: 'Wayside Elementary' }],
      },
    ];
    expect(teacherSchoolIds(classes, org)).toEqual(['sch-wayside']);
    expect(schoolAccessMode(false, 'sch-wayside', ['sch-wayside'])).toBe('own');
    expect(schoolAccessMode(false, 'sch-other', ['sch-wayside'])).toBe('surface');
    expect(schoolAccessMode(true, 'sch-other', [])).toBe('edit');
  });
});
