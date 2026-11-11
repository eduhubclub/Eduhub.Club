import { describe, expect, it } from 'vitest';
import {
  getDemoDistrictRoster,
  resetDemoDistrictRosterCache,
  STUDENTS_PER_CLASS,
} from './demoDistrictRoster.js';
import { studentsAtSchool, seedDistrictOrg } from './districtModel.js';
import { departmentForRole } from './staffDepartments.js';

describe('full demo roster', () => {
  it('has unique student ids and full Wayside enrollment', () => {
    resetDemoDistrictRosterCache();
    const { classes, classSchools, staffBySchool } = getDemoDistrictRoster();
    const ids = classes.flatMap((c) => (c.studentList || []).map((s) => s.id));
    const names = classes.flatMap((c) => (c.studentList || []).map((s) => s.name));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(ids).toHaveLength(classes.length * STUDENTS_PER_CLASS);
    expect(classes).toHaveLength(18 * 4 + 9 + 12);

    const jewls = classes.find((c) => c.id === 'demo-3rd-grade');
    expect(jewls?.studentList?.[0]?.name).toBe('Booker T. Washington');
    expect(jewls?.studentList?.[1]?.name).toBe('Harriet Tubman');

    const withSiblings = classes
      .flatMap((c) => c.studentList || [])
      .filter((s) => (s.siblingIds || []).length > 0);
    expect(withSiblings.length).toBeGreaterThan(40);

    for (const schoolId of Object.keys(staffBySchool)) {
      const schoolStudents = classes
        .filter((c) => classSchools[c.id] === schoolId)
        .flatMap((c) => c.studentList || []);
      const otherCount = schoolStudents.filter((s) => {
        const g = String(s.gender || '').trim().toLowerCase();
        return !g || (!g.startsWith('f') && !g.startsWith('m'));
      }).length;
      expect(otherCount).toBeGreaterThanOrEqual(1);
      expect(otherCount).toBeLessThanOrEqual(2);
    }

    const org = seedDistrictOrg();
    const wayside = org.schools.find((s) => s.id === 'sch-wayside');
    const waysideClasses = classes.filter((c) => classSchools[c.id] === 'sch-wayside');
    expect(waysideClasses).toHaveLength(18);
    expect(studentsAtSchool(waysideClasses, wayside, org)).toHaveLength(18 * STUDENTS_PER_CLASS);
    expect(staffBySchool['sch-wayside'].filter((s) => s.classId)).toHaveLength(18);
    expect(staffBySchool['sch-sweet-valley'].filter((s) => s.classId)).toHaveLength(9);
    expect(staffBySchool['sch-hogwarts'].filter((s) => s.classId)).toHaveLength(12);
    const waysideRoles = new Set(staffBySchool['sch-wayside'].map((s) => s.role));
    for (const role of [
      'Building Manager',
      'Admin Assistant',
      'Office Assistant',
      'Registrar',
      'Librarian',
      'Coach',
      'Reading Specialist',
      'Playground Staff',
      'Counselor',
      'Psychologist',
      'OT/PT (SAILS)',
      'Paraeducator',
      'Custodian',
    ]) {
      expect(waysideRoles.has(role)).toBe(true);
    }
    expect(staffBySchool['sch-wayside'].filter((s) => s.role === 'Paraeducator')).toHaveLength(12);
    expect(staffBySchool['sch-wayside'].filter((s) => s.role === 'Cafeteria Staff')).toHaveLength(3);
    expect(staffBySchool['sch-wayside'].filter((s) => s.role === 'Custodian')).toHaveLength(2);
    expect(staffBySchool['sch-wayside'].some((s) => s.role === 'Security Officer')).toBe(false);
    expect(staffBySchool['sch-sweet-valley'].filter((s) => s.role === 'Security Officer')).toHaveLength(1);
    expect(staffBySchool['sch-hogwarts'].filter((s) => s.role === 'Security Officer')).toHaveLength(1);
    expect(staffBySchool['sch-sweet-valley'].filter((s) => s.role === 'Cafeteria Staff')).toHaveLength(3);
    expect(
      staffBySchool['sch-wayside'].every(
        (s) => s.department && s.department === departmentForRole(s.role),
      ),
    ).toBe(true);
    expect(classes.every((cls) => Boolean(cls.coverUrl))).toBe(true);
  });
});
